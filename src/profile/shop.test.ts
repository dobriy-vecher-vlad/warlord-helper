import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../api/game';
import ShopData from '../data/shop.json';
import { ITEMS } from '../lib/items';
import {
	balanceOf,
	buyItem,
	characterOf,
	statGain,
	buyMessage,
	droppedIds,
	isExpensive,
	ownedIds,
	shopFromCatalog,
	shopStatus,
	SHOP_ALL,
	sortShop,
	type ShopItem,
	type Wallet,
} from './shop';

vi.mock('../api/game', () => ({ getGame: vi.fn() }));

const item = (extra: Partial<(typeof ITEMS)[number]> = {}) => ({ ...ITEMS[0]!, ...extra });
const entry = (id: number, level: number, price: number, currency = 1, kind: ShopItem['kind'] = 'free'): ShopItem => ({
	index: id,
	level,
	prices: [[currency, price]],
	kind,
	item: item({ id }),
});
const wallet = (extra: Partial<Wallet> = {}): Wallet => ({ level: 50, owned: new Set(), dropped: new Set(), balance: { 1: 1000, 2: 100 }, ...extra });

describe('предметы магазина', () => {
	it('снимок каталога магазина: предметы из каталога, без повторов, цена и валюта заданы', () => {
		expect(SHOP_ALL.length).toBeGreaterThan(300);
		expect(SHOP_ALL.filter((value) => value.kind === 'free').length).toBeGreaterThan(100);
		expect(new Set(SHOP_ALL.map((value) => value.item.id)).size).toBe(SHOP_ALL.length);
		for (const shopEntry of SHOP_ALL) {
			expect(ITEMS[shopEntry.index]).toBe(shopEntry.item);
			expect(shopEntry.prices.length).toBeGreaterThan(0);
			for (const [currency, price] of shopEntry.prices) {
				expect(price).toBeGreaterThan(0);
				expect(currency).toBeGreaterThanOrEqual(1);
				expect(currency).toBeLessThanOrEqual(6);
			}
		}
	});

	it('главная профиля считает магазин по тому же списку, что и панель', () => {
		const ids = new Set<number>(ShopData.map(([id]) => id!));
		expect(ShopData).toHaveLength(SHOP_ALL.length);
		expect(SHOP_ALL.every((value) => ids.has(value.item.id))).toBe(true);
	});

	it('статус: куплен, закрыт по уровню, не хватает или можно купить', () => {
		const owned = wallet({ owned: new Set([7]) });
		expect(shopStatus(entry(7, 1, 5), owned)).toBe('owned');
		expect(shopStatus(entry(8, 60, 5), wallet())).toBe('lock');
		expect(shopStatus(entry(9, 10, 2000), wallet())).toBe('short');
		expect(shopStatus(entry(10, 10, 500), wallet())).toBe('buy');
		expect(shopStatus(entry(7, 99, 5), owned)).toBe('owned');
		// Без баланса (нет пароля) «не хватает» не определяется
		expect(shopStatus(entry(9, 10, 2000), wallet({ balance: null }))).toBe('buy');
	});

	it('предмет с босса или сундука закрыт, пока не выпал; выпавший покупается без проверки уровня', () => {
		const boss = entry(20, 99, 500, 1, 'drop');
		expect(shopStatus(boss, wallet())).toBe('drop');
		expect(shopStatus(boss, wallet({ dropped: new Set([20]) }))).toBe('buy');
		expect(shopStatus(entry(21, 99, 5000, 1, 'drop'), wallet({ dropped: new Set([21]) }))).toBe('short');
		expect(shopStatus(boss, wallet({ owned: new Set([20]) }))).toBe('owned');
		// Выпавший обычный предмет тоже без проверки уровня
		expect(shopStatus(entry(22, 99, 5, 1), wallet({ dropped: new Set([22]) }))).toBe('buy');
	});

	it('порядок: можно купить, не хватает, закрыто, не выпало, куплено; внутри по уровню и цене', () => {
		const list = [entry(1, 1, 5), entry(2, 60, 5), entry(3, 10, 5000), entry(4, 30, 100), entry(5, 5, 100), entry(6, 5, 10), entry(7, 1, 5, 1, 'drop')];
		const sorted = sortShop(list, wallet({ owned: new Set([1]) })).map((value) => value.item.id);
		expect(sorted).toEqual([6, 5, 4, 3, 2, 7, 1]);
	});

	it('дорогая покупка: от 100 000 серебра или золота, от 1000 других валют', () => {
		expect(isExpensive({ prices: [[1, 99_999]] })).toBe(false);
		expect(isExpensive({ prices: [[1, 100_000]] })).toBe(true);
		expect(isExpensive({ prices: [[3, 250_000]] })).toBe(true);
		expect(isExpensive({ prices: [[2, 999]] })).toBe(false);
		expect(isExpensive({ prices: [[2, 1000]] })).toBe(true);
		// Цен несколько: дорогой достаточно одной
		expect(
			isExpensive({
				prices: [
					[1, 10],
					[3, 300_000],
				],
			}),
		).toBe(true);
	});

	it('купленные, выпавшие предметы и баланс берутся из профиля игры', () => {
		const profile = { u: { _m1: '1500', _m2: '20', _m3: '0' }, i: [{ _id: '5', _o: '1' }, { _id: '6', _o: '0' }, { _id: '7', _o: '1' }, { _id: '8' }] };
		expect(ownedIds(profile as never)).toEqual(new Set([5, 7]));
		expect(droppedIds(profile as never)).toEqual(new Set([6]));
		expect(ownedIds({ u: {}, i: { _id: '9', _o: '1' } } as never)).toEqual(new Set([9]));
		expect(ownedIds(null)).toEqual(new Set());
		expect(droppedIds(null)).toEqual(new Set());
		expect(balanceOf(profile as never)).toEqual({ 1: 1500, 2: 20, 3: 0, 4: 0, 5: 0, 6: 0 });
	});
});

describe('каталог магазина из профиля игры', () => {
	const [first, second, third, fourth, fifth, sixth] = ITEMS;
	const row = (id: number, extra: Record<string, string> = {}) => ({ _id: String(id), _p1: '0', _p2: '0', _p3: '0', _p4: '0', _p5: '0', _p6: '0', _l4: '0', ...extra });

	it('без каталога возвращает null', () => {
		expect(shopFromCatalog(null)).toBeNull();
		expect(shopFromCatalog({ u: {} } as never)).toBeNull();
	});

	it('свободные, выпадающие и выдаваемые иначе предметы различаются по условиям', () => {
		const shop = {
			i: [
				row(first!.id, { _p1: '100', _l4: '25' }),
				row(second!.id, { _p3: '500', _l1: '12' }),
				row(third!.id, { _p2: '30', _is_p: '1' }),
				row(fourth!.id, { _p1: '40', _l11: '3' }),
				row(fifth!.id, { _p1: '50', _l13: '1' }),
				row(sixth!.id, { _p6: '70', _l8: '2' }),
				// Предмет коллекции при обмене сразу попадает на аккаунт: в магазин не входит
				row(ITEMS[6]!.id, { _p1: '10', _l10: '5' }),
				row(999_999_999, { _p1: '1' }),
				row(first!.id, { _p1: '100' }),
			],
		};
		const list = shopFromCatalog({ u: {}, shop } as never)!;
		expect(list.map((value) => [value.item.id, value.kind, value.prices, value.level])).toEqual([
			[first!.id, 'free', [[1, 100]], 25],
			[second!.id, 'drop', [[3, 500]], 0],
			[sixth!.id, 'drop', [[6, 70]], 0],
		]);
		expect(list[0]!.index).toBe(0);
	});

	it('цены берутся по всем ненулевым валютам, предметы без цены пропускаются', () => {
		const list = shopFromCatalog({ u: {}, shop: { i: [row(first!.id, { _p2: '9', _p5: '4' }), row(second!.id)] } } as never)!;
		expect(list.map((value) => [value.item.id, value.prices])).toEqual([
			[
				first!.id,
				[
					[2, 9],
					[5, 4],
				],
			],
		]);
	});
});

describe('характеристики персонажа и предмета', () => {
	const shopEntry = (value: (typeof ITEMS)[number]): ShopItem => ({ index: ITEMS.indexOf(value), item: value, level: 1, prices: [[1, 5]], kind: 'free' });

	it('урон и здоровье персонажа берутся как в игре: здоровье (_end + _endi) × 15', () => {
		expect(characterOf({ _dmgi: '1000', _end: '10', _endi: '90' } as never)).toEqual({ dmg: 1000, hp: 1500 });
		expect(characterOf(null)).toBeNull();
		expect(characterOf({} as never)).toBeNull();
	});

	it('предмет даёт свой урон и здоровье ×15, независимо от того, что надето в слоте', () => {
		const ring = ITEMS.find((value) => value.title === 'Железный Перстень')!;
		expect(ring.hp).toBeGreaterThan(0);
		expect(statGain(shopEntry(ring))).toEqual({ dmg: ring.dmg, hp: ring.hp * 15 });
		const weapon = ITEMS.find((value) => value.type === 2 && value.dmg > 0)!;
		expect(statGain(shopEntry(weapon)).dmg).toBe(weapon.dmg);
	});
});

describe('покупка', () => {
	beforeEach(() => vi.mocked(getGame).mockReset());

	it('сообщение об отказе сервера читается из ответа', () => {
		expect(buyMessage({ msg: 'Недостаточно средств!' })).toBe('Недостаточно средств!');
		expect(buyMessage({ msg: '  ' })).toBeNull();
		expect(buyMessage('Предмет уже куплен!')).toBe('Предмет уже куплен!');
		expect(buyMessage({})).toBeNull();
		expect(buyMessage(null)).toBeNull();
	});

	it('запрос уходит методом 4 с игровым id предмета', async () => {
		vi.mocked(getGame).mockResolvedValue({ msg: 'Предмет уже куплен!' });
		const bot = { server: 1, auth: { login: 10, password: 'pass' } };
		await expect(buyItem(bot, 1167)).resolves.toEqual({ message: 'Предмет уже куплен!', sent: true });
		expect(getGame).toHaveBeenCalledWith(1, { i: 4, t: 1167 }, bot.auth, 1, false, 2);
		vi.mocked(getGame).mockResolvedValue(null);
		await expect(buyItem(bot, 1167)).resolves.toEqual({ message: null, sent: false });
	});
});

describe('цены справочника предметов', () => {
	it('у каждого предмета есть цена, у предметов кузницы гильдии две валюты', () => {
		for (const value of ITEMS) {
			expect(value.prices.length).toBeGreaterThan(0);
			for (const [currency, price] of value.prices) {
				expect(currency).toBeGreaterThanOrEqual(1);
				expect(currency).toBeLessThanOrEqual(6);
				expect(price).toBeGreaterThan(0);
			}
		}
		expect(ITEMS.find((value) => value.title === 'Жезл Инквизитора')!.prices).toEqual([
			[4, 1055],
			[5, 6595],
		]);
		expect(ITEMS.filter((value) => value.prices.length > 1)).toHaveLength(37);
	});

	it('первая цена предмета совпадает с ценой магазина', () => {
		for (const { item, prices } of SHOP_ALL) expect(item.prices[0]).toEqual(prices[0]);
	});
});

describe('предмет с двумя ценами', () => {
	it('покупка списывает обе: не хватает любой — «не хватает»; дорогой достаточно одной', () => {
		const spear = {
			...entry(30, 1, 10),
			prices: [
				[1, 10],
				[3, 300_000],
			] as [number, number][],
		};
		expect(shopStatus(spear, wallet({ balance: { 1: 1000, 3: 0 } }))).toBe('short');
		expect(shopStatus(spear, wallet({ balance: { 1: 1000, 3: 300_000 } }))).toBe('buy');
		expect(isExpensive(spear)).toBe(true);
	});
});
