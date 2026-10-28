import { beforeEach, describe, expect, it, vi } from 'vitest';
import bridge from '@vkontakte/vk-bridge';
import { storageGet, storageGetOrSet, storageGetWithDefault, storageRemove, storageSet } from './storage';

vi.mock('./platform', () => ({ isEmbedded: () => embedded }));
vi.mock('@vkontakte/vk-bridge', () => ({ default: { send: vi.fn() } }));

let embedded = false;

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

describe('storage (внутри ВК, сбои моста)', () => {
	const send = vi.mocked(bridge.send) as unknown as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		embedded = true;
		send.mockReset();
	});

	it('сбой чтения не затирает сохранённое значением по умолчанию', async () => {
		send.mockRejectedValue(new Error('network'));
		const result = await storageGetWithDefault('storeProfiles', 'defaults');
		expect(result).toEqual({ value: 'defaults', existed: true, failed: true });
		// Ничего не записано: был один вызов чтения, записи (VKWebAppStorageSet) нет
		expect(send.mock.calls.map(([method]) => method)).toEqual(['VKWebAppStorageGet']);
	});

	it('storageGetOrSet при сбое чтения возвращает значение по умолчанию и ничего не пишет', async () => {
		send.mockRejectedValue(new Error('network'));
		expect(await storageGetOrSet('k', 'def')).toBe('def');
		expect(send).toHaveBeenCalledTimes(1);
	});

	it('пустое значение — это «нет значения»: по умолчанию записывается', async () => {
		send.mockImplementation(async (method: string) => (method === 'VKWebAppStorageGet' ? { keys: [{ key: 'k', value: '' }] } : { result: true }));
		const result = await storageGetWithDefault('k', 'def');
		expect(result).toEqual({ value: 'def', existed: false, failed: false });
		expect(send.mock.calls.map(([method]) => method)).toEqual(['VKWebAppStorageGet', 'VKWebAppStorageSet']);
	});

	it('мост, который не отвечает, не вешает приложение: чтение завершается сбоем по таймауту', async () => {
		vi.useFakeTimers();
		send.mockReturnValue(new Promise(() => undefined));
		const pending = storageGetWithDefault('k', 'def');
		await vi.advanceTimersByTimeAsync(10_001);
		expect(await pending).toEqual({ value: 'def', existed: true, failed: true });
		vi.useRealTimers();
	});

	it('запись, которую мост не принял, возвращает false', async () => {
		send.mockRejectedValue(new Error('denied'));
		expect(await storageSet('k', 'v')).toBe(false);
		embedded = false;
	});
});
