import { beforeEach, describe, expect, it } from 'vitest';
import { storageGet, storageGetOrSet, storageRemove, storageSet } from './storage';

describe('storage (вне ВК, localStorage)', () => {
	beforeEach(() => localStorage.clear());

	it('записывает и читает значение', async () => {
		expect(await storageGet('k')).toBeNull();
		expect(await storageSet('k', 'v')).toBe(true);
		expect(await storageGet('k')).toBe('v');
	});
	it('удаление делает значение пустым', async () => {
		await storageSet('k', 'v');
		await storageRemove('k');
		expect(await storageGet('k')).toBeNull();
	});
	it('storageGetOrSet сохраняет значение по умолчанию только если значения нет', async () => {
		expect(await storageGetOrSet('k', 'def')).toBe('def');
		expect(await storageGet('k')).toBe('def');
		await storageSet('k', 'own');
		expect(await storageGetOrSet('k', 'def')).toBe('own');
	});
});
