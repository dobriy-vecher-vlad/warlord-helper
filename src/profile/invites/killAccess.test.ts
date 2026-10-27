import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../vk', () => ({ callApi: vi.fn(), getBridge: vi.fn(async () => ({ id: 153968505 })) }));
vi.mock('../../lib/platform', () => ({ isEmbedded: () => true }));

describe('loadBossesWhitelist', () => {
	beforeEach(() => vi.resetModules());

	it('запрашивается один раз и кладёт список в сессию', async () => {
		const { callApi } = await import('../vk');
		const { getSession } = await import('../session');
		const { loadBossesWhitelist } = await import('./killAccess');
		vi.mocked(callApi).mockResolvedValue({ response: { count: 1, items: [153968505] } } as never);
		await Promise.all([loadBossesWhitelist(), loadBossesWhitelist()]);
		await loadBossesWhitelist();
		expect(callApi).toHaveBeenCalledTimes(1);
		expect(callApi).toHaveBeenCalledWith('execute.getProfileBossesWhitelist');
		expect(getSession().bossesWhitelist).toEqual([153968505]);
		expect(getSession().launcherId).toBe(153968505);
	});

	it('сбой молча оставляет список пустым, при следующем открытии запрос повторяется', async () => {
		const { callApi } = await import('../vk');
		const { getSession } = await import('../session');
		const { loadBossesWhitelist } = await import('./killAccess');
		vi.mocked(callApi)
			.mockResolvedValueOnce(null as never)
			.mockResolvedValueOnce({ response: { count: 1, items: [5] } } as never);
		await loadBossesWhitelist();
		expect(getSession().bossesWhitelist).toEqual([]);
		await loadBossesWhitelist();
		expect(callApi).toHaveBeenCalledTimes(2);
		expect(getSession().bossesWhitelist).toEqual([5]);
	});
});
