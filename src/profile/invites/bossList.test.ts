import { describe, expect, it } from 'vitest';
import { selectBosses, type BossGroupLike, type BossListData, type Lockable, type RegionAccess } from './bossList';

const entry = (id: number) => ({ id });
const groups: BossGroupLike<{ id: number }>[] = [
	{ title: 'Общие', items: [entry(1), entry(2), entry(3), entry(4)] },
	{ title: 'Одиночные', items: [entry(5)] },
	{ title: 'Рейдовые', items: [entry(6)] },
];
const npcs = new Map([
	[1, { type: 1, level: 1 }],
	[2, { type: 1, level: 1 }],
	[3, { type: 1, level: 1 }],
	[4, { type: 4, level: 1 }],
	[5, { type: 1, level: 1 }],
	[6, { type: 3, level: 1 }],
]);
const regions = new Map([
	[1, 30],
	[2, 10],
	[3, 10],
	[5, 99],
	[6, 10],
]);
const locations = new Map<number, RegionAccess>([
	[30, { level: 40, requires: null }],
	[10, { level: 5, requires: null }],
	[99, { level: 90, requires: 700 }],
]);
const names = new Map([[700, 'Хозяин пещеры']]);
const base: BossListData = { npcs, locations, regions, player: null, kills: null, names };
const ids = (result: BossGroupLike<Lockable<{ id: number }>>[]) => result.map((group) => group.items.map((item) => item.id));
const locks = (result: BossGroupLike<Lockable<{ id: number }>>[]) => Object.fromEntries(result.flatMap((group) => group.items.map((item) => [item.id, item.lock])));

describe('selectBosses', () => {
	it('оставляет боссов, с которыми можно начать бой (тип боя 1), пустые группы пропускает', () => {
		const result = selectBosses(groups, { ...base, locations: null, regions: null });
		expect(result.map((group) => group.title)).toEqual(['Общие', 'Одиночные']);
		expect(ids(result)).toEqual([[1, 2, 3], [5]]);
	});

	it('внутри группы — по уровню локации, при равном уровне по номеру района, при равном районе как в исходном списке', () => {
		expect(ids(selectBosses(groups, base))[0]).toEqual([2, 3, 1]);
		// id босса порядок не задаёт: у Ксардаса (474) район 38, у Эльоддура (473) район 39 — Ксардас идёт первым
		const same: BossGroupLike<{ id: number }>[] = [{ title: 'Общие', items: [entry(473), entry(474), entry(9)] }];
		const map = new Map([
			[473, 39],
			[474, 38],
			[9, 38],
		]);
		const flat = new Map<number, RegionAccess>([
			[38, { level: 30, requires: null }],
			[39, { level: 30, requires: null }],
		]);
		const typed = new Map([473, 474, 9].map((id) => [id, { type: 1, level: 1 }]));
		expect(ids(selectBosses(same, { ...base, npcs: typed, locations: flat, regions: map }))[0]).toEqual([474, 9, 473]);
	});

	it('закрытые локацией боссы остаются в списке с причиной: уровень района, а не босса', () => {
		const result = selectBosses(groups, { ...base, player: { level: 10 }, kills: new Map([[700, 1]]) });
		expect(ids(result)).toEqual([[2, 3, 1], [5]]);
		expect(locks(result)).toEqual({ 1: 'Нужен 40 уровень', 2: null, 3: null, 5: 'Нужен 90 уровень' });
	});

	it('локация, которая требует убить босса, закрыта, пока он не убит', () => {
		const high = { ...base, player: { level: 99 } };
		expect(locks(selectBosses(groups, { ...high, kills: new Map() }))).toMatchObject({ 5: 'Сначала убейте босса «Хозяин пещеры»', 1: null });
		expect(locks(selectBosses(groups, { ...high, kills: new Map([[700, 0]]) }))[5]).toBe('Сначала убейте босса «Хозяин пещеры»');
		expect(locks(selectBosses(groups, { ...high, kills: new Map([[700, 3]]) }))[5]).toBeNull();
	});

	it('без данных об убийствах требование убить босса не проверяется', () => {
		expect(locks(selectBosses(groups, { ...base, player: { level: 99 }, kills: null }))[5]).toBeNull();
	});

	it('не хватает уровня самого босса — тоже причина', () => {
		const strict = new Map(npcs).set(2, { type: 1, level: 50 });
		expect(locks(selectBosses(groups, { ...base, npcs: strict, player: { level: 40 }, kills: new Map([[700, 1]]) }))[2]).toBe('Нужен 50 уровень');
	});

	it('пока данные локаций, справочник или персонаж не загружены, всё открыто', () => {
		for (const data of [
			{ ...base, regions: null },
			{ ...base, locations: null },
			{ ...base, player: null },
		]) {
			expect(Object.values(locks(selectBosses(groups, { ...data, player: data.player ?? null }))).every((lock) => lock === null)).toBe(true);
		}
		expect(ids(selectBosses(groups, { ...base, regions: null, player: { level: 1 } }))).toEqual([[1, 2, 3], [5]]);
	});

	it('не меняет исходные группы', () => {
		selectBosses(groups, { ...base, player: { level: 40 } });
		expect(groups[0]!.items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
	});
});
