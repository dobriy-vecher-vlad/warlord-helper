import { describe, expect, it } from 'vitest';
import { appendLog } from './log';

describe('appendLog', () => {
	it('добавляет запись в конец', () => {
		expect(appendLog([1, 2], 3)).toEqual([1, 2, 3]);
	});

	it('сверх лимита отбрасывает самые старые записи', () => {
		expect(appendLog([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
		expect(appendLog([1, 2, 3, 4, 5], 6, 3)).toEqual([4, 5, 6]);
	});

	it('не меняет исходный список', () => {
		const list = [1, 2, 3];
		appendLog(list, 4, 3);
		expect(list).toEqual([1, 2, 3]);
	});
});
