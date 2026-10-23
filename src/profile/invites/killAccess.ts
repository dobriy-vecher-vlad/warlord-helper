import { parseQuery } from '../../lib/hash';
import { isEmbedded } from '../../lib/platform';
import { setSession, useSession } from '../session';
import { callApi } from '../vk';

/** VK id того, кто запустил приложение (параметр запуска `vk_user_id`): он не меняется при выборе другого профиля. */
export const launcherId = () => Number(parseQuery().vk_user_id);

/** Кнопка Kill (убить босса целиком) доступна тем, кто есть в белом списке: проверяется запустивший приложение, а не выбранный профиль. */
export const useKillAllowed = () => useSession((state) => state.bossesWhitelist.includes(launcherId()));

let loaded = false;
let loading: Promise<void> | null = null;

/**
 * Белый список для Kill (`execute.getProfileBossesWhitelist`): запрашивается один раз, когда открывается страница боссов,
 * а не при запуске приложения (нужен только тем, кто дерётся с боссами). Сбой молча оставляет Kill скрытой, при следующем
 * открытии страницы запрос повторяется.
 */
export function loadBossesWhitelist(): Promise<void> {
	if (loaded || !isEmbedded()) return Promise.resolve();
	loading ??= callApi<{ items: number[] }>('execute.getProfileBossesWhitelist')
		.then((result) => {
			const items = result?.response?.items;
			if (!Array.isArray(items)) return;
			loaded = true;
			setSession({ bossesWhitelist: items.map(Number).filter(Number.isFinite) });
		})
		.catch(() => undefined)
		.finally(() => {
			loading = null;
		});
	return loading;
}
