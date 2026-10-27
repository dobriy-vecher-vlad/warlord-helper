import { isEmbedded } from '../../lib/platform';
import { setSession, useSession } from '../session';
import { callApi, getBridge, type VKUser } from '../vk';

/**
 * Кнопка Kill (убить босса целиком) доступна тем, кто есть в белом списке. Проверяется тот, кто открыл приложение, а не выбранный
 * профиль: его id приходит от VK Bridge (`VKWebAppGetUserInfo`), а не из адреса страницы, который можно подменить.
 */
export const useKillAllowed = () => useSession((state) => state.launcherId > 0 && state.bossesWhitelist.includes(state.launcherId));

let loaded = false;
let loading: Promise<void> | null = null;

/**
 * Белый список для Kill (`execute.getProfileBossesWhitelist`): запрашивается один раз, когда открывается страница боссов,
 * а не при запуске приложения (нужен только тем, кто дерётся с боссами). Сбой молча оставляет Kill скрытой, при следующем
 * открытии страницы запрос повторяется.
 */
export function loadBossesWhitelist(): Promise<void> {
	if (loaded || !isEmbedded()) return Promise.resolve();
	loading ??= Promise.all([callApi<{ items: number[] }>('execute.getProfileBossesWhitelist'), getBridge<VKUser>('VKWebAppGetUserInfo')])
		.then(([result, user]) => {
			const items = result?.response?.items;
			if (!Array.isArray(items)) return;
			loaded = true;
			setSession({ bossesWhitelist: items.map(Number).filter(Number.isFinite), launcherId: Number(user?.id) || 0 });
		})
		.catch(() => undefined)
		.finally(() => {
			loading = null;
		});
	return loading;
}
