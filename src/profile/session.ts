import { isEmbedded } from '../lib/platform';
import { createStore, useStore } from '../store/createStore';
import { getModalStack, openModal, subscribeModals } from '../store/modal';
import type { GameUser } from './constants';
import type { VKResponse, VKUser } from './vk';

/** Слот профиля в VK Storage (`storeProfiles`). Пустой слот — `{ id: null }`. */
export interface ProfileSlot {
	id: number | null;
	server?: number;
	login?: string | number | null;
	auth?: string | null;
	/** Основной профиль (сам пользователь ВК): его нельзя удалить */
	main?: boolean;
}

/** Слот с данными пользователя ВК для показа. */
export interface ProfileView extends ProfileSlot {
	first_name?: string;
	last_name?: string | number;
	photo_100?: string;
	photo_200?: string;
	photo_max_orig?: string;
}

/** Предмет персонажа: уровень, камни инкрустации (раздел, уровень) и бонусы. */
export interface OwnedItem {
	id: number;
	lvl: number;
	stones: [number, number][];
	bonus: number[];
}

/** Редактируемые настройки профиля (окно «Настройки» и вложенные окна). */
export interface ProfileDraft {
	id: number | string | null;
	login: string | number | null;
	auth: string | null;
	server: number | null;
}

export interface SessionState {
	/** off — вне ВК или игровой сервер недоступен: профиля нет, как в старом приложении */
	status: 'off' | 'loading' | 'ready';
	/** Задержка ответа игрового сервера, мс */
	latency: number;
	user: VKUser | null;
	isDonut: boolean;
	/** Ответ execute.getMembersFull: список донов (для панели «Доны») */
	donutUsers: VKResponse<{ items: VKUser[]; count?: number }> | null;
	/** VK id тех, кому доступна кнопка Kill в бою (execute.getProfileBossesWhitelist); пусто — список не получен */
	bossesWhitelist: readonly number[];
	/** VK id того, кто открыл приложение (ответ VK Bridge, а не адрес): по нему проверяется белый список Kill; 0 — не известен */
	launcherId: number;
	profiles: ProfileSlot[];
	profilesFull: ProfileView[];
	index: number;
	/** Число слотов профилей (зависит от суммы подписки) */
	size: number;
	/** Персонаж выбранного профиля (null — данные не загружались) */
	game: GameUser | null;
	/** Игровые id предметов персонажа */
	items: number[];
	itemsFull: OwnedItem[];
	/** Экран загрузки поверх приложения */
	busy: boolean;
	/** Обновление списка профилей (потянуть вниз) */
	fetching: boolean;
	draft: ProfileDraft;
}

export const EMPTY_DRAFT: ProfileDraft = { id: null, login: null, auth: null, server: null };

const session = createStore<SessionState>({
	status: isEmbedded() ? 'loading' : 'off',
	latency: 0,
	user: null,
	isDonut: false,
	donutUsers: null,
	bossesWhitelist: [],
	launcherId: 0,
	profiles: [],
	profilesFull: [],
	index: 0,
	size: 5,
	game: null,
	items: [],
	itemsFull: [],
	busy: isEmbedded(),
	fetching: false,
	draft: EMPTY_DRAFT,
});

export const getSession = () => session.get();
/** Изменить состояние сессии (для загрузчиков и действий над профилями). */
export const setSession = session.set;
export const useSession = <T>(selector: (state: SessionState) => T) => useStore(session, selector);
export const subscribeSession = session.subscribe;

/** Выбранный профиль. */
export const currentProfile = (state = session.get()): ProfileSlot | undefined => state.profiles[state.index];

/** Профиль с рейтингом: только серверы ВКонтакте. */
export const hasRating = (state = session.get()) => {
	const server = currentProfile(state)?.server;
	return server === 1 || server === 2;
};

export function setDraft(patch: Partial<ProfileDraft>) {
	session.set((state) => ({ ...state, draft: { ...state.draft, ...patch } }));
}

/** Черновик настроек = выбранный профиль (так старое приложение сбрасывало их при закрытии окон). */
export function draftFromProfile(state = session.get()): ProfileDraft {
	const profile = state.profilesFull[state.index] ?? state.profiles[state.index];
	return profile ? { id: profile.id ?? null, login: profile.login ?? null, auth: profile.auth ?? null, server: profile.server ?? null } : EMPTY_DRAFT;
}

// Все окна закрылись — несохранённые настройки сбрасываются
subscribeModals(() => {
	if (!getModalStack().length && session.get().status === 'ready') session.set({ draft: draftFromProfile() });
});

/** Проверка игрового сервера; задержка показывается в боковом меню. */
export async function checkServer(): Promise<boolean> {
	const start = Date.now();
	let ok = false;
	try {
		// Без ответа дольше 8 с сервер считается недоступным: иначе заставка осталась бы навсегда
		const abort = new AbortController();
		const timer = setTimeout(() => abort.abort(), 8000);
		try {
			await fetch('https://tmp1-fb.geronimo.su', { signal: abort.signal });
		} finally {
			clearTimeout(timer);
		}
		ok = true;
	} catch {
		ok = false;
	}
	session.set({ latency: Date.now() - start });
	return ok;
}

/** Окно настроек выбранного профиля, при ошибке авторизации — с текстом ошибки. */
export function openSettings(error?: { text: string; error?: string }) {
	session.set({ draft: draftFromProfile() });
	openModal('settings', error ? { header: 'Ошибка авторизации', subheader: error.text, error: error.error ?? '', auth: currentProfile()?.auth ?? null } : {});
}
