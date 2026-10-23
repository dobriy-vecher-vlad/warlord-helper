import { getGame } from '../api/game';
import { findServer } from '../api/servers';
import { notify } from '../app/notify';
import { parseHash, parseQuery } from '../lib/hash';
import { isEmbedded } from '../lib/platform';
import { storageGetWithDefault, storageSet } from '../lib/storage';
import { getModalStack, openModal } from '../store/modal';
import { DEFAULT_AUTHORIZATION, VK_APP_ID, VK_GROUP_ID, emptyGameUser, type GameUser } from './constants';
import { checkServer, draftFromProfile, getSession, setSession, type OwnedItem, type ProfileSlot, type ProfileView } from './session';
import { callApi, getBridge, getUsers, normalizeUser, type VKUser } from './vk';

interface GameData {
	game: GameUser;
	items: number[];
	itemsFull: OwnedItem[];
	found: boolean;
}

/** Персонаж и его предметы: uid через хаб, предметы — служебным профилем сервера. */
async function loadGame(profile: ProfileSlot, user: VKUser): Promise<GameData> {
	const server = profile.server ?? 1;
	const hub = await getGame(server, {}, { login: profile.login || user.id, password: profile.auth || user.id }, 2);
	if (!hub?._uid || Number(hub._uid) === 0) return { game: emptyGameUser(), items: [], itemsFull: [], found: false };
	const data = await getGame(server, { i: 39, t: hub._uid }, DEFAULT_AUTHORIZATION[server - 1]);
	if (!data?.u) return { game: emptyGameUser(), items: [], itemsFull: [], found: true };
	const list = (Array.isArray(data.i) ? data.i : data.i ? [data.i] : []).filter((item: Record<string, string>) => Number(item._o) === 1);
	return {
		game: data.u,
		items: list.map((item: Record<string, string>) => Number(item._id)),
		itemsFull: list.map((item: Record<string, string>) => ({
			id: Number(item._id),
			lvl: Number(item._u),
			stones: [
				[Number(item._st11), Number(item._st12)],
				[Number(item._st21), Number(item._st22)],
				[Number(item._st31), Number(item._st32)],
			],
			bonus: [Number(item._st_dmg), Number(item._st_en), Number(item._st_end)],
		})),
		found: true,
	};
}

/** Пользователь ВК: выбранного профиля (если он задан) или текущий. */
async function loadVKUser(maskId: number | null): Promise<VKUser> {
	let user: VKUser | null = null;
	if (maskId) user = (await getUsers([maskId]))[0] ?? null;
	if (!user) user = await getBridge<VKUser>('VKWebAppGetUserInfo');
	return normalizeUser(user ?? { id: 0, first_name: 'Player', last_name: 0 });
}

/** Имена и фото всех профилей. */
async function withNames(profiles: ProfileSlot[], index: number, user: VKUser): Promise<ProfileView[]> {
	const full: ProfileView[] = [...profiles];
	for (const data of await getUsers(profiles.map((profile) => profile.id))) {
		const position = profiles.findIndex((profile) => profile.id == data.id);
		if (position !== -1) {
			full[position] = {
				...profiles[position]!,
				first_name: data.first_name === 'DELETED' ? 'Player' : data.first_name,
				last_name: data.first_name === 'DELETED' ? data.id : data.last_name,
				photo_100: data.photo_100,
				photo_200: data.photo_200,
				photo_max_orig: data.photo_max_orig,
			};
		}
	}
	full[index] = {
		...profiles[index]!,
		first_name: user.first_name,
		last_name: user.last_name,
		photo_100: user.photo_100,
		photo_200: user.photo_200,
		photo_max_orig: user.photo_max_orig,
	};
	return full;
}

const padProfiles = (profiles: ProfileSlot[], size: number) => [...profiles, ...Array.from({ length: Math.max(0, size - profiles.length) }, () => ({ id: null }))];

/** Данные ВК для запуска: пользователь и списки подписчиков VK Donut (запросы не зависят друг от друга). */
const loadVKStart = () => Promise.all([loadVKUser(null), callApi<{ items: number[] }>('execute.getMembers'), callApi<{ items: VKUser[] }>('execute.getMembersFull')]);

/** Первая загрузка: подписка VK Donut, число слотов, персонаж основного профиля и имена профилей. */
async function loadInitial([user, donut, fullResponse]: Awaited<ReturnType<typeof loadVKStart>>) {
	const state = getSession();
	const donutUsers = fullResponse?.response ? fullResponse : null;
	let { profiles, size } = state;
	let isDonut = false;
	let game: GameData | null = null;

	if (donut?.response?.items?.includes(user.id) && donutUsers?.response?.items) {
		const fromService = donutUsers.response.items.find((member) => member.id == user.id && 'sex' in member);
		if (!fromService) {
			// Подписка не через сервис: число слотов зависит от суммы подписки
			const access = await getBridge('VKWebAppGetAuthToken', { app_id: VK_APP_ID, scope: 'friends,groups' });
			const subscription = access?.access_token
				? await callApi<{ status: string; amount: number | string }>('donut.getSubscription', { owner_id: -VK_GROUP_ID, access_token: access.access_token }, '5.131')
				: null;
			const paid = subscription?.response;
			if (paid && (paid.status === 'active' || paid.status === 'expiring')) {
				// Число слотов зависит от суммы подписки; нечисловой или отрицательный ответ оставляет текущее число
				const slots = Math.floor((Number(paid.amount) - 50) / size + size);
				if (Number.isFinite(slots) && slots >= 1) size = slots;
				profiles = padProfiles(profiles.slice(0, size), size);
			}
		} else {
			size = Math.max(profiles.length, 5);
			profiles = padProfiles(profiles, 5);
		}
		isDonut = true;
	}
	// Персонаж (только с подпиской) и имена профилей не зависят друг от друга
	const [loadedGame, named] = await Promise.all([isDonut ? loadGame(profiles[state.index]!, user) : null, withNames(profiles, state.index, user)]);
	game = loadedGame;

	setSession({
		user,
		isDonut,
		donutUsers,
		profiles,
		size,
		game: game?.game ?? null,
		items: game?.items ?? [],
		itemsFull: game?.itemsFull ?? [],
	});
	setSession({ profilesFull: named });
}

/** Перезагрузка выбранного профиля (после выбора или сохранения настроек). */
export async function reloadProfile(maskId: number | null, isStale: () => boolean) {
	const state = getSession();
	const profile = state.profiles[state.index];
	if (!profile) return;
	const user = await loadVKUser(maskId);
	const game = await loadGame(profile, user);
	// Пока шла загрузка, выбрали другой профиль: результат этого уже не нужен
	if (isStale()) return;
	if (game.found) {
		await storageSet('storeProfiles', JSON.stringify(state.profiles));
	} else {
		notify({ text: `Авторизуйте профиль на сервере ${findServer(profile.server ?? 1)?.name} и обновите приложение`, icon: 'error' });
	}
	setSession({ user, game: game.game, items: game.items, itemsFull: game.itemsFull });
	const named = await withNames(getSession().profiles, state.index, user);
	if (!isStale()) setSession({ profilesFull: named });
}

/** Профили из VK Storage; по умолчанию — один основной профиль текущего пользователя и четыре пустых слота. */
async function loadProfiles(): Promise<ProfileSlot[] | null> {
	const vkId = Number(parseQuery().vk_user_id);
	const defaults: ProfileSlot[] = [{ server: 1, id: vkId, login: vkId, auth: null, main: true }, { id: null }, { id: null }, { id: null }, { id: null }];
	const { value } = await storageGetWithDefault('storeProfiles', JSON.stringify(defaults));
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

/**
 * Запуск: внутри ВК проверяется игровой сервер, затем загружаются профили и персонаж.
 * Вне ВК или без сервера профиль недоступен (как в старом приложении).
 */
export async function startSession() {
	if (!isEmbedded()) return;
	// Повторный запуск после сбоя: снова заставка, пока грузятся профиль и данные
	setSession({ status: 'loading', busy: true });
	/** Профиль не загрузился: приложение работает без него, а сообщение предлагает повторить */
	const fail = (text: string) => {
		setSession({ status: 'off', busy: false });
		notify({ text, icon: 'error', action: 'Повторить', onAction: () => void startSession(), duration: 10000 });
	};
	try {
		// Проверка сервера, профили из хранилища и данные ВК не зависят друг от друга — грузятся одновременно
		const [serverOk, profiles, vk] = await Promise.all([checkServer(), loadProfiles(), loadVKStart()]);
		if (!serverOk) return fail('Игровой сервер недоступен, профиль отключён');
		if (!profiles) return fail('Не удалось прочитать профили из хранилища');
		setSession({ profiles, profilesFull: [...profiles] });
		await loadInitial(vk);
	} catch {
		return fail('Не удалось загрузить профиль');
	}
	setSession((state) => ({ ...state, status: 'ready', busy: false, draft: draftFromProfile(state) }));
	await showPromo();
}

/** Окно из ссылки `#promo=arenaItems` / `#promo=eventsItems` (ссылки из записей «Поделиться»). Читается до того, как адрес очистится. */
const LINK_PROMO = ((promo) => (promo === 'arenaItems' || promo === 'eventsItems' ? promo : null))(parseHash().promo);

/** Окна акций при запуске: каждое показывается один раз (ключи promo_N как в старом приложении). */
async function showPromo() {
	if (LINK_PROMO) return openModal(LINK_PROMO);
	const [promo1, promo2, promo3, promo4] = await Promise.all([
		storageGetWithDefault('promo_1', 'true'),
		storageGetWithDefault('promo_2', 'false'),
		storageGetWithDefault('promo_3', 'false'),
		storageGetWithDefault('promo_4', 'false'),
	]);
	if (getModalStack().length) return;
	if (promo3.value !== 'true') return openModal('sales');
	if (!promo1.existed && !getSession().isDonut) return openModal('donut');
	if (promo2.value !== 'true') return openModal('arenaItems');
	if (promo4.value !== 'true') return openModal('eventsItems');
}
