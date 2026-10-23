import { useSyncExternalStore } from 'react';

/** Минимальное внешнее хранилище для React (без зависимостей). */
export interface Store<T> {
	get: () => T;
	set: (patch: Partial<T> | ((state: T) => T)) => void;
	subscribe: (listener: () => void) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
	let state = initial;
	const listeners = new Set<() => void>();
	return {
		get: () => state,
		set: (patch) => {
			state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
			listeners.forEach((listener) => listener());
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

/** Подписка на часть состояния. Селектор должен возвращать стабильное значение (примитив или существующую ссылку). */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
	return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}
