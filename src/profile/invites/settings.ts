import { storageGet, storageSet } from '../../lib/storage';
import type { BotAuth } from '../bots/common';
import type { Setup } from './battle';

/** Свитки или зелья: «использовать» и предел расхода за бой (число строкой, как в поле ввода). */
export interface Limit {
	on: boolean;
	max: string;
}

/** Настройки боя с боссом: навык и расходники. */
export interface BattleSettings {
	skill: Setup['skill'];
	fire: Limit;
	lightning: Limit;
	potions: Limit;
}

const OFF: Limit = { on: false, max: '' };
export const DEFAULT_SETTINGS: BattleSettings = { skill: 0, fire: OFF, lightning: OFF, potions: OFF };

/** Ключ VK Storage: свои настройки у каждого профиля и каждого босса (допустимы только латиница, цифры, `_` и `-`). */
export const settingsKey = (bot: BotAuth, bossId: number) => `boss_${bot.server}_${String(bot.auth.login).replace(/[^\w-]/g, '_')}_${bossId}`.slice(0, 100);

const limit = (value: unknown): Limit => {
	const item = (value ?? {}) as Partial<Limit>;
	return { on: item.on === true, max: typeof item.max === 'string' ? item.max.slice(0, 12) : '' };
};

/** Настройки из сохранённой строки; всё непригодное заменяется значениями по умолчанию. */
export function parseSettings(raw: string | null): BattleSettings {
	if (!raw) return DEFAULT_SETTINGS;
	try {
		const data = JSON.parse(raw) as Partial<Record<keyof BattleSettings, unknown>>;
		const skill = Number(data.skill);
		return { skill: skill === 1 || skill === 2 || skill === 3 ? skill : 0, fire: limit(data.fire), lightning: limit(data.lightning), potions: limit(data.potions) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const loadSettings = async (key: string) => parseSettings(await storageGet(key));

/** Сохранить настройки; пустые (всё по умолчанию) стираются, чтобы не занимать место в хранилище. */
export function saveSettings(key: string, settings: BattleSettings) {
	const empty = !settings.skill && !settings.fire.on && !settings.lightning.on && !settings.potions.on;
	return storageSet(key, empty ? '' : JSON.stringify(settings));
}
