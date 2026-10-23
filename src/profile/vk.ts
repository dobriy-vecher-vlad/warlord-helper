import bridge from '@vkontakte/vk-bridge';
import { VK_API_VERSION, VK_SERVICE_TOKEN } from './constants';

/** Пользователь ВК (ответ VKWebAppGetUserInfo / users.get). */
export interface VKUser {
	id: number;
	first_name: string;
	last_name: string | number;
	photo_100?: string;
	photo_200?: string;
	photo_max_orig?: string;
	sex?: number;
}

/** Ответ VK Bridge и VK API: полезные данные в `response`, при ошибке — поля ошибки. */
export interface VKResponse<T = unknown> {
	response?: T;
	access_token?: string;
	error_data?: { error_reason?: string };
}

/**
 * Вызов VK Bridge без исключений: при ошибке возвращается объект ошибки (как getBridge в старом приложении),
 * поэтому дальше код проверяет поля ответа, а не ловит исключения. Тип `T` — ожидаемый ответ метода.
 */
export async function getBridge<T = VKResponse>(method: string, params?: Record<string, unknown>): Promise<T> {
	try {
		return (await (bridge.send as (method: string, params?: Record<string, unknown>) => Promise<unknown>)(method, params)) as T;
	} catch (error) {
		return error as T;
	}
}

/** Метод VK API с сервисным ключом сообщества. */
export function callApi<T = unknown>(method: string, params: Record<string, unknown> = {}, version = VK_API_VERSION): Promise<VKResponse<T>> {
	return getBridge<VKResponse<T>>('VKWebAppCallAPIMethod', { method, params: { v: version, access_token: VK_SERVICE_TOKEN, ...params } });
}

/** «DELETED»-аккаунты показываются как «Player <id>» (как в старом приложении). */
export function normalizeUser<T extends VKUser>(user: T): T {
	const deleted = user.first_name === 'DELETED';
	return { ...user, first_name: deleted ? 'Player' : user.first_name, last_name: deleted ? user.id : user.last_name };
}

/** Данные пользователей по id (users.get). */
export async function getUsers(ids: (number | null | undefined)[]): Promise<VKUser[]> {
	const data = await callApi<VKUser[]>('users.get', { user_ids: ids.join(','), fields: 'photo_100,photo_200,photo_max_orig' });
	return Array.isArray(data?.response) ? data.response : [];
}
