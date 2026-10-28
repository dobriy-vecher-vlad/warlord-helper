import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/storage', () => ({ storageRead: vi.fn(), storageSet: vi.fn(async () => true) }));
vi.mock('../../app/notify', () => ({ notify: vi.fn() }));

import { notify } from '../../app/notify';
import { storageRead, storageSet } from '../../lib/storage';
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
		vi.mocked(storageRead).mockReset().mockResolvedValue({ ok: true, value: null });
		vi.mocked(notify).mockClear();
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
		expect(storageRead).toHaveBeenCalledTimes(0);
	});

	it('при смене профиля туда и обратно у каждого остаются свои списки', async () => {
		const other = { server: 1, auth: { login: 6, password: 'k' } };
		await toggleFavorite(bot, 31);
		await toggleFavorite(other, 32);
		const seen: Record<string, readonly number[]> = {};
		const Probe = ({ name, owner }: { name: string; owner: typeof bot }) => {
			const favorites = useBossLists(owner).favorites;
			// Тест складывает значения для проверки после отрисовки (в самой отрисовке ничего не меняется)
			useEffect(() => {
				seen[name] = favorites;
			});
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
	it('сбой чтения не затирает сохранённое: изменение отклоняется, ничего не записывается, загрузка повторится', async () => {
		const lost = { server: 1, auth: { login: 77, password: 'k' } };
		vi.mocked(storageRead).mockResolvedValueOnce({ ok: false, value: null });
		expect(await toggleFavorite(lost, 10)).toBe(false);
		expect(storageSet).not.toHaveBeenCalled();
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
		// Хранилище снова отвечает: списки читаются заново и меняются поверх настоящих, а не пустых
		vi.mocked(storageRead).mockResolvedValue({ ok: true, value: '{"f":[5],"r":[]}' });
		expect(await toggleFavorite(lost, 10)).toBe(true);
		expect(vi.mocked(storageSet).mock.calls.at(-1)).toEqual([bossListsKey(lost), '{"f":[5,10],"r":[]}']);
	});

	it('хранилище не приняло запись — человек узнаёт об этом', async () => {
		const sad = { server: 1, auth: { login: 78, password: 'k' } };
		vi.mocked(storageSet).mockResolvedValueOnce(false);
		expect(await toggleFavorite(sad, 1)).toBe(false);
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: expect.stringContaining('сохранить') }));
	});
});
