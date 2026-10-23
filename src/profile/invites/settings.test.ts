import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/storage', () => ({ storageGet: vi.fn(), storageSet: vi.fn(async () => true) }));

import { storageGet, storageSet } from '../../lib/storage';
import { DEFAULT_SETTINGS, loadSettings, parseSettings, saveSettings, settingsKey } from './settings';

const bot = { server: 1, auth: { login: 153968505, password: 'k' } };

describe('settingsKey', () => {
	it('свои настройки у профиля и у босса; ключ допустим для VK Storage', () => {
		expect(settingsKey(bot, 69)).toBe('boss_1_153968505_69');
		expect(settingsKey(bot, 70)).not.toBe(settingsKey(bot, 69));
		expect(settingsKey({ server: 2, auth: { login: 'a,b c' } }, 5)).toBe('boss_2_a_b_c_5');
		expect(settingsKey({ server: 1, auth: { login: 'x'.repeat(200) } }, 5)).toHaveLength(100);
	});
});

describe('parseSettings', () => {
	it('читает сохранённое', () => {
		const raw = JSON.stringify({ skill: 3, fire: { on: true, max: '10' }, lightning: { on: false, max: '5' }, potions: { on: true, max: '' } });
		expect(parseSettings(raw)).toEqual({ skill: 3, fire: { on: true, max: '10' }, lightning: { on: false, max: '5' }, potions: { on: true, max: '' } });
	});

	it('пусто, мусор и неверные значения — настройки по умолчанию', () => {
		expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings('не json')).toEqual(DEFAULT_SETTINGS);
		expect(parseSettings(JSON.stringify({ skill: 9, fire: 5 }))).toEqual(DEFAULT_SETTINGS);
	});
});

describe('loadSettings и saveSettings', () => {
	beforeEach(() => {
		vi.mocked(storageGet).mockReset();
		vi.mocked(storageSet).mockClear();
	});

	it('читает по ключу', async () => {
		vi.mocked(storageGet).mockResolvedValueOnce(JSON.stringify({ skill: 1, fire: { on: true, max: '2' } }));
		expect(await loadSettings('k')).toMatchObject({ skill: 1, fire: { on: true, max: '2' } });
		expect(storageGet).toHaveBeenCalledWith('k');
	});

	it('сохраняет изменённое, а настройки по умолчанию стирает', async () => {
		await saveSettings('k', { ...DEFAULT_SETTINGS, skill: 2 });
		expect(vi.mocked(storageSet).mock.calls[0]![1]).toContain('"skill":2');
		await saveSettings('k', DEFAULT_SETTINGS);
		expect(vi.mocked(storageSet).mock.calls[1]).toEqual(['k', '']);
	});
});
