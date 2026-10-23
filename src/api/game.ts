/**
 * Запросы к игровому серверу. Описание протокола, всех используемых методов (`i: N`) и форматов ответов — в `docs/game-api.md`:
 * при добавлении метода его нужно описать там.
 */
import { getData, PRIORITY } from './http';
import { findServer, type ServerApi } from './servers';

/** Данные авторизации игрока. Для OK логин и пароль — пары через запятую («api_uid,uid» и «auth_sig,session_key»). */
export interface GameAuth {
	id?: string | number;
	login?: string | number;
	password?: string | number;
}

/** Тип запроса: 1 — обычный, 2 — запрос на хаб, 3 — характеристики (без пути и авторизации). */
export type GameRequestType = 1 | 2 | 3;

type Params = Record<string, string | number>;

interface ServerConfig {
	host: string;
	/** Параметры, общие для всех типов запросов */
	base: Params;
	/** Путь обычного запроса */
	game: string;
	/** Путь запроса на хаб */
	hub: string;
	/** Параметры обычного запроса (кроме UID) */
	gameParams(auth: NormalizedAuth): Params;
	/** Параметры запроса на хаб */
	hubParams(auth: NormalizedAuth): Params;
	/** UID, если в запросе есть тело */
	uid(auth: NormalizedAuth): string;
}

interface NormalizedAuth {
	id?: string;
	login: string;
	password: string;
}

const HOST_MAIN = 'tmp1-fb.geronimo.su/';
const HOST_YA = 'gs1.geronimo.su/';

const vk = (game: string): ServerConfig => ({
	host: HOST_MAIN,
	base: { api_type: 'vk', api_id: 5536422 },
	game,
	hub: 'gameHub/index.php',
	gameParams: (a) => ({ sslt: 0, api_uid: a.login, auth_key: a.password }),
	hubParams: (a) => ({ api_uid: a.login }),
	uid: (a) => a.id || a.login,
});

const ok = (game: string): ServerConfig => ({
	host: HOST_MAIN,
	base: { api_type: 'ok' },
	game,
	hub: 'gameHubOk/index.php',
	gameParams: (a) => ({
		sslt: 0,
		session_key: a.password.split(',')[1] ?? '',
		api_uid: a.login.split(',')[0] ?? '',
		auth_sig: a.password.split(',')[0] ?? '',
		UID: a.login.split(',')[1] ?? '',
	}),
	hubParams: (a) => ({ api_uid: a.login.split(',')[0] ?? '' }),
	uid: (a) => a.login.split(',')[1] ?? '',
});

/** Параметры серверов. Порядок параметров в запросе совпадает со старым getGame. */
const CONFIG: Record<ServerApi, ServerConfig> = {
	vk1: vk('warlord_vk/game.php'),
	vk2: vk('warlord_vk2/game.php'),
	ya: {
		host: HOST_YA,
		base: { api_type: 'ya', api_id: 100430 },
		game: 'warlord_ya1/game.php',
		hub: 'gameHub/index.php',
		gameParams: (a) => ({ sslt: 0, api_uid: a.login, lapi_uid: a.password }),
		hubParams: (a) => ({ api_uid: a.login }),
		uid: (a) => a.id || a.login,
	},
	ok1: ok('OK_WARLORD/game.php'),
	ok2: ok('OK_WARLORD2/game.php'),
	gm: {
		host: HOST_YA,
		base: { api_type: 'gm', api_id: 5782 },
		game: 'warlord_ya1/game.php',
		hub: 'gameHub/index.php',
		gameParams: (a) => ({ sslt: 0, api_uid: a.login, auth_key: a.password, currency: 'RUB', lang: 'ru_RU' }),
		hubParams: (a) => ({ api_uid: a.login }),
		uid: (a) => a.id || a.login,
	},
};

/** Собрать URL запроса к игре. Бросает Error при неверных аргументах. */
export function buildGameUrl(server: number | string, body: Params = {}, auth: GameAuth = {}, type: GameRequestType = 1): string {
	const info = findServer(server);
	if (!info) throw new Error('Укажите сервер запроса');
	const config = CONFIG[info.api];

	const normalized: NormalizedAuth = {
		id: auth.id !== undefined && auth.id !== '' ? String(auth.id) : undefined,
		login: auth.login !== undefined ? String(auth.login) : '',
		password: auth.password !== undefined ? String(auth.password) : '',
	};
	if (type === 1) {
		if (!body) throw new Error('Укажите тело запроса');
		if (!normalized.login) throw new Error('Укажите логин запроса');
		if (!normalized.password) throw new Error('Укажите пароль запроса');
	}

	let host = config.host;
	let request: Params = { ...config.base };
	if (type === 1) {
		host += config.game;
		request = { ...request, ...config.gameParams(normalized) };
		if (Object.keys(body).length) request.UID = config.uid(normalized);
	}
	if (type === 2) {
		host += config.hub;
		request = { ...request, ...config.hubParams(normalized) };
	}
	request = { ...request, ...body };
	return `https://${host}?${new URLSearchParams(request as Record<string, string>).toString()}`;
}

/**
 * Запрос к игровому серверу.
 * Для type = 2 (хаб) по умолчанию возвращает данные выбранного сервера, а при completeData — список всех.
 * `priority` (`PRIORITY` из http.ts) — место в очереди запросов: действия игрока идут раньше окон, окна раньше фоновых опросов.
 * Ошибка сети или разбора -> null.
 */
export async function getGame(
	server: number | string,
	body: Params = {},
	auth: GameAuth = {},
	type: GameRequestType = 1,
	completeData = false,
	priority: number = PRIORITY.background,
): Promise<any> {
	const url = buildGameUrl(server, body, auth, type);
	let data: any = await getData(url, priority);
	if (type === 2) {
		if (data?.s && !Array.isArray(data.s)) data.s = [data.s];
		const list = data?.s;
		data = completeData ? list : list?.find((s: { _n: string }) => s._n === findServer(server)?.name);
	}
	return data;
}
