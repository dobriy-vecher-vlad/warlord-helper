import ITEMS_JSON from '../data/items.json';
import type { ItemFilter } from '../store/itemFilter';
export { DEFAULT_FILTER, type ItemFilter } from '../store/itemFilter';

/** Цена в одной валюте: номер валюты (media/images/currency/{n}.png) и сумма. */
export type ItemPrice = [currency: number, price: number];

/** Предмет из каталога. */
export interface Item {
	id: number;
	title: string;
	description: string;
	dmg: number;
	hp: number;
	/** Цена по валютам: у большинства предметов одна, у предметов кузницы гильдии две (аметисты и топазы) */
	prices: ItemPrice[];
	icon: string;
	type: number;
	fragments: unknown[];
}

/**
 * Ссылка на предмет в данных разделов. `id` — индекс в каталоге (items.json), а не id предмета в игре.
 * Флаги показывают, чем является награда: предмет, элемент коллекции, личная коллекция, заточка.
 */
export interface ItemRef {
	id: number;
	item?: boolean;
	collection?: boolean;
	personal?: boolean;
	scroll?: boolean;
	tooltip?: string[] | string;
}

/** JSON отдаёт цены как number[][], а не кортежи, поэтому приведение через unknown. */
export const ITEMS = ITEMS_JSON as unknown as readonly Item[];

/** Индекс предмета в каталоге по игровому id. */
export const ITEM_INDEX: ReadonlyMap<number, number> = new Map(ITEMS.map((item, index) => [item.id, index]));

/** Типы предметов каталога: номер типа и название группы (порядок как на вкладках профиля). */
export const ITEM_TYPES = [
	{ value: 2, title: 'Оружие' },
	{ value: 4, title: 'Шлемы' },
	{ value: 3, title: 'Броня' },
	{ value: 12, title: 'Наплечники' },
	{ value: 6, title: 'Наручи' },
	{ value: 14, title: 'Перчатки' },
	{ value: 5, title: 'Штаны' },
	{ value: 13, title: 'Ботинки' },
	{ value: 15, title: 'Щиты' },
	{ value: 16, title: 'Бижутерия' },
] as const;

/** Предмет каталога по индексу. */
export const itemAt = (index: number): Item | undefined => ITEMS[index];

/** Проходит ли награда фильтр (условие из старого описания наград). */
export function matchesFilter(ref: ItemRef, filter: ItemFilter): boolean {
	return (filter.item && !!ref.item) || (filter.collection && !!ref.collection && !ref.personal) || (filter.scroll && !!ref.scroll) || (filter.personal && !!ref.personal);
}

/** Группа для сортировки: предмет + коллекция + заточка (1), …, только заточка (7), прочее (8). */
function group(ref: ItemRef, f: ItemFilter): number {
	const item = f.item && !!ref.item;
	const collection = f.collection && !!ref.collection;
	const scroll = f.scroll && !!ref.scroll;
	if (item && collection && scroll) return 1;
	if (item && collection) return 2;
	if (item && scroll) return 3;
	if (item) return 4;
	if (collection && scroll) return 5;
	if (collection) return 6;
	if (scroll) return 7;
	return 8;
}

/**
 * Отсортированные и отфильтрованные награды.
 * Сортировка повторяет старое приложение один в один: сначала по типу предмета, затем по группе,
 * обе с компаратором без равенства (-1/1). Из-за этого порядок внутри группы зависит от алгоритма
 * сортировки движка, и только точное повторение даёт тот же порядок, что был у пользователей.
 * Исходный массив не меняется; пустые ссылки и несуществующие предметы отбрасываются.
 */
export function visibleItems(refs: readonly (ItemRef | null | undefined)[], filter: ItemFilter): ItemRef[] {
	return refs
		.filter((ref): ref is ItemRef => !!ref && !!itemAt(ref.id))
		.sort((a, b) => (itemAt(a.id)!.type < itemAt(b.id)!.type ? -1 : 1))
		.sort((a, b) => (group(a, filter) < group(b, filter) ? -1 : 1))
		.filter((ref) => matchesFilter(ref, filter));
}

/** Подпись награды в списке: её подсказка (через запятую). */
export const tooltipText = (ref: ItemRef) => (Array.isArray(ref.tooltip) ? ref.tooltip.join(', ') : (ref.tooltip ?? ''));
