import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../api/game';
import { ITEMS } from '../lib/items';
import { collect, collectionState, collectionsFromProfile, partCounts, readinessOf, sortCollections, stageOf, timesCollected, type Collection } from './collections';

vi.mock('../api/game', () => ({ getGame: vi.fn() }));

const [first, second] = ITEMS;

/** Профиль: две коллекции с предметом (по пять частей) и одна с ресурсами (`it` = 0). */
const profile = {
	u: {},
	collections: {
		col_t: [
			{ _id: '24', _n: 'Нагрудник', _it: String(first!.id) },
			{ _id: '25', _n: 'Шлем', _it: String(second!.id) },
			{ _id: '1', _n: 'Алхимик', _it: '0' },
		],
		col_i: [
			...[3, 1, 2, 4, 5].map((n) => ({ _id: String(110 + n), _t: '24', _n: `Нагрудник: Деталь ${n}` })),
			...[1, 2, 3, 4, 5].map((n) => ({ _id: String(120 + n), _t: '25', _n: `Шлем: Часть ${n}` })),
			{ _id: '1', _t: '1', _n: 'Мел' },
		],
		u_col: [...[111, 112, 113, 114, 115].map((id) => ({ _i: String(id), _q: id === 112 ? '3' : '1' })), { _i: '121', _q: '2' }, { _i: '122', _q: '0' }],
	},
	ucollc: { i: [{ _id: '24', _cnt: '1' }] },
};

describe('коллекции профиля', () => {
	it('собирает коллекции с предметом: части по порядку, названия без имени предмета; ресурсные пропускает', () => {
		const list = collectionsFromProfile(profile as never)!;
		expect(list.map((collection) => collection.id)).toEqual([24, 25]);
		expect(list[0]!.item).toBe(first);
		expect(list[0]!.parts.map((part) => [part.id, part.name])).toEqual([
			[111, 'Деталь 1'],
			[112, 'Деталь 2'],
			[113, 'Деталь 3'],
			[114, 'Деталь 4'],
			[115, 'Деталь 5'],
		]);
		expect(collectionsFromProfile(null)).toBeNull();
		expect(collectionsFromProfile({ u: {} } as never)).toBeNull();
	});

	it('части игрока и число сборок читаются из профиля', () => {
		expect(partCounts(profile as never).get(112)).toBe(3);
		expect(partCounts(null).size).toBe(0);
		expect(timesCollected(profile as never).get(24)).toBe(1);
		expect(timesCollected({ u: {}, ucollc: { i: { _id: '5', _cnt: '2' } } } as never).get(5)).toBe(2);
	});

	it('состояние: полные наборы по наименьшей части, этап и готовность', () => {
		const [full, partial] = collectionsFromProfile(profile as never) as Collection[];
		const counts = partCounts(profile as never);
		const times = timesCollected(profile as never);
		const stateFull = collectionState(full!, counts, times, new Set([first!.id]));
		expect(stateFull).toEqual({ counts: [1, 3, 1, 1, 1], have: 5, sets: 1, times: 1, owned: true });
		expect(stageOf(stateFull)).toBe('repeat');
		expect(readinessOf(stateFull)).toBe('ready');
		const statePartial = collectionState(partial!, counts, times, new Set());
		expect(statePartial).toMatchObject({ have: 1, sets: 0, times: 0, owned: false });
		expect(stageOf(statePartial)).toBe('first');
		expect(readinessOf(statePartial)).toBe('progress');
		expect(readinessOf({ ...statePartial, have: 0 })).toBe('empty');
	});

	it('порядок: можно собрать, затем где больше частей', () => {
		const state = (have: number, sets: number) => ({ counts: [], have, sets, times: 0, owned: false });
		const rows = [
			{ id: 'a', state: state(0, 0) },
			{ id: 'b', state: state(4, 0) },
			{ id: 'c', state: state(5, 1) },
			{ id: 'd', state: state(2, 0) },
		];
		expect(sortCollections(rows).map((row) => row.id)).toEqual(['c', 'b', 'd', 'a']);
	});
});

describe('сборка', () => {
	beforeEach(() => vi.mocked(getGame).mockReset());

	it('запрос уходит методом 96 с id коллекции; ответ без отказа читается как отправленный', async () => {
		const bot = { server: 1, auth: { login: 10, password: 'pass' } };
		vi.mocked(getGame).mockResolvedValue({ a: { _res: '1' } });
		await expect(collect(bot, 24)).resolves.toEqual({ message: null, sent: true });
		expect(getGame).toHaveBeenCalledWith(1, { i: 96, t: 24 }, bot.auth, 1, false, 2);
		vi.mocked(getGame).mockResolvedValue({ msg: 'Не хватает частей' });
		await expect(collect(bot, 24)).resolves.toEqual({ message: 'Не хватает частей', sent: true });
		vi.mocked(getGame).mockResolvedValue(null);
		await expect(collect(bot, 24)).resolves.toEqual({ message: null, sent: false });
	});
});
