import { getGame } from '../api/game';
import { PRIORITY } from '../api/http';
import type { Attrs, ProfileResponse } from '../api/gameTypes';
import ShopData from '../data/shop.json';
import { ITEMS, ITEM_INDEX, type Item, type ItemPrice } from '../lib/items';
import type { Forms } from '../lib/format';
import { asArray, type BotAuth } from './bots/common';

/** Валюты предметов магазина в порядке вкладки «Ресурсы»: номер — `Item.currency` (картинка `currency/all/mN.png`, поле профиля `_mN`). */
export const CURRENCIES: readonly { id: number; name: string; forms: Forms }[] = [
	{ id: 3, name: 'Золото', forms: ['золото', 'золота', 'золота'] },
	{ id: 1, name: 'Серебро', forms: ['серебро', 'серебра', 'серебра'] },
	{ id: 2, name: 'Рубины', forms: ['рубин', 'рубина', 'рубинов'] },
	{ id: 4, name: 'Аметисты', forms: ['аметист', 'аметиста', 'аметистов'] },
	{ id: 5, name: 'Топазы', forms: ['топаз', 'топаза', 'топазов'] },
	{ id: 6, name: 'Турмалины', forms: ['турмалин', 'турмалина', 'турмалинов'] },
];

export const currencyName = (id: number) => CURRENCIES.find((currency) => currency.id === id)?.name ?? '';

/**
 * Откуда берётся предмет и когда его можно купить (правило клиента игры, `get_lock_info`):
 * - `free`: условий нет, кроме уровня, покупается сразу;
 * - `drop`: предмет с босса, сундука, рейда, похода или питомца. Купить его можно только после того, как он выпал
 *   (в профиле появляется запись предмета с `_o="0"`); пока не выпал, он закрыт.
 * Личные предметы (арена, ивенты), кузница гильдии, лотерея, наборы, торговец Мустафа и коллекции выдаются или продаются не здесь (предмет коллекции при обмене сразу попадает на аккаунт): в магазин не попадают.
 */
export type ShopKind = 'free' | 'drop';

/** Условия получения предмета в каталоге магазина игры: поле `_lN` и его смысл. */
const GRANTED: readonly `_${string}`[] = ['_l5' /* лотерея */, '_l9' /* набор */, '_l10' /* коллекция */, '_l11' /* кузница гильдии */, '_l13' /* торговец Мустафа */];
const DROP: readonly `_${string}`[] = [
	'_l1' /* босс */,
	'_l6' /* рейд */,
	'_l8' /* сундук */,
	'_l12' /* гильдейская война */,
	'_l14' /* поход */,
	'_l15' /* походный сундук */,
	'_l16' /* питомец */,
];

export interface ShopItem {
	/** Индекс предмета в каталоге (его ждёт `ItemCard`) */
	index: number;
	item: Item;
	/** С какого уровня персонажа предмет можно купить (у выпавших не проверяется) */
	level: number;
	/** Цены по валютам: покупка списывает все сразу (клиент: `m1…m6` минус `price1…price6`). У почти всех предметов она одна */
	prices: ItemPrice[];
	kind: ShopKind;
}

/**
 * Предметы магазина по снимку каталога игры (`data/shop.json`, строки `[id, уровень, цена, валюта, 1 — после выпадения]`, как их отдаёт узел `shop`
 * профиля игры через `shopFromCatalog`): нужны там, где профиля игры нет: счётчик на главной профиля.
 * Как и каталог предметов, снимок обновляется вручную, когда в игре появляются новые предметы.
 */
export const SHOP_ALL: readonly ShopItem[] = ShopData.flatMap(([id, level, price, currency, drop]) => {
	const index = ITEM_INDEX.get(id!);
	return index === undefined ? [] : [{ index, item: ITEMS[index]!, level: level!, prices: [[currency!, price!]], kind: drop ? ('drop' as const) : ('free' as const) }];
});

/**
 * Предметы магазина по каталогу самой игры (узел `shop` профиля): всё, что покупается за валюту, без личных и выдаваемых другим путём.
 * null — каталога в профиле нет.
 */
export function shopFromCatalog(profile: ProfileResponse | null): ShopItem[] | null {
	const rows = asArray(profile?.shop?.i);
	if (!rows.length) return null;
	const list: ShopItem[] = [];
	const seen = new Set<number>();
	for (const row of rows) {
		const id = Number(row._id);
		const index = ITEM_INDEX.get(id);
		if (index === undefined || seen.has(id) || Number(row._is_p) > 0 || GRANTED.some((field) => Number(row[field]) > 0)) continue;
		const prices = ([1, 2, 3, 4, 5, 6] as const).flatMap((value): ItemPrice[] => (Number(row[`_p${value}`]) > 0 ? [[value, Number(row[`_p${value}`])]] : []));
		if (!prices.length) continue;
		seen.add(id);
		list.push({
			index,
			item: ITEMS[index]!,
			level: Number(row._l4) || 0,
			prices,
			kind: DROP.some((field) => Number(row[field]) > 0) ? 'drop' : 'free',
		});
	}
	return list;
}

/** Состояние покупки: можно купить, не хватает валюты, не хватает уровня, ещё не выпал, уже куплен. */
export type ShopStatus = 'buy' | 'short' | 'lock' | 'drop' | 'owned';

/** Боевые характеристики персонажа сейчас: урон (`_dmgi`) и здоровье ((`_end` + `_endi`) × 15, как в игре). */
export interface Character {
	dmg: number;
	hp: number;
}

export function characterOf(user: Attrs | null | undefined): Character | null {
	if (!user || user._dmgi === undefined) return null;
	return { dmg: Number(user._dmgi) || 0, hp: ((Number(user._end) || 0) + (Number(user._endi) || 0)) * 15 };
}

/** Что нужно знать о персонаже: уровень, купленные и выпавшие предметы, баланс валют (null — без пароля авторизации он неизвестен) и характеристики. */
export interface Wallet {
	level: number;
	owned: ReadonlySet<number>;
	/** Выпали, но ещё не куплены */
	dropped: ReadonlySet<number>;
	balance: Readonly<Record<number, number>> | null;
	character?: Character | null;
}

/** Что предмет даёт персонажу: урон и здоровье (в игре здоровье показывается ×15). Что надето в слоте, не учитывается: показывается сам предмет. */
export const statGain = ({ item }: ShopItem) => ({ dmg: item.dmg, hp: item.hp * 15 });

export function shopStatus(entry: ShopItem, wallet: Wallet): ShopStatus {
	const { id } = entry.item;
	if (wallet.owned.has(id)) return 'owned';
	const dropped = wallet.dropped.has(id);
	// Выпавший предмет продаётся без условий, обычный проверяется по уровню, а предмет с источником без выпадения закрыт
	if (!dropped && entry.kind === 'drop') return 'drop';
	if (!dropped && entry.level > wallet.level) return 'lock';
	if (wallet.balance && entry.prices.some(([currency, price]) => (wallet.balance![currency] ?? 0) < price)) return 'short';
	return 'buy';
}

/** Порядок в списке: сначала то, что можно купить, потом то, на что не хватает, закрытое по уровню, не выпавшее, купленное; внутри — по уровню и цене. */
const RANK: Record<ShopStatus, number> = { buy: 0, short: 1, lock: 2, drop: 3, owned: 4 };

export function sortShop(list: readonly ShopItem[], wallet: Wallet): ShopItem[] {
	return list
		.map((entry) => ({ entry, rank: RANK[shopStatus(entry, wallet)] }))
		.sort((a, b) => a.rank - b.rank || a.entry.level - b.entry.level || a.entry.prices[0]![1] - b.entry.prices[0]![1])
		.map(({ entry }) => entry);
}

/** Предметы профиля игры по признаку `_o`: 1 — куплены, 0 — выпали, но не куплены. */
function idsWhere(profile: ProfileResponse | null, flag: 0 | 1): Set<number> {
	return new Set(
		asArray(profile?.i)
			.filter((entry) => entry._o !== undefined && Number(entry._o) === flag)
			.map((entry) => Number(entry._id)),
	);
}

export const ownedIds = (profile: ProfileResponse | null) => idsWhere(profile, 1);
export const droppedIds = (profile: ProfileResponse | null) => idsWhere(profile, 0);

/** Баланс валют магазина из профиля игры. */
export function balanceOf(profile: ProfileResponse | null): Record<number, number> {
	return Object.fromEntries(CURRENCIES.map(({ id }) => [id, Number(profile?.u?.[`_m${id}`]) || 0]));
}

/** Сообщение сервера об отказе в покупке (`<data><msg>Недостаточно средств!</msg></data>`); null — отказа в ответе нет. */
export function buyMessage(response: unknown): string | null {
	if (typeof response === 'string') return response.trim() || null;
	const message = (response as { msg?: unknown } | null)?.msg;
	return typeof message === 'string' && message.trim() ? message.trim() : null;
}

/**
 * Покупка предмета (`i: 4`, `t` — игровой id). При отказе сервер присылает только `msg`; ответ об успехе не разбирается:
 * удалась ли покупка, определяется по обновлённому профилю (предмет стал купленным, `_o="1"`).
 */
export async function buyItem(bot: BotAuth, id: number): Promise<{ message: string | null; sent: boolean }> {
	const response = await getGame(bot.server, { i: 4, t: id }, bot.auth, 1, false, PRIORITY.action);
	return { message: buyMessage(response), sent: response !== null && response !== undefined };
}
