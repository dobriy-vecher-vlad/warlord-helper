import { getGame, type GameAuth } from '../../../api/game';
import { PRIORITY } from '../../../api/http';
import type { Attrs, GameResponse, GuildResponse, ProfileResponse } from '../../../api/gameTypes';
import { INITIAL_TIMES, type BotProfile, type Mode } from './resourcesData';
import { RESOURCE_ACTIONS, applyProfile, type ResourceContext, type ResourceState } from './resourcesActions';

/** Почему профиль не удалось подготовить к сбору. */
export type Problem = 'noauth' | 'badauth' | 'network';

/** Запрос к игре (в тестах подменяется). */
export type Request = (server: number, body: Record<string, string | number>, auth: GameAuth) => Promise<GameResponse>;

/** Окружение сбора: что страница даёт ядру и что ядро сообщает странице. Само ядро ничего не знает ни о React, ни об окнах приложения. */
export interface ResourceEnv {
	/** Состояние профиля, открытого на странице: его показывает страница, его меняют действия */
	state: ResourceState;
	/** Страница ещё открыта: после ухода с неё сбор прекращается */
	alive: () => boolean;
	/** Этот профиль открыт на странице (его данные показываются, у других своё временное состояние) */
	isShown: (profile: BotProfile) => boolean;
	/** Состояние показанного профиля изменилось: страница обновляет вид */
	publish: () => void;
	/** Профиль не подготовлен: страница решает, что сказать человеку (настройки, сообщение, строка лога) */
	problem: (kind: Problem, profile: BotProfile, detail?: unknown) => void;
	logText: ResourceContext['logText'];
	logMessage: ResourceContext['logMessage'];
	/** Запрос к игре; по умолчанию настоящий (в приоритете действия: сбор запущен человеком) */
	request?: Request;
}

const defaultRequest: Request = (server, body, auth) => getGame(server, body, auth, 1, false, PRIORITY.action);

/** Шаги «Запустить» по порядку. */
export const ALL_STEPS: readonly (readonly [Mode, string])[] = [
	['map', 'collect'],
	['chest', 'collect'],
	['chest', 'open'],
	['pet', 'collect'],
	['pet', 'send'],
	['lottery', 'collect'],
	['search', 'collect'],
	['energy', 'collect'],
	['daily', 'collect'],
	['vip', 'collect'],
	['guildBuild', 'collect'],
	['guildReward', 'collect'],
	['guildWars', 'collect'],
];

/** Пустое состояние для профиля, который не показан на странице («Запустить со всех»): настройки сбора берутся у показанного. */
export function scratchState(shown: ResourceState): ResourceState {
	return { guildReward: shown.guildReward, wars: { start: shown.wars.start, end: null }, profiles: [], counts: {}, times: { ...INITIAL_TIMES }, hints: {} };
}

/** Данные профиля, которые нужны действиям. */
interface Synced {
	game: ResourceContext['game'];
	dataProfile: ProfileResponse & { u: Attrs };
	user: Attrs;
	builds: Attrs[];
	chests: Attrs[];
	server: number;
	state: ResourceState;
}

/**
 * Свежие данные профиля и гильдии; таймеры и подсказки карточек пересчитываются в `state`. null — подготовить не удалось
 * (`env.problem` уже сообщил почему) или страницу закрыли. Нет ответа игры (сеть) не считается неверным паролем: страница не
 * выбрасывает человека в настройки из-за обрыва связи.
 */
async function sync(env: ResourceEnv, profile: BotProfile, state: ResourceState): Promise<Synced | null> {
	if (!profile.auth) {
		env.problem('noauth', profile);
		return null;
	}
	const request = env.request ?? defaultRequest;
	const server = profile.server;
	const auth: GameAuth = { login: profile.login, password: profile.auth };
	const game = (body: Record<string, string | number>) => request(server, body, auth);

	const dataProfile: ProfileResponse | null = await request(server, {}, auth);
	if (!env.alive()) return null;
	if (dataProfile === null) {
		env.problem('network', profile);
		return null;
	}
	auth.id = dataProfile.u?._id || profile.login;
	let guild: GuildResponse | null = {};
	if (dataProfile.u && Number(dataProfile.u._clan_id) !== 0) {
		const data = await game({ i: 49, t1: dataProfile.u._clan_id || 0 });
		if (!env.alive()) return null;
		if (data === null) {
			env.problem('network', profile);
			return null;
		}
		guild = data.clan ?? null;
	}
	if (!dataProfile.u || guild === null) {
		env.problem('badauth', profile, dataProfile);
		return null;
	}
	const user = dataProfile.u;
	const { builds, chests } = applyProfile(state, { ...dataProfile, u: user }, guild);
	if (env.isShown(profile)) env.publish();
	return { game, dataProfile: { ...dataProfile, u: user }, user, builds, chests, server, state };
}

/** Действие режима, если оно есть и для него выполнено условие. true — действие выполнено. */
async function perform(env: ResourceEnv, synced: Synced, mode: Mode, action: string, profile: BotProfile, needReload: boolean): Promise<boolean> {
	const handler = RESOURCE_ACTIONS[`${mode}:${action}`];
	if (!handler) return false;
	const { state } = synced;
	const context: ResourceContext = {
		game: synced.game,
		dataProfile: synced.dataProfile,
		user: synced.user,
		builds: synced.builds,
		chests: synced.chests,
		times: state.times,
		hints: state.hints,
		state,
		profile,
		server: synced.server,
		needReload,
		logText: env.logText,
		logMessage: env.logMessage,
	};
	if (handler.when && !handler.when(context)) return false;
	await handler.run(context);
	return true;
}

/**
 * Один сбор: проверить профиль, выполнить действие режима и обновить данные. `needReload` — действие запущено отдельно:
 * после него данные профиля загружаются заново, а пустые итоги попадают в лог. «Запустить» идёт по шагам (после них данные
 * обновляются один раз), «Запустить со всех» — по остальным профилям; данные чужих профилей на странице не показываются.
 * Возвращает false, если профиль подготовить не удалось.
 */
export async function runResources(env: ResourceEnv, mode: Mode, action: string, profile: BotProfile, needReload = true): Promise<boolean> {
	const state = env.isShown(profile) ? env.state : scratchState(env.state);
	const synced = await sync(env, profile, state);
	if (!synced || !env.alive()) return false;
	if (await perform(env, synced, mode, action, profile, needReload)) {
		// Действие меняет таймеры и подсказки карточек (например, «Нет доступных сундуков»)
		if (env.isShown(profile)) env.publish();
		if (needReload && env.alive()) await sync(env, profile, state);
	}
	if (mode === 'all') {
		for (const [stepMode, stepAction] of ALL_STEPS) {
			if (!env.alive()) return true;
			await runResources(env, stepMode, stepAction, profile, false);
		}
		// Итоги шагов уже в игре: страница показывает их, а не данные до сбора
		if (env.alive() && env.isShown(profile)) await sync(env, profile, state);
	}
	if (mode === 'all-in-all') {
		for (const other of env.state.profiles) {
			if (!env.alive()) return true;
			if (await runResources(env, 'all', '', other)) env.logText(`все ресурсы собраны на аккаунте ${other.login}`);
		}
	}
	return true;
}
