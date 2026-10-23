import { describe, expect, it } from 'vitest';
import { mapLimit, wait } from './async';

describe('mapLimit', () => {
	it('возвращает результаты в порядке элементов', async () => {
		const result = await mapLimit([30, 5, 15], 3, async (ms, index) => {
			await wait(ms);
			return index;
		});
		expect(result).toEqual([0, 1, 2]);
	});

	it('не запускает больше задач одновременно, чем разрешено', async () => {
		let active = 0;
		let peak = 0;
		await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => {
			active++;
			peak = Math.max(peak, active);
			await wait(5);
			active--;
		});
		expect(peak).toBe(2);
	});

	it('пустой список не запускает задач', async () => {
		expect(await mapLimit([], 3, async () => 1)).toEqual([]);
	});

	it('ошибка задачи пробрасывается и новые задачи не стартуют', async () => {
		const started: number[] = [];
		await expect(
			mapLimit([1, 2, 3, 4, 5], 1, async (item) => {
				started.push(item);
				if (item === 2) throw new Error('сбой');
				return item;
			}),
		).rejects.toThrow('сбой');
		expect(started).toEqual([1, 2]);
	});
});
