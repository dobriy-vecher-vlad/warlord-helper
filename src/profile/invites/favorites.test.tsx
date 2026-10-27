import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/storage', () => ({ storageGet: vi.fn(), storageSet: vi.fn(async () => true) }));

import { storageGet, storageSet } from '../../lib/storage';
import { flush, installBrowserStubs, render } from '../../test/harness';
import { RECENT_LIMIT, bossListsKey, loadBossLists, parseBossLists, rememberRecent, toggleFavorite, useBossLists } from './favorites';

installBrowserStubs();

const bot = { server: 1, auth: { login: 5, password: 'k' } };

describe('parseBossLists', () => {
	it('читает списки, всё непригодное отбрасывает', () => {
		expect(parseBossLists('{"f":[3,3,"4",0,"x"],"r":[1,2,3,4,5,6,7]}')).toEqual({ favorites: [3, 4], recent: [1, 2, 3, 4, 5] });
		expect(parseBossLists('не json')).toEqual({ favorites: [], recent: [] });
		expect(parseBossLists(null)).toEqual({ favorites: [], recent: [] });
	});
});

describe('избранное и последние', () => {
	beforeEach(() => {
		vi.mocked(storageGet).mockReset().mockResolvedValue(null);
		vi.mocked(storageSet).mockClear();
	});

	it('звезда ставится и снимается, списки сохраняются под ключом профиля', async () => {
		await toggleFavorite(bot, 10);
		await toggleFavorite(bot, 20);
		expect(vi.mocked(storageSet).mock.calls.at(-1)).toEqual([bossListsKey(bot), '{"f":[10,20],"r":[]}']);
		await toggleFavorite(bot, 10);
		expect(vi.mocked(storageSet).mock.calls.at(-1)).toEqual([bossListsKey(bot), '{"f":[20],"r":[]}']);
		await toggleFavorite(bot, 20);
		expect(vi.mocked(storageSet).mock.calls.at(-1)).toEqual([bossListsKey(bot), '']);
	});

	it('последние: новый босс первым, повтор поднимается наверх, помнится не больше пяти', async () => {
		for (const id of [1, 2, 3, 4, 5, 6]) await rememberRecent(bot, id);
		await rememberRecent(bot, 4);
		const saved = JSON.parse(String(vi.mocked(storageSet).mock.calls.at(-1)![1])) as { r: number[] };
		expect(saved.r).toEqual([4, 6, 5, 3, 2]);
		expect(saved.r).toHaveLength(RECENT_LIMIT);
	});

	it('списки читаются из хранилища один раз', async () => {
		await loadBossLists(bot);
		await loadBossLists(bot);
		expect(storageGet).toHaveBeenCalledTimes(0);
	});

	it('при смене профиля туда и обратно у каждого остаются свои списки', async () => {
		const other = { server: 1, auth: { login: 6, password: 'k' } };
		await toggleFavorite(bot, 31);
		await toggleFavorite(other, 32);
		const seen: Record<string, readonly number[]> = {};
		const Probe = ({ name, owner }: { name: string; owner: typeof bot }) => {
			seen[name] = useBossLists(owner).favorites;
			return null;
		};
		await render(
			<>
				<Probe name="first" owner={bot} />
				<Probe name="second" owner={other} />
			</>,
		);
		await flush();
		expect(seen.first).toContain(31);
		expect(seen.first).not.toContain(32);
		expect(seen.second).toEqual([32]);
	});
});
