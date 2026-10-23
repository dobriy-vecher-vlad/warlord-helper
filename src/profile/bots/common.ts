import { getGame, type GameAuth } from '../../api/game';
import type { Attrs, OneOrMany, ProfileResponse } from '../../api/gameTypes';
import { notify } from '../../app/notify';
import { openPanel } from '../../store/nav';
import { currentProfile, getSession, openSettings } from '../session';

/** Авторизация бота: сервер и данные входа выбранного профиля. */
export interface BotAuth {
	server: number;
	auth: GameAuth;
}

/**
 * Данные входа выбранного профиля. Без пароля открываются настройки профиля и бот возвращается
 * на страницу профиля (как BotAPI getAuth в старом приложении).
 */
export function botAuth(): BotAuth | null {
	const profile = currentProfile();
	if (!profile?.auth) {
		openSettings({ text: 'Для продолжения работы необходимо указать пароль авторизации' });
		openPanel(null);
		return null;
	}
	return { server: profile.server ?? 1, auth: { login: profile.login || profile.id || getSession().user?.id, password: profile.auth } };
}

/** Ошибка ответа сервера для окна настроек: текст, сообщение сервера или весь ответ. */
export const errorText = (data: unknown): string =>
	typeof data === 'string' ? data : (data as { err_msg?: string } | null)?.err_msg ? String((data as { err_msg: string }).err_msg) : JSON.stringify(data);

/**
 * Профиль персонажа для бота. Если пароль не подошёл — сообщение, настройки с ошибкой и возврат на страницу профиля.
 * Успешный ответ дополняет авторизацию игровым id (нужен в запросах с телом).
 */
export async function loadBotProfile<T extends { u?: Attrs } = ProfileResponse>(bot: BotAuth, valid: (data: T | null) => boolean = (data) => !!data?.u): Promise<T | null> {
	const data: T | null = await getGame(bot.server, {}, bot.auth);
	if (!valid(data)) {
		notify({ text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error' });
		openSettings({ text: 'Пароль авторизации игры неисправен, введите новый', error: errorText(data) });
		openPanel(null);
		return null;
	}
	bot.auth = { ...bot.auth, id: data?.u?._id || bot.auth.login };
	return data;
}

/** Значение XML-узла как массив (один дочерний узел приходит объектом). */
export const asArray = <T>(value: OneOrMany<T> | undefined | null): T[] => (value == null ? [] : Array.isArray(value) ? value : [value]);

/** Время записи в логе: «12:34:56». */
export const logTime = () => new Date().toLocaleString('ru', { hour: 'numeric', minute: 'numeric', second: 'numeric' });
