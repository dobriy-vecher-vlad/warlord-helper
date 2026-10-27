import { storageGet, storageSet } from '../../lib/storage';
import { createStore, useStore } from '../../store/createStore';
import type { BotAuth } from '../bots/common';

/** Сколько последних боссов помнится. */
export const RECENT_LIMIT = 5;

/** Избранные боссы и последние пять (по возрастанию давности: первый — самый свежий) одного профиля. */
export interface BossLists {
	favorites: readonly number[];
	recent: readonly number[];
}

const EMPTY: BossLists = { favorites: [], recent: [] };

/** Списки лежат по профилям: при переключении туда и обратно у каждого остаются свои. */
const store = createStore<{ byOwner: Readonly<Record<string, BossLists>> }>({ byOwner: {} });

const setLists = (owner: string, lists: BossLists) => store.set((state) => ({ byOwner: { ...state.byOwner, [owner]: lists } }));

const ownerOf = (bot: BotAuth) => `${bot.server}:${bot.auth.login}`;

/** Ключ VK Storage: свои списки у каждого профиля (допустимы только латиница, цифры, `_` и `-`). */
export const bossListsKey = (bot: BotAuth) => `bosslists_${bot.server}_${String(bot.auth.login).replace(/[^\w-]/g, '_')}`.slice(0, 100);

const ids = (value: unknown): number[] => (Array.isArray(value) ? [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))] : []);

/** Списки из сохранённой строки; всё непригодное отбрасывается. */
export function parseBossLists(raw: string | null): BossLists {
	if (!raw) return { favorites: [], recent: [] };
	try {
		const data = JSON.parse(raw) as { f?: unknown; r?: unknown };
		return { favorites: ids(data.f), recent: ids(data.r).slice(0, RECENT_LIMIT) };
	} catch {
		return { favorites: [], recent: [] };
	}
}

const save = (bot: BotAuth, lists: BossLists) =>
	storageSet(bossListsKey(bot), lists.favorites.length || lists.recent.length ? JSON.stringify({ f: lists.favorites, r: lists.recent }) : '');

/** Загрузки по профилям: списки читаются один раз, повторные вызовы и изменения до ответа ждут её. */
const loading = new Map<string, Promise<void>>();

/** Прочитать списки профиля из хранилища (один раз за сеанс). */
export function loadBossLists(bot: BotAuth): Promise<void> {
	const owner = ownerOf(bot);
	let promise = loading.get(owner);
	if (!promise) {
		promise = storageGet(bossListsKey(bot)).then((raw) => {
			setLists(owner, parseBossLists(raw));
		});
		loading.set(owner, promise);
	}
	return promise;
}

/** Записи идут одна за другой: быстрые нажатия не должны записаться в обратном порядке и оставить старое значение. */
let saving: Promise<unknown> = Promise.resolve();

async function change(bot: BotAuth, update: (lists: BossLists) => BossLists) {
	await loadBossLists(bot);
	const owner = ownerOf(bot);
	const lists = update(store.get().byOwner[owner] ?? EMPTY);
	setLists(owner, lists);
	saving = saving.then(() => save(bot, lists)).catch(() => undefined);
	await saving;
}

/** Поставить или снять звезду. */
export const toggleFavorite = (bot: BotAuth, id: number) =>
	change(bot, ({ favorites, recent }) => ({ favorites: favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id], recent }));

/** Новый порядок избранных: `order` — показанные боссы по порядку, остальные (их сейчас не видно) остаются в конце. */
export const reorderFavorites = (bot: BotAuth, order: readonly number[]) =>
	change(bot, ({ favorites, recent }) => ({ favorites: [...order.filter((id) => favorites.includes(id)), ...favorites.filter((id) => !order.includes(id))], recent }));

/** Очистить список недавних. */
export const clearRecent = (bot: BotAuth) => change(bot, ({ favorites }) => ({ favorites, recent: [] }));

/** Запомнить босса как последнего: бой с ним создан или принят (источник не важен). */
export const rememberRecent = (bot: BotAuth, id: number) =>
	change(bot, ({ favorites, recent }) => ({ favorites, recent: [id, ...recent.filter((item) => item !== id)].slice(0, RECENT_LIMIT) }));

/** Списки профиля `bot`; пока они не загружены, пусто. */
export function useBossLists(bot: BotAuth | undefined): BossLists {
	const lists = useStore(store, (state) => (bot ? state.byOwner[ownerOf(bot)] : undefined));
	return lists ?? EMPTY;
}
