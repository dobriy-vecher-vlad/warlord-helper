import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../api/game';
import { ITEMS } from '../lib/items';
import {
	createState,
	createStone,
	hasFreeSlot,
	hasStones,
	inlayItems,
	insertPrice,
	insertStone,
	removeStone,
	stoneBonusText,
	stoneCounts,
	stoneIcon,
	stoneKey,
	stonesFromProfile,
	walletOf,
} from './inlay';

vi.mock('../api/game', () => ({ getGame: vi.fn() }));

const [first, second, third] = ITEMS;

/** Профиль игры: три предмета (слоты 2, 0 и 1), у первого есть камень, второй ниже 5 уровня; каталог камней из двух строк и запас. */
const profile = {
	u: { _m1: '1000', _m2: '20', _m7: '50' },
	shop: {
		i: [
			{ _id: String(first!.id), _sslt: '2' },
			{ _id: String(second!.id), _sslt: '0' },
			{ _id: String(third!.id), _sslt: '1' },
		],
	},
	i: [
		{ _id: String(first!.id), _o: '1', _u: '5', _st11: '2', _st12: '4', _st21: '0', _st22: '0', _st_dmg: '45', _st_en: '0', _st_end: '0' },
		{ _id: String(second!.id), _o: '1', _u: '9' },
		{ _id: String(third!.id), _o: '1', _u: '3' },
	],
	stones: {
		s: [
			{ _t: '2', _id: '2', _n: 'Мутный Гранат', _bv: '9', _rst: '2', _rsi: '1', _rsc: '3', _rm7: '15', _rm3: '1000' },
			{ _t: '2', _id: '1', _n: 'Осколок Граната', _bv: '3', _rsc: '0' },
		],
		st: [
			{ _t: '2', _id: '1', _c: '5' },
			{ _t: '2', _id: '2', _c: '0' },
		],
	},
};

describe('камни инкрустации', () => {
	it('каталог камней разбирается: порядок по виду и уровню, что нужно для создания и цена', () => {
		const list = stonesFromProfile(profile as never)!;
		expect(list.map((stone) => [stone.type, stone.level])).toEqual([
			[2, 1],
			[2, 2],
		]);
		expect(list[0]!.need).toBeNull();
		expect(list[1]).toMatchObject({
			value: 9,
			need: { type: 2, level: 1, count: 3 },
			cost: [
				[3, 1000],
				[7, 15],
			],
		});
		expect(stonesFromProfile(null)).toBeNull();
		expect(stonesFromProfile({ u: {} } as never)).toBeNull();
	});

	it('запас и ресурсы читаются из профиля, ключ и картинка камня по виду и уровню', () => {
		expect(stoneCounts(profile as never).get(stoneKey(2, 1))).toBe(5);
		expect(walletOf(profile as never)).toMatchObject({ 1: 1000, 2: 20, 7: 50, 3: 0 });
		expect(stoneIcon(1, 1)).toBe('stones/1.png');
		expect(stoneIcon(3, 7)).toBe('stones/21.png');
	});

	it('создание: камень первого уровня не создаётся, остальное по запасу камней и ресурсам', () => {
		const [base, upper] = stonesFromProfile(profile as never)!;
		const counts = stoneCounts(profile as never);
		const wallet = walletOf(profile as never);
		expect(createState(base!, counts, wallet)).toBe('base');
		expect(createState(upper!, counts, { ...wallet, 3: 1000 })).toBe('can');
		expect(createState(upper!, counts, wallet)).toBe('short');
		expect(createState(upper!, new Map([[stoneKey(2, 1), 2]]), { ...wallet, 3: 1000 })).toBe('short');
	});

	it('цена вставки в пергаментах: Аквамарин ×10, Гранат ×1, Сапфир ×2; бонус словами', () => {
		expect(insertPrice(1, 10)).toBe(100);
		expect(insertPrice(2, 45)).toBe(45);
		expect(insertPrice(3, 15)).toBe(30);
		expect(stoneBonusText(1, 3)).toBe('+3 к энергии');
		expect(stoneBonusText(2, 45)).toBe('+45 к урону');
		expect(stoneBonusText(3, 15)).toBe('+225 к здоровью');
	});
});

describe('предметы со слотами', () => {
	it('показываются купленные с 5 уровня и со слотами; камни по слотам и бонусы читаются', () => {
		const list = inlayItems(profile as never)!;
		expect(list).toHaveLength(1);
		expect(list[0]).toMatchObject({ item: first, upgrade: 5, slots: 2, stones: [[2, 4], null], bonus: { dmg: 45, en: 0, end: 0 } });
		expect(hasStones(list[0]!)).toBe(true);
		expect(hasFreeSlot(list[0]!)).toBe(true);
		expect(inlayItems({ u: {} } as never)).toBeNull();
	});
});

describe('запросы', () => {
	beforeEach(() => vi.mocked(getGame).mockReset());

	it('создание, вставка и снятие уходят методами 142, 144 и 143; отказ сервера читается из ответа', async () => {
		const bot = { server: 1, auth: { login: 10, password: 'pass', id: 10 } };
		vi.mocked(getGame).mockResolvedValue({ res: { _v: '1' } });
		await expect(createStone(bot, 2, 2)).resolves.toEqual({ message: null, sent: true });
		expect(getGame).toHaveBeenLastCalledWith(1, { i: 142, t: 2, t1: 2 }, bot.auth, 1, false, 2);
		await insertStone(bot, 1500, 1, 2, 3);
		expect(getGame).toHaveBeenLastCalledWith(1, { i: 144, t: 1500, t1: 1, t2: 2, t3: 3 }, bot.auth, 1, false, 2);
		await removeStone(bot, 1500, 2);
		expect(getGame).toHaveBeenLastCalledWith(1, { i: 143, t: 1500, t1: 2 }, bot.auth, 1, false, 2);
		vi.mocked(getGame).mockResolvedValue({ msg: 'Не хватает ресурсов' });
		await expect(createStone(bot, 2, 2)).resolves.toEqual({ message: 'Не хватает ресурсов', sent: true });
		vi.mocked(getGame).mockResolvedValue(null);
		await expect(removeStone(bot, 1500, 2)).resolves.toEqual({ message: null, sent: false });
	});
});
