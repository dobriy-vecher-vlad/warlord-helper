import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../app/notify', () => ({ notify: vi.fn() }));
vi.mock('./sessionLoad', () => ({ reloadProfile: vi.fn() }));

import { notify } from '../app/notify';
import { closeModal } from '../store/modal';
import { refreshProfiles, saveSettings, selectProfile } from './profileActions';
import { getSession, setSession } from './session';
import { reloadProfile } from './sessionLoad';

const profiles = [
	{ id: 1, server: 1, login: 1, auth: 'a' },
	{ id: 2, server: 1, login: 2, auth: 'b' },
];

/** Загрузка профиля, которую завершает тест. */
function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => (resolve = done));
	return { promise, resolve };
}

describe('profileActions', () => {
	beforeEach(() => {
		closeModal();
		vi.mocked(notify).mockReset();
		vi.mocked(reloadProfile).mockReset();
		setSession({ profiles, profilesFull: [...profiles], index: 0, busy: false, fetching: false, isDonut: true });
	});

	it('выбор профиля снимает экран загрузки, даже если загрузка упала', async () => {
		vi.mocked(reloadProfile).mockRejectedValue(new Error('сбой'));
		await expect(selectProfile(1)).rejects.toThrow('сбой');
		expect(getSession().busy).toBe(false);
	});

	it('ответ устаревшего выбора помечается как устаревший, экран загрузки снимает последний', async () => {
		const first = deferred();
		const second = deferred();
		const stale: (() => boolean)[] = [];
		vi.mocked(reloadProfile)
			.mockImplementationOnce((_id, isStale) => (stale.push(isStale), first.promise))
			.mockImplementationOnce((_id, isStale) => (stale.push(isStale), second.promise));

		const one = selectProfile(0);
		const two = selectProfile(1);
		expect(stale[0]!()).toBe(true);
		expect(stale[1]!()).toBe(false);

		first.resolve();
		await one;
		expect(getSession().busy).toBe(true);
		second.resolve();
		await two;
		expect(getSession().busy).toBe(false);
	});

	it('обновление списка снимает признак загрузки при ошибке', async () => {
		vi.mocked(reloadProfile).mockRejectedValue(new Error('сбой'));
		await expect(refreshProfiles()).rejects.toThrow('сбой');
		expect(getSession().fetching).toBe(false);
	});

	it('сохранение настроек без сервера не меняет профили', async () => {
		setSession({ draft: { id: 1, login: 1, auth: 'a', server: null } });
		await saveSettings();
		expect(notify).toHaveBeenCalledWith({ text: 'Указаны не все параметры', icon: 'error' });
		expect(getSession().profiles).toEqual(profiles);
	});

	it('сохранение настроек без идентификатора не меняет профили', async () => {
		setSession({ draft: { id: 0, login: 1, auth: 'a', server: 1 } });
		await saveSettings();
		expect(notify).toHaveBeenCalledWith({ text: 'Указаны не все параметры', icon: 'error' });
		expect(getSession().profiles).toEqual(profiles);
	});
});
