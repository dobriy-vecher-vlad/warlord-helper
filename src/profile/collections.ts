import { getGame } from '../api/game';
import { PRIORITY } from '../api/http';
import type { ProfileResponse } from '../api/gameTypes';
import { ITEMS, ITEM_INDEX, type Item } from '../lib/items';
import { asArray, type BotAuth } from './bots/common';

/**
 * Коллекции предметов. Собрав все части коллекции, игрок получает предмет (первая сборка), а каждая следующая сборка даёт одну заточку
 * для этого предмета (повторная). Каталог коллекций и их частей, количество частей игрока и число сборок лежат в профиле игры.
 */

export interface Part {
	/** Игровой id части, он же имя картинки `collections/{id}.png` */
	id: number;
	/** Название части: «Деталь 1», «Часть 4» */
	name: string;
}

export interface Collection {
	/** Игровой id коллекции (`i: 96`, число сборок) */
	id: number;
	/** Индекс предмета-награды в каталоге (его ждёт `ItemCard`) */
	index: number;
	item: Item;
	parts: Part[];
}

/** Название части без названия предмета: «Нагрудник Гоблина: Деталь 1» → «Деталь 1». */
const partName = (name: string, position: number) => name.split(': ').pop()?.trim() || `Часть ${position + 1}`;

/**
 * Коллекции профиля игры, дающие предмет (у остальных награда ресурсами, в раздел они не входят). null — каталога коллекций в профиле нет.
 */
export function collectionsFromProfile(profile: ProfileResponse | null): Collection[] | null {
	const types = asArray(profile?.collections?.col_t);
	if (!types.length) return null;
	const parts = new Map<number, Part[]>();
	for (const row of asArray(profile?.collections?.col_i)) {
		const collection = Number(row._t);
		const list = parts.get(collection) ?? [];
		list.push({ id: Number(row._id), name: row._n ?? '' });
		parts.set(collection, list);
	}
	const result: Collection[] = [];
	for (const row of types) {
		const index = ITEM_INDEX.get(Number(row._it));
		if (index === undefined) continue;
		const list = (parts.get(Number(row._id)) ?? []).sort((a, b) => a.id - b.id).map((part, position) => ({ ...part, name: partName(part.name, position) }));
		if (list.length) result.push({ id: Number(row._id), index, item: ITEMS[index]!, parts: list });
	}
	return result;
}

/** Сколько у игрока каждой части (`u_col`). */
export function partCounts(profile: ProfileResponse | null): Map<number, number> {
	return new Map(asArray(profile?.collections?.u_col).map((row) => [Number(row._i), Number(row._q) || 0]));
}

/** Сколько раз игрок собрал каждую коллекцию (`ucollc`). */
export function timesCollected(profile: ProfileResponse | null): Map<number, number> {
	return new Map(asArray(profile?.ucollc?.i).map((row) => [Number(row._id), Number(row._cnt) || 0]));
}

/**
 * Состояние коллекции у игрока: сколько каждой части, сколько видов частей есть, сколько полных наборов можно собрать сейчас
 * и сколько раз коллекция уже собрана.
 */
export interface CollectionState {
	counts: number[];
	have: number;
	sets: number;
	times: number;
	owned: boolean;
}

export function collectionState(collection: Collection, counts: ReadonlyMap<number, number>, times: ReadonlyMap<number, number>, owned: ReadonlySet<number>): CollectionState {
	const each = collection.parts.map((part) => counts.get(part.id) ?? 0);
	return {
		counts: each,
		have: each.filter((count) => count > 0).length,
		sets: Math.min(...each),
		times: times.get(collection.id) ?? 0,
		owned: owned.has(collection.item.id),
	};
}

/** Этап: первая сборка (предмета ещё нет, сборка даст предмет) или повторная (предмет есть, сборка даст заточку). */
export type Stage = 'first' | 'repeat';
export const stageOf = (state: CollectionState): Stage => (state.owned ? 'repeat' : 'first');

/** Готовность: можно собрать сейчас, части собраны не все, частей нет. */
export type Readiness = 'ready' | 'progress' | 'empty';
export const readinessOf = (state: CollectionState): Readiness => (state.sets > 0 ? 'ready' : state.have > 0 ? 'progress' : 'empty');

const RANK: Record<Readiness, number> = { ready: 0, progress: 1, empty: 2 };

/** Порядок в списке: сначала то, что можно собрать, затем где больше частей. */
export function sortCollections<T extends { state: CollectionState }>(list: readonly T[]): T[] {
	return [...list].sort((a, b) => RANK[readinessOf(a.state)] - RANK[readinessOf(b.state)] || b.state.have - a.state.have || b.state.sets - a.state.sets);
}

/**
 * Сборка коллекции (`i: 96`, `t` — id коллекции). Сервер отвечает `<a res="1">` при успехе; удалась ли сборка, определяется по обновлённому
 * профилю (выросло число сборок).
 */
export async function collect(bot: BotAuth, id: number): Promise<{ message: string | null; sent: boolean }> {
	const response = await getGame(bot.server, { i: 96, t: id }, bot.auth, 1, false, PRIORITY.action);
	const message = typeof response === 'string' ? response.trim() : typeof response?.msg === 'string' ? response.msg.trim() : '';
	return { message: message || null, sent: response !== null && response !== undefined };
}
