import bridge from '@vkontakte/vk-bridge';
import { isEmbedded } from '../lib/platform';
import { storageGet, storageSet } from '../lib/storage';
import { createStore, useStore } from './createStore';

/** Темы названы как в старом приложении: от них зависят значения в хранилище и атрибут `scheme` на body. */
export type Theme = 'bright_light' | 'space_gray';

const THEME_KEY = 'VKWikiTheme';
const DARK_SCHEMES = ['space_gray', 'vkcom_dark'];
/** Сколько ждать тему от клиента ВК, мс */
const THEME_WAIT = 3000;

/** known: тема определена (внутри ВК приходит с первым VKWebAppUpdateConfig); до этого приложение ничего не рисует */
const themeStore = createStore<{ theme: Theme; known: boolean }>({ theme: 'bright_light', known: false });

function apply(theme: Theme) {
	themeStore.set({ theme, known: true });
	document.body.setAttribute('scheme', theme);
}

export const useTheme = () => useStore(themeStore, (s) => s.theme);
export const useThemeKnown = () => useStore(themeStore, (s) => s.known);
export const getTheme = () => themeStore.get().theme;

/**
 * Вне ВК тема хранится в localStorage и переключается вручную.
 * Внутри ВК тема всегда повторяет настройку клиента (VKWebAppUpdateConfig).
 */
export async function initTheme(): Promise<void> {
	if (isEmbedded()) {
		bridge.subscribe(({ detail: { type, data } }) => {
			if (type === 'VKWebAppUpdateConfig') {
				apply(DARK_SCHEMES.includes((data as { scheme: string }).scheme) ? 'space_gray' : 'bright_light');
			}
		});
		// Клиент ВК не прислал тему: без неё приложение ничего не рисует, поэтому берём тему системы
		setTimeout(() => {
			if (!themeStore.get().known) apply(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'space_gray' : 'bright_light');
		}, THEME_WAIT);
		return;
	}
	const saved = await storageGet(THEME_KEY);
	apply(saved === 'space_gray' ? 'space_gray' : 'bright_light');
}

export async function toggleTheme(): Promise<void> {
	const next: Theme = getTheme() === 'bright_light' ? 'space_gray' : 'bright_light';
	apply(next);
	await storageSet(THEME_KEY, next);
}
