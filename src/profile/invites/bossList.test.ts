import { describe, expect, it } from 'vitest';
import { selectBosses, type BossGroupLike, type BossListData, type Lockable, type RegionAccess } from './bossList';

const entry = (id: number) => ({ id });
const groups: BossGroupLike<{ id: number }>[] = [
	{ title: 'Общие', items: [entry(1), entry(2), entry(3), entry(4)] },
	{ title: 'Одиночные', items: [entry(5)] },
	{ title: 'Рейдовые', items: [entry(6)] },
];
const npcs = new Map([
	[1, { type: 1, level: 1, region: 30 }],
	[2, { type: 1, level: 1, region: 10 }],
	[3, { type: 1, level: 1, region: 10 }],
	[4, { type: 4, level: 1, region: 30 }],
	[5, { type: 1, level: 1, region: 99 }],
	[6, { type: 3, level: 1, region: 10 }],
]);
const regions = new Map([
	[1, 30],
	[2, 10],
	[3, 10],
	[5, 99],
	[6, 10],
]);
const locations = new Map<number, RegionAccess>([
	[30, { level: 40 }],
	[10, { level: 5 }],
	[99, { level: 90 }],
]);
const base: BossListData = { npcs, locations, regions, player: null };
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
			[38, { level: 30 }],
			[39, { level: 30 }],
		]);
		const typed = new Map([473, 474, 9].map((id) => [id, { type: 1, level: 1, region: 1 }]));
		expect(ids(selectBosses(same, { ...base, npcs: typed, locations: flat, regions: map }))[0]).toEqual([474, 9, 473]);
	});

	it('район, в котором ещё не были, закрыт: номер района должен быть меньше числа открытых', () => {
		const result = selectBosses(groups, { ...base, player: { level: 99, maxRegion: 31 } });
		expect(locks(result)).toEqual({ 1: null, 2: null, 3: null, 5: 'Район не открыт: побывайте в нём на карте' });
		expect(locks(selectBosses(groups, { ...base, player: { level: 99, maxRegion: 30 } }))[1]).toBe('Район не открыт: побывайте в нём на карте');
	});

	it('нет данных о числе открытых районов — районы не проверяются', () => {
		expect(locks(selectBosses(groups, { ...base, player: { level: 99, maxRegion: 0 } }))[5]).toBeNull();
	});

	it('не хватает уровня самого босса — причина (уровень района не проверяется)', () => {
		const strict = new Map(npcs).set(2, { type: 1, level: 50, region: 10 });
		const result = selectBosses(groups, { ...base, npcs: strict, player: { level: 40, maxRegion: 100 } });
		expect(locks(result)).toMatchObject({ 2: 'Нужен 50 уровень', 1: null, 5: null });
	});

	it('пока данные локаций или справочник не загружены, порядок исходный, а персонаж без данных — всё открыто', () => {
		expect(ids(selectBosses(groups, { ...base, regions: null, player: { level: 1, maxRegion: 100 } }))).toEqual([[1, 2, 3], [5]]);
		expect(Object.values(locks(selectBosses(groups, base))).every((lock) => lock === null)).toBe(true);
	});

	it('не меняет исходные группы', () => {
		selectBosses(groups, { ...base, player: { level: 40, maxRegion: 100 } });
		expect(groups[0]!.items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
	});
});
