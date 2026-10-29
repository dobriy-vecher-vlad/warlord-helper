import { View } from '@vkontakte/vkui';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../api/game';
import { notify } from '../../app/notify';
import { ITEMS } from '../../lib/items';
import { getSession, setSession } from '../../profile/session';
import { closeModal, getModalStack } from '../../store/modal';
import { initNav } from '../../store/nav';
import { button, click, flush, installBrowserStubs, render } from '../../test/harness';
import { CollectionsPanel } from './CollectionsPanel';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../app/notify', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../app/notify')>()), notify: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

const game = vi.mocked(getGame);

/** Предметы-награды трёх коллекций: A и C одного типа, B другого. */
const itemA = ITEMS.find((item) => item.type === 2 && item.fragments.length > 0)!;
const itemC = ITEMS.find((item) => item.type === 2 && item.fragments.length > 0 && item.id !== itemA.id)!;
const itemB = ITEMS.find((item) => item.type !== 2 && item.fragments.length > 0)!;

const parts = (collection: number) => [1, 2, 3, 4, 5].map((n) => ({ _id: String(collection * 10 + n), _t: String(collection), _n: `Предмет: Деталь ${n}` }));
const counts = (collection: number, each: number[]) => each.map((q, n) => ({ _i: String(collection * 10 + n + 1), _q: String(q) }));

interface Options {
	/** Сколько раз собрана каждая коллекция (A, B, C) */
	times?: [number, number, number];
	/** Игровые id купленных предметов */
	owned?: number[];
	/** Части коллекций */
	a?: number[];
	b?: number[];
	c?: number[];
}

/** Профиль игры: A готова к первой сборке, B повторная на два набора, C в процессе. */
function profile({ times = [0, 1, 0], owned = [itemB.id], a = [1, 1, 1, 1, 1], b = [2, 2, 2, 2, 3], c = [1, 1, 1, 0, 0] }: Options = {}) {
	return {
		u: {},
		i: owned.map((id) => ({ _id: String(id), _o: '1' })),
		collections: {
			col_t: [
				{ _id: '1', _n: 'A', _it: String(itemA.id) },
				{ _id: '2', _n: 'B', _it: String(itemB.id) },
				{ _id: '3', _n: 'C', _it: String(itemC.id) },
			],
			col_i: [...parts(1), ...parts(2), ...parts(3)],
			u_col: [...counts(1, a), ...counts(2, b), ...counts(3, c)],
		},
		ucollc: { i: times.map((cnt, n) => ({ _id: String(n + 1), _cnt: String(cnt) })) },
	};
}

async function show() {
	initNav({ view: 'profile', panel: 'collections' });
	return render(
		<View id="profile" activePanel="collections">
			<CollectionsPanel id="collections" />
		</View>,
	);
}

async function settle() {
	for (let step = 0; step < 8; step++) await flush();
}

const text = () => (document.body.textContent ?? '').replace(/ /g, ' ');
const card = (title: string) => [...document.body.querySelectorAll('[role="button"]')].find((node) => node.textContent?.includes(title)) as HTMLElement | undefined;
const tab = (title: string, nth = 0) => [...document.body.querySelectorAll('[role="tab"]')].filter((node) => node.textContent?.trim().startsWith(title))[nth] as HTMLElement;
const label = (title: string, nth = 0) => (tab(title, nth)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const requests = () => game.mock.calls.filter(([, body]) => (body as { i?: number })?.i === 96);

beforeEach(() => {
	game.mockReset();
	vi.mocked(notify).mockReset();
	setSession({
		status: 'ready',
		isDonut: false,
		profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }],
		index: 0,
		items: [itemB.id],
		itemsFull: [
			{
				id: itemB.id,
				lvl: 0,
				stones: [
					[0, 0],
					[0, 0],
					[0, 0],
				],
				bonus: [0, 0, 0],
			},
		],
		game: { _lvl: '68' } as never,
	});
});

afterEach(() => {
	while (getModalStack().length) closeModal();
});

describe('«Коллекции»', () => {
	it('в списке справа число готовых сборок или сколько видов частей из пяти', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		expect(card(itemA.title)?.textContent).toContain('×1');
		expect(card(itemB.title)?.textContent).toContain('×2');
		expect(card(itemC.title)?.textContent).toContain('3 из 5');
		expect(text()).toContain('Выберите коллекцию');
	});

	it('счётчики строк зависят только от строк выше, этап делит на первую и повторную сборку', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		const weapons = label('Оружие');
		await click(tab('Заточка'));
		expect(label('Оружие')).toBe(weapons);
		expect(card(itemB.title)).toBeTruthy();
		expect(card(itemA.title)).toBeUndefined();
		await click(tab('Предмет'));
		expect(card(itemA.title)).toBeTruthy();
		expect(card(itemB.title)).toBeUndefined();
		await click(tab('Можно собрать'));
		expect(card(itemA.title)).toBeTruthy();
		expect(card(itemC.title)).toBeUndefined();
		await click(tab('В процессе'));
		expect(card(itemC.title)).toBeTruthy();
		expect(card(itemA.title)).toBeUndefined();
	});

	it('выбранная коллекция: сетка из пяти частей с количеством каждой, у отсутствующих плитка приглушена', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(itemC.title)!);
		const tiles = [...document.body.querySelectorAll('[title^="Деталь"]')];
		expect(tiles.map((tile) => tile.textContent)).toEqual(['1', '1', '1', '0', '0']);
		expect(text()).toContain('Собрано'); // шестая ячейка: сколько раз собрана
		expect(tiles.filter((tile) => tile.querySelector('[class*="missing"]'))).toHaveLength(2);
		expect(button('Обменять')).toBeUndefined();
		await click(card(itemA.title)!);
		expect(button('Обменять')).toBeTruthy();
	});

	it('не хватает частей: кнопка неактивна', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(itemC.title)!);
		expect(button('Не хватает частей')?.disabled).toBe(true);
		expect(button('Обменять')).toBeUndefined();
	});

	it('первая сборка: один запрос даже при двойном нажатии, предмет попадает в сессию', async () => {
		let done = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 96) {
				done = true;
				return { a: { _res: '1' } };
			}
			return done ? profile({ times: [1, 1, 0], owned: [itemA.id, itemB.id], a: [0, 0, 0, 0, 0] }) : profile();
		});
		await show();
		await settle();
		await click(card(itemA.title)!);
		const start = button('Обменять')!;
		await act(async () => {
			start.click();
			start.click();
		});
		await settle();
		expect(requests()).toHaveLength(1);
		expect(requests()[0]![1]).toEqual({ i: 96, t: 1 });
		expect(notify).toHaveBeenCalledWith({ text: `Получен предмет: ${itemA.title}`, icon: 'done' });
		expect(getSession().items).toContain(itemA.id);
	});

	it('повторная сборка даёт заточку и не меняет список предметов сессии', async () => {
		let done = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 96) {
				done = true;
				return { a: { _res: '1' } };
			}
			return done ? profile({ times: [0, 2, 0], b: [1, 1, 1, 1, 2] }) : profile();
		});
		await show();
		await settle();
		await click(card(itemB.title)!);
		await click(button('Обменять')!);
		await settle();
		expect(notify).toHaveBeenCalledWith({ text: `Получена заточка: ${itemB.title}`, icon: 'done' });
		expect(getSession().items).toEqual([itemB.id]);
	});

	it('число сборок не выросло: сообщается о неудаче', async () => {
		game.mockImplementation(async (_server, body) => ((body as { i?: number }).i === 96 ? {} : profile()));
		await show();
		await settle();
		await click(card(itemA.title)!);
		await click(button('Обменять')!);
		await settle();
		expect(notify).toHaveBeenCalledWith({ text: 'Не удалось собрать коллекцию', icon: 'error' });
	});

	it('сервер не ответил: заглушка с повтором, а после повтора список', async () => {
		game.mockResolvedValue(null);
		await show();
		await settle();
		expect(text()).toContain('Не удалось загрузить данные');
		game.mockResolvedValue(profile());
		await click(button('Повторить')!);
		await settle();
		expect(card(itemA.title)).toBeTruthy();
	});
});
