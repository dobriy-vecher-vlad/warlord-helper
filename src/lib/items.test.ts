import { describe, expect, it } from 'vitest';
import dataMap from '../data/map.json';
import { ARENA_SEASONS } from './data';
import { DEFAULT_FILTER, ITEMS, matchesFilter, tooltipText, visibleItems, type ItemRef } from './items';

describe('matchesFilter', () => {
	it('учитывает виды наград', () => {
		expect(matchesFilter({ id: 1, item: true }, DEFAULT_FILTER)).toBe(true);
		expect(matchesFilter({ id: 1, item: true }, { ...DEFAULT_FILTER, item: false })).toBe(false);
		expect(matchesFilter({ id: 1, scroll: true }, { ...DEFAULT_FILTER, item: false })).toBe(true);
	});
	it('личная коллекция не считается обычной', () => {
		const ref = { id: 1, collection: true, personal: true };
		expect(matchesFilter(ref, { ...DEFAULT_FILTER, personal: false })).toBe(false);
		expect(matchesFilter(ref, { ...DEFAULT_FILTER, collection: false })).toBe(true);
	});
});

describe('visibleItems', () => {
	it('предмет с заточкой идёт раньше просто предмета, затем коллекции', () => {
		const refs: ItemRef[] = [
			{ id: 540, collection: true },
			{ id: 17, item: true },
			{ id: 10, item: true, scroll: true },
		];
		expect(visibleItems(refs, DEFAULT_FILTER).map((r) => r.id)).toEqual([10, 17, 540]);
	});
	it('группы идут по возрастанию', () => {
		const refs = dataMap.raids[0]!.levels[0]!.items as ItemRef[];
		const result = visibleItems(refs, DEFAULT_FILTER);
		expect(result).toHaveLength(refs.length);
		const group = (r: ItemRef) => (r.item ? (r.collection ? (r.scroll ? 1 : 2) : r.scroll ? 3 : 4) : r.collection ? (r.scroll ? 5 : 6) : r.scroll ? 7 : 8);
		for (let i = 1; i < result.length; i++) expect(group(result[i - 1]!)).toBeLessThanOrEqual(group(result[i]!));
	});
	it('порядок совпадает со старым приложением (заточки «Пещеры гоблинов»)', () => {
		const adventure = dataMap.adventures[1]!;
		const floors = adventure.floors.flatMap((floor) => (floor.items[0] ? [{ id: floor.items[0].id, scroll: true }] : []));
		const arena = ARENA_SEASONS.flatMap((season) => season.month.flatMap((month) => month.items.map((item) => ({ id: item.id, scroll: true }))));
		const titles = visibleItems([...floors, ...arena], DEFAULT_FILTER)
			.slice(0, 5)
			.map((r) => ITEMS[r.id]!.title);
		expect(titles).toEqual(['Имперский Боевой Посох', 'Демонический Жезл', 'Алебарда Покорителя', 'Арканитовый Топор', 'Боевой Калаштай']);
	});
	it('отбрасывает пустые ссылки и не меняет исходный массив', () => {
		const refs = [null, { id: 17, item: true }, undefined];
		const copy = [...refs];
		expect(visibleItems(refs, DEFAULT_FILTER)).toEqual([{ id: 17, item: true }]);
		expect(refs).toEqual(copy);
	});
	it('скрывает отфильтрованные виды', () => {
		const refs: ItemRef[] = [
			{ id: 17, item: true },
			{ id: 540, collection: true },
		];
		expect(visibleItems(refs, { ...DEFAULT_FILTER, item: false }).map((r) => r.id)).toEqual([540]);
	});
});

describe('tooltipText', () => {
	it('массив соединяется через запятую', () => {
		expect(tooltipText({ id: 1, tooltip: ['Бочка', 'Сундук'] })).toBe('Бочка, Сундук');
		expect(tooltipText({ id: 1, tooltip: 'Предмет' })).toBe('Предмет');
		expect(tooltipText({ id: 1 })).toBe('');
	});
});
