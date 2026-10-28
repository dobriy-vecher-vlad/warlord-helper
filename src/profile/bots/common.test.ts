import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../app/notify', () => ({ notify: vi.fn() }));
vi.mock('../../store/nav', () => ({ openPanel: vi.fn() }));
vi.mock('../session', () => ({ currentProfile: vi.fn(), getSession: vi.fn(), openSettings: vi.fn() }));

import { getGame } from '../../api/game';
import { notify } from '../../app/notify';
import { openPanel } from '../../store/nav';
import { openSettings } from '../session';
import { loadBotProfile, type BotAuth } from './common';

const bot = (): BotAuth => ({ server: 1, auth: { login: 10, password: 'pass' } });

beforeEach(() => {
	vi.mocked(getGame).mockReset();
	vi.mocked(notify).mockReset();
	vi.mocked(openPanel).mockReset();
	vi.mocked(openSettings).mockReset();
});

describe('loadBotProfile', () => {
	it('успешный ответ дополняет авторизацию игровым id', async () => {
		vi.mocked(getGame).mockResolvedValue({ u: { _id: '55' } });
		const auth = bot();
		expect(await loadBotProfile(auth)).toEqual({ u: { _id: '55' } });
		expect(auth.auth.id).toBe('55');
	});

	it('нет ответа сервера — не неверный пароль: сообщение, без настроек и ухода со страницы', async () => {
		vi.mocked(getGame).mockResolvedValue(null);
		expect(await loadBotProfile(bot())).toBeNull();
		expect(notify).toHaveBeenCalledTimes(1);
		expect(openSettings).not.toHaveBeenCalled();
		expect(openPanel).not.toHaveBeenCalled();
	});

	it('вызывающий, для которого нет ответа допустим (опрос), не получает сообщения', async () => {
		vi.mocked(getGame).mockResolvedValue(null);
		expect(await loadBotProfile(bot(), (data) => data === null || !!data.u)).toBeNull();
		expect(notify).not.toHaveBeenCalled();
		expect(openSettings).not.toHaveBeenCalled();
	});

	it('ответ без персонажа — неверный пароль: сообщение, настройки и возврат на профиль', async () => {
		vi.mocked(getGame).mockResolvedValue({ err_msg: 'bad auth' });
		expect(await loadBotProfile(bot())).toBeNull();
		expect(openSettings).toHaveBeenCalledWith(expect.objectContaining({ error: 'bad auth' }));
		expect(openPanel).toHaveBeenCalledWith(null, { force: true });
	});
});
