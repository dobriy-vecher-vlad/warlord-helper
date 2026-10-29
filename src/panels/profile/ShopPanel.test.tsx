import { View } from '@vkontakte/vkui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../api/game';
import { notify } from '../../app/notify';
import { getSession, setSession } from '../../profile/session';
import { numberSpaces } from '../../lib/format';
import { ITEMS } from '../../lib/items';
import { SHOP_ALL, isExpensive, type ShopItem } from '../../profile/shop';
import { closeModal, getModalStack } from '../../store/modal';
import { initNav } from '../../store/nav';
import { button, click, flush, installBrowserStubs, render } from '../../test/harness';
import { ShopPanel } from './ShopPanel';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../app/notify', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../app/notify')>()), notify: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

const game = vi.mocked(getGame);

/** Предметы магазина без условий: каталог в профиле строится из них. */
const FREE = SHOP_ALL.filter((entry) => entry.kind === 'free');

/** Строка каталога магазина в профиле игры: цена только в валюте предмета. */
const catalogRow = (entry: ShopItem) => ({
	_id: String(entry.item.id),
	...Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [`_p${id}`, String(entry.prices.find(([currency]) => currency === id)?.[1] ?? 0)])),
	_l4: String(entry.level),
});

const cheap = FREE.find((entry) => entry.level <= 60 && entry.prices.length === 1 && entry.prices[0]![0] === 1 && entry.prices[0]![1] <= 1000 && !isExpensive(entry))!;
const costly = FREE.find((entry) => entry.level <= 60 && entry.prices.length === 1 && entry.prices[0]![0] === 3 && isExpensive(entry))!;

/** Профиль игры: все предметы магазина, кроме названных, уже куплены, чтобы нужные карточки были в начале списка. */
function profile(extra: ShopItem[] = [], balance: Record<string, string> = {}) {
	const skip = new Set([cheap.item.id, costly.item.id]);
	const items = FREE.filter((entry) => !skip.has(entry.item.id)).map((entry) => ({ _id: String(entry.item.id), _o: '1' }));
	for (const entry of extra) items.push({ _id: String(entry.item.id), _o: '1' });
	return {
		u: { _lvl: '68', _m1: '5000', _m2: '0', _m3: String(costly.prices[0]![1] + 50), _m4: '0', _m5: '0', _m6: '0', ...balance },
		shop: { i: FREE.map(catalogRow) },
		i: items,
	};
}

async function show() {
	initNav({ view: 'profile', panel: 'shop' });
	return render(
		<View id="profile" activePanel="shop">
			<ShopPanel id="shop" />
		</View>,
	);
}

async function settle() {
	for (let step = 0; step < 8; step++) await flush();
}

const text = () => (document.body.textContent ?? '').replace(/ /g, ' ');
const card = (title: string) => [...document.body.querySelectorAll('[role="button"]')].find((node) => node.textContent?.includes(title)) as HTMLElement;
const purchases = () => game.mock.calls.filter(([, body]) => (body as { i?: number })?.i === 4);

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
	while (getModalStack().length) closeModal();
});

describe('«Магазин»', () => {
	it('показывает баланс, счётчики и цену выбранного предмета', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		expect(text()).toContain('Магазин');
		expect(text()).toContain('Открыто');
		expect(text()).not.toContain('Не хватает');
		expect(text()).not.toContain('Можно купить');
		expect(text()).toContain(cheap.item.title);
		await click(card(cheap.item.title));
		expect(text()).toContain('Серебро');
		expect(text()).toContain('5 000');
		expect(text()).not.toContain('Цена');
		expect(text()).not.toContain('Останется');
		expect(button('Купить')).toBeTruthy();
	});

	it('дешёвая покупка идёт сразу: запрос метода 4, профиль обновляется, предмет попадает в сессию', async () => {
		let bought = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 4) {
				bought = true;
				return {};
			}
			return bought ? profile([cheap], { _m1: '4000' }) : profile();
		});
		await show();
		await settle();
		await click(card(cheap.item.title));
		await click(button('Купить')!);
		await settle();
		expect(purchases()).toEqual([[1, { i: 4, t: cheap.item.id }, { login: 10, password: 'pass', id: 10 }, 1, false, 2]]);
		expect(notify).toHaveBeenCalledWith({ text: `Куплено: ${cheap.item.title}`, icon: 'done' });
		expect(getSession().items).toContain(cheap.item.id);
		// Выбор сброшен: внизу снова подсказка, а не кнопка
		expect(text()).toContain('Выберите предмет для покупки');
		expect(button('Купить')).toBeUndefined();
		expect(text()).toContain(`Куплено ${FREE.length - 1}`);
	});

	it('купленный предмет нельзя выбрать: нажатие ничего не меняет', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		const tab = [...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith('Куплено')) as HTMLElement;
		await click(tab);
		const owned = FREE.find((entry) => entry.item.id !== cheap.item.id && entry.item.id !== costly.item.id)!;
		const title = [...document.body.querySelectorAll('span')].find((node) => node.textContent === owned.item.title);
		expect(title).toBeTruthy();
		await click(title!);
		expect(text()).toContain('Выберите предмет для покупки');
		expect(button('Купить')).toBeUndefined();
	});

	it('отказ сервера показывается его текстом, а профиль не считается обновлённым', async () => {
		game.mockImplementation(async (_server, body) => ((body as { i?: number }).i === 4 ? { msg: 'Недостаточно средств!' } : profile()));
		await show();
		await settle();
		await click(card(cheap.item.title));
		await click(button('Купить')!);
		await settle();
		expect(notify).toHaveBeenCalledWith({ text: 'Недостаточно средств!', icon: 'error' });
		expect(getSession().items).not.toContain(cheap.item.id);
	});

	it('ответ без отказа, но предмета в профиле нет: сообщается о неудаче', async () => {
		game.mockImplementation(async (_server, body) => ((body as { i?: number }).i === 4 ? {} : profile()));
		await show();
		await settle();
		await click(card(cheap.item.title));
		await click(button('Купить')!);
		await settle();
		expect(notify).toHaveBeenCalledWith({ text: 'Не удалось купить предмет', icon: 'error' });
	});

	it('дорогая покупка просит подтверждения и уходит только после него', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(costly.item.title));
		await click(button('Купить')!);
		await settle();
		const entry = getModalStack().at(-1);
		expect(entry?.id).toBe('shopBuy');
		expect(purchases()).toHaveLength(0);
		await (async () => (entry!.data as { onConfirm: () => void }).onConfirm())();
		await settle();
		expect(purchases()).toHaveLength(1);
		expect((purchases()[0]![1] as { t: number }).t).toBe(costly.item.id);
	});

	it('футер, как в кузнице: сколько сейчас и сколько прибавится; ячейки без прибавки не показываются', async () => {
		game.mockResolvedValue({ ...profile(), u: { ...profile().u, _dmgi: '1000', _end: '10', _endi: '90' } });
		await show();
		await settle();
		await click(card(cheap.item.title));
		expect(text()).toContain('Серебро');
		expect(text()).not.toContain('Цена');
		expect(text()).not.toContain('Останется');
		// Баланс: сейчас 5 000, спишется цена
		expect(text()).toContain('5 000');
		expect(text()).toContain(numberSpaces(cheap.prices[0]![1]));
		if (cheap.item.dmg > 0) {
			expect(text()).toContain('Урон');
			expect(text()).toContain('1 000 DMG');
			expect(text()).toContain(`${numberSpaces(cheap.item.dmg)} DMG`);
		} else expect(text()).not.toContain('Урон');
		if (cheap.item.hp > 0) {
			expect(text()).toContain('Здоровье');
			expect(text()).toContain('1 500 HP');
			expect(text()).toContain(`${numberSpaces(cheap.item.hp * 15)} HP`);
		} else expect(text()).not.toContain('Здоровье');
	});

	it('без характеристик персонажа ячейка с прибавкой остаётся, а текущее значение не известно', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		await click(card(cheap.item.title));
		expect(text()).toContain('Серебро');
		if (cheap.item.dmg > 0) {
			expect(text()).toContain('Урон');
			expect(text()).toContain(`${numberSpaces(cheap.item.dmg)} DMG`);
		}
	});

	it('вторая строка фильтров: предметы по валюте цены', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		const tabOf = (title: string) => [...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith(title)) as HTMLElement;
		for (const title of ['Золото', 'Серебро', 'Рубины', 'Аметисты', 'Топазы', 'Турмалины']) expect(tabOf(title)).toBeTruthy();
		await click(tabOf('Золото'));
		expect(card(costly.item.title)).toBeTruthy();
		expect(card(cheap.item.title)).toBeUndefined();
		await click(tabOf('Серебро'));
		expect(card(cheap.item.title)).toBeTruthy();
		expect(card(costly.item.title)).toBeUndefined();
	});

	it('счётчики строк зависят только от строк выше: выбор ниже их не меняет', async () => {
		game.mockResolvedValue(profile());
		await show();
		await settle();
		const label = (title: string) =>
			(([...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith(title)) as HTMLElement | undefined)?.textContent ?? '')
				.replace(/\s+/g, ' ')
				.trim();
		const tab = (title: string) => [...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith(title)) as HTMLElement;
		const typeBefore = label('Оружие');
		const statusBefore = label('Открыто');
		await click(tab('Открыто'));
		// Выбор статуса (последняя строка) не меняет ни тип, ни статусы
		expect(label('Оружие')).toBe(typeBefore);
		expect(label('Открыто')).toBe(statusBefore);
		await click(tab('Золото'));
		// Выбор валюты (средняя строка) меняет счётчики статусов, но не типов
		expect(label('Оружие')).toBe(typeBefore);
		expect(label('Открыто')).not.toBe(statusBefore);
		await click(tab('Оружие'));
		// Выбор типа (первая строка) тоже пересчитывает статусы
		expect(label('Открыто')).not.toBe('');
	});

	it('«Открыто» включает и то, на что не хватает валюты; на карточке нет текста о нехватке', async () => {
		game.mockResolvedValue(profile([], { _m1: '0' }));
		await show();
		await settle();
		const tab = [...document.body.querySelectorAll('[role="tab"]')].find((node) => node.textContent?.trim().startsWith('Открыто')) as HTMLElement;
		await click(tab);
		expect(card(cheap.item.title)).toBeTruthy();
		expect(text()).not.toContain('Не хватает ');
		expect(text()).not.toMatch(/Куплен(?!о)/);
	});

	it('не хватает валюты или уровня: кнопка неактивна и называет причину', async () => {
		game.mockResolvedValue(profile([], { _m1: '0' }));
		await show();
		await settle();
		await click(card(cheap.item.title));
		expect(button('Не хватает ресурсов')?.disabled).toBe(true);
		expect(button('Купить')).toBeUndefined();
		expect(purchases()).toHaveLength(0);
	});

	it('без пароля авторизации страница не открывается: окно настроек профиля и ни одного запроса, как у кузницы и боссов', async () => {
		setSession({ profiles: [{ id: 10, login: 10, auth: null, server: 1 }, { id: null }] });
		await show();
		await settle();
		expect(game).not.toHaveBeenCalled();
		expect(getModalStack().at(-1)?.id).toBe('settings');
		expect(text()).not.toContain('Открыто');
	});

	it('сервер не ответил: сообщение, заглушка и кнопка «Повторить», которая запрашивает профиль снова', async () => {
		game.mockResolvedValueOnce(null);
		await show();
		await settle();
		expect(notify).toHaveBeenCalledWith({ text: 'Игровой сервер не ответил, попробуйте ещё раз', icon: 'error' });
		expect(text()).toContain('Не удалось загрузить данные');
		game.mockResolvedValue(profile());
		await click(button('Повторить')!);
		await settle();
		expect(text()).toContain(cheap.item.title);
		expect(text()).not.toContain('Не удалось загрузить данные');
	});
});

describe('«Магазин»: каталог игры и выпавшие предметы', () => {
	const boss = ITEMS.filter((value) => value.description.startsWith('Босс ') && value.prices[0]![1] <= 4500 && value.prices[0]![0] === 1);
	const dropped = boss[0]!;
	const notDropped = boss[1]!;
	const personal = ITEMS.find((value) => value.description === 'Награда арены')!;
	const row = (id: number, price: number, extra: Record<string, string> = {}) => ({
		_id: String(id),
		_p1: String(price),
		_p2: '0',
		_p3: '0',
		_p4: '0',
		_p5: '0',
		_p6: '0',
		_l4: '0',
		...extra,
	});
	const withCatalog = (owned: number[] = [], drops: number[] = [dropped.id]) => ({
		u: { _lvl: '68', _m1: '5000', _m2: '0', _m3: '0', _m4: '0', _m5: '0', _m6: '0' },
		shop: {
			i: [
				row(cheap.item.id, cheap.prices[0]![1], { _l4: '10' }),
				row(dropped.id, dropped.prices[0]![1], { _l1: '7' }),
				row(notDropped.id, notDropped.prices[0]![1], { _l8: '3' }),
				row(personal.id, 10, { _is_p: '1' }),
			],
		},
		i: [...owned.map((id) => ({ _id: String(id), _o: '1' })), ...drops.map((id) => ({ _id: String(id), _o: '0' }))],
	});

	it('показывает предметы с боссов по каталогу игры; личные (арена, ивенты) в магазин не входят', async () => {
		game.mockResolvedValue(withCatalog());
		await show();
		await settle();
		expect(text()).toContain(dropped.title);
		expect(text()).toContain(notDropped.title);
		expect(text()).toContain(cheap.item.title);
		expect(text()).not.toContain(personal.title);
		// Подпись источника и статус «не выпало»
		expect(text()).toContain(dropped.description);
		expect(text()).toContain('Не выпало');
	});

	it('выпавший предмет с босса покупается, а не выпавший закрыт', async () => {
		let bought = false;
		game.mockImplementation(async (_server, body) => {
			if ((body as { i?: number }).i === 4) {
				bought = true;
				return {};
			}
			return bought ? withCatalog([dropped.id], []) : withCatalog();
		});
		await show();
		await settle();
		await click(card(notDropped.title));
		expect(button('Недоступно')?.disabled).toBe(true);
		expect(button('Купить')).toBeUndefined();
		await click(card(dropped.title));
		await click(button('Купить')!);
		await settle();
		expect(purchases().map(([, body]) => (body as { t: number }).t)).toEqual([dropped.id]);
		expect(notify).toHaveBeenCalledWith({ text: `Куплено: ${dropped.title}`, icon: 'done' });
		expect(getSession().items).toContain(dropped.id);
	});
});
