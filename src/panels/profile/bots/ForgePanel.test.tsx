import { View } from '@vkontakte/vkui';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../../api/game';
import { notify } from '../../../app/notify';
import { ITEMS } from '../../../lib/items';
import { getSession, setSession } from '../../../profile/session';
import { closeModal, getModalStack } from '../../../store/modal';
import { initNav } from '../../../store/nav';
import { button, click, flush, installBrowserStubs, render } from '../../../test/harness';
import { ForgePanel } from './ForgePanel';

vi.mock('../../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../../app/notify', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../../app/notify')>()), notify: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

const game = vi.mocked(getGame);

/** Жезл Инквизитора: оружие, улучшается за аметисты и топазы сразу. */
const rod = ITEMS.find((item) => item.title === 'Жезл Инквизитора')!;
/** Предмет за одно серебро другого типа. */
const silver = ITEMS.find((item) => item.prices.length === 1 && item.prices[0]![0] === 1 && item.hp > 0 && item.type !== rod.type)!;
const typeTitle = (type: number) => ITEM_TYPE_TITLES[type]!;
const ITEM_TYPE_TITLES: Record<number, string> = { 2: 'Оружие', 3: 'Броня', 4: 'Шлемы', 12: 'Наплечники' };

/** Профиль игры: оба предмета на нулевом уровне с заточками, баланс задаётся. */
function profile(level = 0, balance: Record<string, string> = {}) {
	return {
		u: { _m1: '1000000', _m2: '0', _m3: '1000000', _m4: '100000', _m5: '100000', _m6: '0', _m9: '0', ...balance },
		i: [
			{ _id: String(rod.id), _o: '1', _u: String(level) },
			{ _id: String(silver.id), _o: '1', _u: '0' },
		],
		iupgrade: {
			i: [
				{ _id: String(rod.id), _cnt: '5' },
				{ _id: String(silver.id), _cnt: '5' },
			],
		},
	};
}

async function show() {
	initNav({ view: 'profile', panel: 'forge' });
	return render(
		<View id="profile" activePanel="forge">
			<ForgePanel id="forge" />
		</View>,
	);
}

async function settle() {
	for (let step = 0; step < 8; step++) await flush();
}

const text = () => (document.body.textContent ?? '').replace(/ /g, ' ');
const card = (title: string) => [...document.body.querySelectorAll('[role="button"]')].find((node) => node.textContent?.includes(title)) as HTMLElement | undefined;
/** Вкладка по названию; «Все» есть в обоих рядах (тип и ресурс), `nth` выбирает ряд */
const tab = (title: string, nth = 0) => [...document.body.querySelectorAll('[role="tab"]')].filter((node) => node.textContent?.trim().startsWith(title))[nth] as HTMLElement;
const label = (title: string) => (tab(title)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const upgrades = () => game.mock.calls.filter(([, body]) => (body as { i?: number })?.i === 26);

beforeEach(() => {
	game.mockReset();
	vi.mocked(notify).mockReset();
	setSession({
		status: 'ready',
		isDonut: false,
		profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }],
		index: 0,
		items: [rod.id, silver.id],
		itemsFull: [rod.id, silver.id].map((id) => ({
			id,
			lvl: 0,
			stones: [
				[0, 0],
				[0, 0],
				[0, 0],
			],
			bonus: [0, 0, 0],
		})),
		game: { _lvl: '68' } as never,
	});
});

afterEach(() => {
	while (getModalStack().length) closeModal();
});

describe('«Кузница»', () => {
	it('по умолчанию выбрано «Все»: видны предметы всех ресурсов, справа уровень', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		expect(tab('Все').getAttribute('aria-selected')).toBe('true');
		expect(card(rod.title)).toBeTruthy();
		expect(card(silver.title)).toBeTruthy();
		expect(text()).toContain('Выберите предмет для улучшения');
	});

	it('предмет с двумя валютами лежит на вкладках обеих валют, а во «Все» один раз', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		expect([...document.body.querySelectorAll('[role="button"]')].filter((node) => node.textContent?.includes(rod.title))).toHaveLength(1);
		await click(tab('Аметисты'));
		expect(card(rod.title)).toBeTruthy();
		expect(card(silver.title)).toBeUndefined();
		await click(tab('Топазы'));
		expect(card(rod.title)).toBeTruthy();
		await click(tab('Серебро'));
		expect(card(silver.title)).toBeTruthy();
		expect(card(rod.title)).toBeUndefined();
	});

	it('фильтр по типу сужает список, а его счётчики не зависят от выбранного ресурса', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		const weapons = label(typeTitle(rod.type));
		expect(weapons).toContain('1');
		await click(tab('Серебро'));
		expect(label(typeTitle(rod.type))).toBe(weapons);
		await click(tab('Все', 1));
		await click(tab(typeTitle(rod.type)));
		expect(card(rod.title)).toBeTruthy();
		expect(card(silver.title)).toBeUndefined();
	});

	it('футер выбранного предмета: по ячейке на каждую валюту, заточки и шанс', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(rod.title)!);
		const footer = text();
		expect(footer).toContain('Заточки');
		expect(footer).toContain('Шанс');
		expect(footer).toContain('100%');
		// Баланс аметистов и топазов, цена каждого списывается со своей ячейки
		expect(footer).toContain('100 000');
		expect(button('Улучшить')).toBeTruthy();
	});

	it('не хватает одной из валют: кнопка улучшения неактивна', async () => {
		game.mockResolvedValue(profile(0, { _m5: '0' }));
		await show();
		await settle();
		await click(card(rod.title)!);
		expect(button('Не хватает ресурсов')?.disabled).toBe(true);
		expect(button('Улучшить')).toBeUndefined();
	});

	it('улучшение: один запрос даже при двойном нажатии, сообщение и обновлённый уровень в сессии', async () => {
		let upgraded = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 26) {
				upgraded = true;
				return { a: { _res: '1' } };
			}
			return profile(upgraded ? 1 : 0);
		});
		await show();
		await settle();
		await click(card(rod.title)!);
		const start = button('Улучшить')!;
		await act(async () => {
			start.click();
			start.click();
		});
		await settle();
		expect(upgrades()).toHaveLength(1);
		expect(upgrades()[0]![1]).toEqual({ i: 26, t1: rod.id });
		expect(notify).toHaveBeenCalledWith({ text: 'Удачная попытка улучшения предмета', icon: 'done' });
		expect(getSession().itemsFull.find((owned) => owned.id === rod.id)?.lvl).toBe(1);
	});

	it('персонаж без купленных предметов: пустой список, а не «неверный пароль»', async () => {
		game.mockResolvedValue({ u: { _m1: '0', _m2: '0', _m3: '0', _m4: '0', _m5: '0', _m6: '0', _m9: '0' } });
		await show();
		await settle();
		expect(text()).toContain('Выберите предмет для улучшения');
		expect(text()).not.toContain('Не удалось загрузить данные');
		expect(card(rod.title)).toBeUndefined();
		expect(notify).not.toHaveBeenCalled();
	});

	it('шанс в футере с прибавкой от навыка гильдии (не больше 100%), а урон идёт раньше затрат и шанса', async () => {
		game.mockResolvedValue({ ...profile(1), clan: { _u4: '10' } });
		await show();
		await settle();
		await click(card(rod.title)!);
		const footer = text();
		expect(footer).toContain('80%');
		expect(footer).toContain('10%');
		expect(footer.indexOf('Урон')).toBeLessThan(footer.indexOf('Заточки'));
		expect(footer.lastIndexOf('Шанс')).toBeGreaterThan(footer.lastIndexOf('Заточки'));
	});

	it('цена улучшения как в игре: прибавка урона и здоровья округляется вверх отдельно (Кольцо Вьюги с 3 на 4 уровень: 225 турмалинов и 7 заточек)', async () => {
		const ring = ITEMS.find((item) => item.title === 'Кольцо Вьюги')!;
		game.mockResolvedValue({
			u: { _m1: '0', _m2: '0', _m3: '0', _m4: '0', _m5: '0', _m6: '5000', _m9: '0' },
			i: [{ _id: String(ring.id), _o: '1', _u: '3' }],
			iupgrade: { i: [{ _id: String(ring.id), _cnt: '7' }] },
		});
		await show();
		await settle();
		await click(card(ring.title)!);
		const footer = text();
		expect(footer).toContain('225');
		expect(footer).not.toContain('220');
		expect(footer).toContain('5 000');
		expect(button('Улучшить')).toBeTruthy();
	});

	it('сервер не ответил: заглушка с повтором, а после повтора список', async () => {
		game.mockResolvedValue(null);
		await show();
		await settle();
		expect(text()).toContain('Не удалось загрузить данные');
		expect(card(rod.title)).toBeUndefined();
		game.mockResolvedValue(profile());
		await click(button('Повторить')!);
		await settle();
		expect(card(rod.title)).toBeTruthy();
	});
});
