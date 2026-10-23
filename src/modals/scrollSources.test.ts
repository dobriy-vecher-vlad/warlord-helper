import { describe, expect, it } from 'vitest';
import dataMap from '../data/map.json';
import { ITEMS, type ItemRef } from '../lib/items';
import { scrollSources } from './scrollSources';

describe('scrollSources', () => {
	it('находит рейд как источник заточки', () => {
		const ref = (dataMap.raids[0]!.levels[0]!.items as ItemRef[]).find((r) => r.scroll)!;
		expect(scrollSources(ref.id)).toContain(`Рейд ${dataMap.raids[0]!.title}`);
	});
	it('первый источник с заглавной буквы, остальные со строчной', () => {
		for (let i = 0; i < ITEMS.length; i += 37) {
			const sources = scrollSources(i);
			sources.forEach((s, n) => {
				if (n === 0) expect(s[0]).toBe(s[0]!.toUpperCase());
			});
		}
	});
	it('несуществующий предмет -> пусто', () => {
		expect(scrollSources(100000)).toEqual([]);
	});
});
