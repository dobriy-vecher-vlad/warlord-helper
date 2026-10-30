import { guardedLeave } from '../lib/leaveGuard';
import { createStore, useStore } from './createStore';

/** Идентификаторы модальных окон. Дополняются по мере переноса разделов. */
export type ModalId =
	| 'alert'
	| 'description'
	| 'item'
	| 'sales'
	| 'donut'
	| 'arenaItems'
	| 'eventsItems'
	| 'settings'
	| 'settingsId'
	| 'settingsLogin'
	| 'settingsPassword'
	| 'settingsServer'
	| 'settingsOrder'
	| 'newBoss'
	| 'invite'
	| 'battle'
	| 'battleResult'
	| 'participants'
	| 'create'
	| 'killAll'
	| 'inlay';

export interface ModalEntry {
	id: ModalId;
	/** Ключ окна: повторное открытие с тем же ключом возвращает стек к этому окну */
	key: string | number | null;
	data: Record<string, unknown>;
}

/** instant: переход идёт между открытыми окнами (стек не пуст до и после) — анимацию надо отключить */
interface ModalState {
	stack: ModalEntry[];
	instant: boolean;
}

const modals = createStore<ModalState>({ stack: [], instant: false });

/** Новое состояние: плавно открывается только первое окно и закрывается последнее, между окнами анимации нет. */
const next = (before: ModalEntry[], stack: ModalEntry[]): ModalState => ({ stack, instant: before.length > 0 && stack.length > 0 });

export const getModalStack = () => modals.get().stack;
export const subscribeModals = modals.subscribe;
export const useActiveModal = (): ModalEntry | null => useStore(modals, (s) => s.stack[s.stack.length - 1] ?? null);

/** Открыть окно поверх текущего. Если окно с таким же ключом уже есть в стеке, стек обрезается до него. */
export function openModal(id: ModalId, data: Record<string, unknown> = {}, key: string | number | null = null) {
	modals.set((state) => {
		const index = key === null ? -1 : state.stack.findIndex((entry) => entry.key === key);
		const stack = index === -1 ? state.stack : state.stack.slice(0, index);
		return next(state.stack, [...stack, { id, key, data }]);
	});
}

/** Назад к предыдущему окну; если его нет — закрыть. Если в окне идёт действие, которое закрытие прервёт, спрашивается подтверждение. */
export function backModal() {
	const top = modals.get().stack.at(-1);
	// Согласие приходит позже (окно Alert): закрывается то же окно, а не то, что успело открыться поверх
	const close = () => {
		if (modals.get().stack.at(-1)?.id !== top?.id) return;
		modals.set((state) => next(state.stack, state.stack.slice(0, -1)));
	};
	if (top) guardedLeave(close, top.id);
	else close();
}

/**
 * Закрыть окно `id`, если оно сейчас верхнее: запрос из окна мог закончиться уже после того, как человек закрыл его и открыл другое.
 * Закрывает само приложение (запрос завершён), поэтому подтверждение не спрашивается: страж окна к этому моменту ещё не снят.
 */
export function backModalIf(id: ModalId) {
	if (modals.get().stack.at(-1)?.id !== id) return;
	modals.set((state) => next(state.stack, state.stack.slice(0, -1)));
}

export function closeModal() {
	modals.set((state) => next(state.stack, []));
}

/** Открыто хотя бы одно окно: затемнение экрана одно на все окна, пока они есть в стеке. */
export const useAnyModal = () => useStore(modals, (s) => s.stack.length > 0);

/** Переход идёт между открытыми окнами (стек не пуст до и после): анимацию окна на ПК надо отключить. */
export const useInstantModal = () => useStore(modals, (s) => s.instant);
