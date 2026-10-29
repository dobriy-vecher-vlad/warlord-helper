import { View } from '@vkontakte/vkui';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../api/game';
import { notify } from '../../app/notify';
import { answerConfirm, getConfirm } from '../../lib/confirmAction';
import { ITEMS } from '../../lib/items';
import { setSession } from '../../profile/session';
import { closeModal, getModalStack } from '../../store/modal';
import { initNav } from '../../store/nav';
import { button, click, flush, installBrowserStubs, render } from '../../test/harness';
import { InlayPanel } from './InlayPanel';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../app/notify', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../app/notify')>()), notify: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

const game = vi.mocked(getGame);
const [one, two] = ITEMS.filter((item) => item.type === 2);

/** Профиль: два предмета с 5 уровня, у первого слот занят гранатом 1 уровня, второй пустой; в запасе камни для создания гранатов 2 уровня. */
function profile({ rubies = '100', raw = '5' }: { rubies?: string; raw?: string } = {}) {
	return {
		u: { _m1: '0', _m2: rubies, _m3: '5000', _m7: '500' },
		shop: {
			i: [
				{ _id: String(one!.id), _sslt: '1' },
				{ _id: String(two!.id), _sslt: '1' },
			],
		},
		i: [
			{ _id: String(one!.id), _o: '1', _u: '5', _st11: '2', _st12: '1' },
			{ _id: String(two!.id), _o: '1', _u: '6' },
		],
		stones: {
			s: [
				{ _t: '2', _id: '1', _n: 'Осколок Граната', _bv: '3', _rsc: '0' },
				{ _t: '2', _id: '2', _n: 'Мутный Гранат', _bv: '9', _rst: '2', _rsi: '1', _rsc: '3', _rm7: '15' },
			],
			st: [{ _t: '2', _id: '1', _c: raw }],
		},
	};
}

async function show() {
	initNav({ view: 'profile', panel: 'inlay' });
	return render(
		<View id="profile" activePanel="inlay">
			<InlayPanel id="inlay" />
		</View>,
	);
}

async function settle() {
	for (let step = 0; step < 8; step++) await flush();
}

const text = () => (document.body.textContent ?? '').replace(/ /g, ' ');
const card = (title: string) => [...document.body.querySelectorAll('[role="button"]')].find((node) => node.textContent?.includes(title)) as HTMLElement | undefined;
const tab = (title: string) => [...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith(title)) as HTMLElement;
const requests = (method: number) => game.mock.calls.filter(([, body]) => (body as { i?: number })?.i === method);

beforeEach(() => {
	game.mockReset();
	vi.mocked(notify).mockReset();
	setSession({
		status: 'ready',
		isDonut: false,
		profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }],
		index: 0,
		items: [],
		itemsFull: [],
		game: { _lvl: '68' } as never,
	});
});

afterEach(() => {
	answerConfirm(false);
	while (getModalStack().length) closeModal();
});

describe('«Инкрустация»', () => {
	it('предметы со слотами в списке, у выбранного плитки слотов и подсказка до выбора', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		expect(text()).toContain('Выберите предмет');
		expect(card(one!.title)).toBeTruthy();
		await click(card(one!.title)!);
		expect(document.body.querySelectorAll('[role="button"]').length).toBeGreaterThan(2);
	});

	it('нажатие на пустой слот открывает окно выбора камня, на занятый спрашивает подтверждение', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(two!.title)!);
		const slots = [...document.body.querySelectorAll('[role="button"]')].filter((node) => node.className.includes('tile'));
		await click(slots[0] as HTMLElement);
		expect(getModalStack().at(-1)?.id).toBe('inlay');
		while (getModalStack().length) closeModal();
		await click(card(one!.title)!);
		const filled = [...document.body.querySelectorAll('[role="button"]')].filter((node) => node.className.includes('tile'));
		await click(filled[0] as HTMLElement);
		expect(getConfirm()?.title).toBe('Достать камень?');
	});

	it('достать камень: после согласия уходит запрос 143 со слотом, успех определяется по профилю', async () => {
		let removed = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 143) {
				removed = true;
				return { a: { _res: '1' } };
			}
			const data = profile();
			if (removed) data.i[0] = { _id: String(one!.id), _o: '1', _u: '5' } as never;
			return data;
		});
		await show();
		await settle();
		await click(card(one!.title)!);
		const filled = [...document.body.querySelectorAll('[role="button"]')].filter((node) => node.className.includes('tile'));
		await click(filled[0] as HTMLElement);
		await act(async () => answerConfirm(true));
		await settle();
		expect(requests(143)).toHaveLength(1);
		expect(requests(143)[0]![1]).toEqual({ i: 143, t: one!.id, t1: 1 });
		expect(notify).toHaveBeenCalledWith({ text: 'Камень достали и вернули в запас', icon: 'done' });
	});

	it('не хватает рубинов для снятия: вместо вопроса сообщение, запроса нет', async () => {
		game.mockResolvedValue(profile({ rubies: '10' }));
		await show();
		await settle();
		await click(card(one!.title)!);
		const filled = [...document.body.querySelectorAll('[role="button"]')].filter((node) => node.className.includes('tile'));
		await click(filled[0] as HTMLElement);
		expect(getConfirm()).toBeNull();
		expect(notify).toHaveBeenCalledWith({ text: 'Не хватает рубинов, нужно 15', icon: 'error' });
		expect(requests(143)).toHaveLength(0);
	});

	it('создание камня: один запрос даже при двойном нажатии, успех по росту числа камней', async () => {
		let made = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 142) {
				made = true;
				return { res: { _v: '1' } };
			}
			const data = profile();
			if (made) data.stones.st.push({ _t: '2', _id: '2', _c: '1' });
			return data;
		});
		await show();
		await settle();
		await click(tab('Камни'));
		await click(card('Мутный Гранат')!);
		const create = button('Создать')!;
		await act(async () => {
			create.click();
			create.click();
		});
		await settle();
		expect(requests(142)).toHaveLength(1);
		expect(requests(142)[0]![1]).toEqual({ i: 142, t: 2, t1: 2 });
		expect(notify).toHaveBeenCalledWith({ text: 'Создан камень: Мутный Гранат', icon: 'done' });
	});

	it('сервер не ответил: заглушка с повтором', async () => {
		game.mockResolvedValue(null);
		await show();
		await settle();
		expect(text()).toContain('Не удалось загрузить данные');
		game.mockResolvedValue(profile());
		await click(button('Повторить')!);
		await settle();
		expect(card(one!.title)).toBeTruthy();
	});
});
