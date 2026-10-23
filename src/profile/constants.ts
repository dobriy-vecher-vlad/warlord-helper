import type { GameAuth } from '../api/game';

/** Приложение ВК и сообщество проекта. */
export const VK_APP_ID = 7787242;
export const VK_GROUP_ID = 138604865;
/** Версия VK API для вызовов через VKWebAppCallAPIMethod (как в старом приложении). */
export const VK_API_VERSION = '5.130';

/**
 * Сервисный ключ сообщества: списки донов (execute.getMembers / execute.getMembersFull) и users.get.
 * Лежит открыто намеренно, как в старом приложении.
 */
export const VK_SERVICE_TOKEN = '9942dca8c434ee910f1745a2989105b6b66d712e4f6d96b474278ca18ea7e6d7a8db5f4e569b16c6d1d20';

/** Аккаунт владельца: видит список донов. */
export const ADMIN_VK_ID = 153968505;

/** Заглушка аватара ВК. */
export const CAMERA_PHOTO = 'https://vk.com/images/camera_200.png';

/**
 * Служебные игровые профили по серверам (индекс = id сервера − 1): через них читаются чужие данные
 * (предметы игрока, друзья и т. п.). Профили пустые и открыты намеренно, как в старом приложении.
 */
export const DEFAULT_AUTHORIZATION: readonly GameAuth[] = [
	{ id: '628113656', login: '292859277', password: 'de73003f6d508e583e9c7f316024abbf' },
	{ id: '628128530', login: '292859277', password: 'de73003f6d508e583e9c7f316024abbf' },
	{ id: '12591', login: 'GI35gYrUj8YOaE8+V3RYiOm7yn+QWroYrvN1cSt8lZ0=', password: 'GI35gYrUj8YOaE8+V3RYiOm7yn+QWroYrvN1cSt8lZ0=' },
	{
		login: '584840646046,597549694268',
		password: '60a2b68552999dcb1126611e6e008d48,-s-7Un0j3I8qVnwDYKbr1o2C-PWrwtvcXMUP.rydZR3qxL0eaLcK1oUE6t-KUpwdYQTMwswgVPcOWp2CdJaNxnveYM2',
	},
	{
		login: '584840646046,628131408',
		password: '60a2b68552999dcb1126611e6e008d48,-s-7Un0j3I8qVnwDYKbr1o2C-PWrwtvcXMUP.rydZR3qxL0eaLcK1oUE6t-KUpwdYQTMwswgVPcOWp2CdJaNxnveYM2',
	},
	{ id: '12595', login: '210697718', password: '1302195fadf424defdc77c06948d00e9' },
];

/** Пустой персонаж: все поля «0», как заглушка в старом приложении, когда данных нет. */
const GAME_FIELDS = [
	'a1',
	'a2',
	'a3',
	'a4',
	'a5',
	'a_c',
	'aid',
	'al',
	'ap',
	'bd',
	'car1_lvl',
	'clan_d',
	'clan_id',
	'clan_r',
	'd1',
	'd2',
	'd3',
	'd4',
	'd5',
	'd6',
	'd7',
	'd8',
	'd9',
	'd10',
	'd11',
	'dmgi',
	'end',
	'endi',
	'exId',
	'exp',
	'fbId',
	'gmId',
	'hp',
	'id',
	'kgId',
	'l_t',
	'loc',
	'loot',
	'luck',
	'lucki',
	'lvl',
	'mhp',
	'mmId',
	'mobId',
	'name',
	'okId',
	'pet',
	'rbId',
	'room',
	's1',
	's2',
	's3',
	's4',
	'type',
	'va',
	'vet',
	'vi',
	'vkId',
];

export type GameUser = Record<string, string>;

export const emptyGameUser = (): GameUser => Object.fromEntries(GAME_FIELDS.map((field) => [`_${field}`, '0']));
