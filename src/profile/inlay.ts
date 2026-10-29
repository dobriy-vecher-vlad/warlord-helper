import { getGame } from '../api/game';
import { PRIORITY } from '../api/http';
import type { ProfileResponse } from '../api/gameTypes';
import { ITEMS, ITEM_INDEX, type Item, type ItemPrice } from '../lib/items';
import { asArray, type BotAuth } from './bots/common';

/**
 * Инкрустация: камни трёх видов по семь уровней вставляются в слоты предметов и дают бонус (Аквамарин — энергия, Гранат — урон, Сапфир — здоровье).
 * Слотов у предмета от 0 до 3 (`sslt` в каталоге магазина игры), вставлять и снимать камни можно с 5 уровня улучшения предмета.
 * Камень уровня выше первого создаётся из трёх камней того же вида предыдущего уровня и ресурсов (в том числе пергаментов).
 * Вставка платная (пергаменты), снятие тоже (рубины), снятый камень возвращается в запас.
 */

/** С какого уровня улучшения предмета в него можно вставлять и из него снимать камни. */
export const MIN_UPGRADE = 5;
/** Цена снятия камня, рубины (номер валюты 2). */
export const REMOVE_PRICE = 15;
export const RUBIES = 2;
/** Номер валюты пергаментов (`_m7`): вставка камня оплачивается ими. */
export const PARCHMENTS = 7;

export const STONE_KINDS = [
	{ type: 1, name: 'Аквамарин' },
	{ type: 2, name: 'Гранат' },
	{ type: 3, name: 'Сапфир' },
] as const;

/** Названия валют камней: ресурсы 1–6 и пергаменты (`_m7`); `rm8` в каталоге камней приложению неизвестен. */
export const STONE_CURRENCY_NAMES: Record<number, string> = { 1: 'Серебро', 2: 'Рубины', 3: 'Золото', 4: 'Аметисты', 5: 'Топазы', 6: 'Турмалины', 7: 'Пергаменты', 8: 'Ресурс' };

export interface Stone {
	type: number;
	level: number;
	name: string;
	/** Бонус камня: энергия, урон или здоровье (в игре здоровье показывается ×15) */
	value: number;
	/** Какие камни нужны для создания: вид, уровень и сколько; null у камней первого уровня (их не создают, а находят) */
	need: { type: number; level: number; count: number } | null;
	/** Сколько ресурсов тратится на создание: валюта и сумма */
	cost: ItemPrice[];
}

/** Ключ камня в запасе. */
export const stoneKey = (type: number, level: number) => `${type}-${level}`;

/** Картинка камня: `stones/{номер}.png` (вид и уровень подряд, по семь уровней на вид). */
export const stoneIcon = (type: number, level: number) => `stones/${(type - 1) * 7 + level}.png`;

/** Цена вставки камня в пергаментах (клиент `get_stone_insert_price`): Аквамарин 10 бонусов, Гранат 1, Сапфир 2 — за каждое очко бонуса камня. */
export const insertPrice = (type: number, value: number): number => value * (type === 1 ? 10 : type === 3 ? 2 : 1);

/** Что даёт камень словами: «+45 урона». */
export function stoneBonusText(type: number, value: number): string {
	if (type === 1) return `+${value} к энергии`;
	if (type === 2) return `+${value} к урону`;
	return `+${value * 15} к здоровью`;
}

/** Каталог камней из профиля игры (21 камень); null — каталога в профиле нет. */
export function stonesFromProfile(profile: ProfileResponse | null): Stone[] | null {
	const rows = asArray(profile?.stones?.s);
	if (!rows.length) return null;
	return rows
		.map((row): Stone => {
			const count = Number(row._rsc) || 0;
			return {
				type: Number(row._t),
				level: Number(row._id),
				name: row._n ?? '',
				value: Number(row._bv) || 0,
				need: count > 0 ? { type: Number(row._rst) || Number(row._t), level: Number(row._rsi), count } : null,
				cost: [1, 2, 3, 4, 5, 6, 7, 8].flatMap((id): ItemPrice[] => (Number(row[`_rm${id}`]) > 0 ? [[id, Number(row[`_rm${id}`])]] : [])),
			};
		})
		.sort((a, b) => a.type - b.type || a.level - b.level);
}

/** Сколько камней каждого вида и уровня у игрока (свободные, не вставленные). */
export function stoneCounts(profile: ProfileResponse | null): Map<string, number> {
	return new Map(asArray(profile?.stones?.st).map((row) => [stoneKey(Number(row._t), Number(row._id)), Number(row._c) || 0]));
}

/** Ресурсы игрока: `_m1…_m8` профиля. */
export function walletOf(profile: ProfileResponse | null): Record<number, number> {
	return Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((id) => [id, Number(profile?.u?.[`_m${id}`]) || 0]));
}

/** Можно ли создать камень сейчас: `base` — камень первого уровня (не создаётся), `can` — хватает всего, `short` — не хватает камней или ресурсов. */
export type CreateState = 'base' | 'can' | 'short';

export function createState(stone: Stone, counts: ReadonlyMap<string, number>, wallet: Readonly<Record<number, number>>): CreateState {
	if (!stone.need) return 'base';
	const have = counts.get(stoneKey(stone.need.type, stone.need.level)) ?? 0;
	return have >= stone.need.count && stone.cost.every(([currency, amount]) => (wallet[currency] ?? 0) >= amount) ? 'can' : 'short';
}

/** Предмет персонажа со слотами под камни. */
export interface InlayItem {
	/** Индекс предмета в каталоге (его ждёт `ItemCard`) */
	index: number;
	item: Item;
	/** Уровень улучшения предмета */
	upgrade: number;
	/** Слотов под камни у предмета (0–3) */
	slots: number;
	/** Камни по слотам: вид и уровень или null у пустого слота (длина равна числу слотов) */
	stones: ([number, number] | null)[];
	/** Бонус от камней предмета: урон, энергия, здоровье */
	bonus: { dmg: number; en: number; end: number };
}

/** Есть ли в предмете камни и свободные слоты (оба сразу у частично заполненного). */
export const hasStones = (entry: InlayItem) => entry.stones.some(Boolean);
export const hasFreeSlot = (entry: InlayItem) => entry.stones.some((stone) => !stone);

/**
 * Купленные предметы персонажа (с 5 уровня улучшения), у которых есть слоты под камни: число слотов лежит в каталоге магазина игры (`_sslt`).
 * null — каталога магазина в профиле нет.
 */
export function inlayItems(profile: ProfileResponse | null): InlayItem[] | null {
	const catalog = asArray(profile?.shop?.i);
	if (!catalog.length) return null;
	const slotsOf = new Map(catalog.map((row) => [Number(row._id), Number(row._sslt) || 0]));
	const result: InlayItem[] = [];
	for (const node of asArray(profile?.i)) {
		if (Number(node._o) !== 1) continue;
		const id = Number(node._id);
		const index = ITEM_INDEX.get(id);
		const slots = slotsOf.get(id) ?? 0;
		// Ниже 5 уровня улучшения камни вставлять нельзя, такие предметы в разделе не показываются
		if (index === undefined || slots === 0 || (Number(node._u) || 0) < MIN_UPGRADE) continue;
		const stones = [1, 2, 3].slice(0, slots).map((slot): [number, number] | null => {
			const type = Number(node[`_st${slot}1`]);
			return type > 0 ? [type, Number(node[`_st${slot}2`])] : null;
		});
		result.push({
			index,
			item: ITEMS[index]!,
			upgrade: Number(node._u) || 0,
			slots,
			stones,
			bonus: { dmg: Number(node._st_dmg) || 0, en: Number(node._st_en) || 0, end: Number(node._st_end) || 0 },
		});
	}
	return result;
}

/** Сообщение сервера об отказе (`<data><msg>…</msg></data>`); null — отказа в ответе нет. */
function refusal(response: unknown): string | null {
	if (typeof response === 'string') return response.trim() || null;
	const message = (response as { msg?: unknown } | null)?.msg;
	return typeof message === 'string' && message.trim() ? message.trim() : null;
}

async function send(bot: BotAuth, params: Record<string, string | number>): Promise<{ message: string | null; sent: boolean }> {
	const response = await getGame(bot.server, params, bot.auth, 1, false, PRIORITY.action);
	return { message: refusal(response), sent: response !== null && response !== undefined };
}

/** Создать камень (`i: 142`, `t` — вид, `t1` — уровень). Удачу определяет обновлённый профиль: камней стало больше. */
export const createStone = (bot: BotAuth, type: number, level: number) => send(bot, { i: 142, t: type, t1: level });

/** Вставить камень из запаса в слот предмета (`i: 144`, `t` — игровой id предмета, `t1` — слот 1–3, `t2` — вид, `t3` — уровень). */
export const insertStone = (bot: BotAuth, itemId: number, slot: number, type: number, level: number) => send(bot, { i: 144, t: itemId, t1: slot, t2: type, t3: level });

/** Снять камень из слота предмета в запас (`i: 143`, `t` — игровой id предмета, `t1` — слот 1–3); стоит рубины. */
export const removeStone = (bot: BotAuth, itemId: number, slot: number) => send(bot, { i: 143, t: itemId, t1: slot });
