import { PATH_IMAGES } from '../config';

/** Игровые серверы. Порядок и id совпадают со старым serverHub (id = индекс + 1). */
export interface ServerInfo {
	id: number;
	/** Название сервера в ответе хаба */
	name: string;
	/** Короткий код сервера, используется в запросах и ссылках */
	api: ServerApi;
	site: string;
	company: string;
	logo: string;
}

export type ServerApi = 'vk1' | 'vk2' | 'ya' | 'ok1' | 'ok2' | 'gm';

const logo = (file: string) => `${PATH_IMAGES}main/${file}`;

export const SERVERS: readonly ServerInfo[] = [
	{ id: 1, name: 'Эрмун', api: 'vk1', site: 'vk.com', company: 'ВКонтакте', logo: logo('logo_vk.svg') },
	{ id: 2, name: 'Антарес', api: 'vk2', site: 'vk.com', company: 'ВКонтакте', logo: logo('logo_vk.svg') },
	{ id: 3, name: 'Эрмун', api: 'ya', site: 'yandex.ru', company: 'Яндекс', logo: logo('logo_yandex.svg') },
	{ id: 4, name: 'Эрмун', api: 'ok1', site: 'ok.ru', company: 'Одноклассники', logo: logo('logo_ok.svg') },
	{ id: 5, name: 'Антарес', api: 'ok2', site: 'ok.ru', company: 'Одноклассники', logo: logo('logo_ok.svg') },
	{ id: 6, name: 'Эрмун', api: 'gm', site: 'vkplay.ru', company: 'VK Play', logo: logo('logo_vk.svg') },
];

/** Найти сервер по id (1..6, число или строка) или по коду ('vk1'...). */
export function findServer(server: number | string): ServerInfo | undefined {
	return SERVERS.find((s) => s.api === server || s.id == server);
}
