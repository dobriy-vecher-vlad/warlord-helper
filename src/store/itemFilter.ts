import { createStore, useStore } from './createStore';

/** Какие виды наград показывать (панель-фильтр внизу подразделов). */
export interface ItemFilter {
	item: boolean;
	scroll: boolean;
	collection: boolean;
	personal: boolean;
	/** Показывать предметы, которые уже есть у персонажа (переключатель есть только с подпиской) */
	stock: boolean;
}

export const DEFAULT_FILTER: ItemFilter = { item: true, scroll: true, collection: true, personal: true, stock: true };

/** Фильтр наград (панель внизу подразделов). Сбрасывается при каждом переходе, как в старом приложении. */
const filterStore = createStore<ItemFilter>({ ...DEFAULT_FILTER });

export const useItemFilter = () => useStore(filterStore, (s) => s);

export function setItemFilter(key: keyof ItemFilter, value: boolean) {
	filterStore.set({ [key]: value });
}

export function resetItemFilter() {
	filterStore.set({ ...DEFAULT_FILTER });
}
