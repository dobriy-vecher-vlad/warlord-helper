import { describe, expect, it } from 'vitest';
import { loadHubData } from '../panels/sections';
import { HUB_STORIES } from './registry';

describe('данные главных панелей разделов', () => {
	for (const story of HUB_STORIES) {
		it(`${story.id}: у каждого подраздела со счётчиком есть количество, у баннера — картинки`, async () => {
			const data = await loadHubData(story.id);
			expect(data.images.length).toBeGreaterThan(0);
			for (const cell of story.cells) {
				// Калькуляторы без счётчика
				if (cell.profile === 'icon') continue;
				expect(data.counts[cell.panel], `${story.id}/${cell.panel}`).toBeGreaterThan(0);
			}
		});
	}
});
