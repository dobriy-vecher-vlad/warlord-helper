import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Активное действие, которое уход со страницы или из окна прервёт (работа бота, запрос, меняющий данные игры). */
interface Guard {
	/** Окно, которое защищено: закрытие именно этого окна просит подтверждения; null — защищена вся страница */
	modal: string | null;
	/** Вызывается, когда уход подтверждён (бот может понять, что окно закрывают) */
	onLeave?: () => void;
}

const guards = new Set<Guard>();

/** Телефонная раскладка (её ставит приложение на корневой элемент): закрытие вкладки там не перехватывается, у мобильного клиента нет такого события. */
const isMobile = () => document.documentElement.dataset.layout === 'mobile';

/** Закрытие вкладки и перезагрузка (только на ПК): системное окно браузера, пока есть хотя бы одно активное действие. */
function warnOnUnload(event: BeforeUnloadEvent) {
	if (!guards.size || isMobile()) return;
	event.preventDefault();
	event.returnValue = '';
}

let listening = false;

function listen() {
	if (listening || typeof window === 'undefined') return;
	listening = true;
	window.addEventListener('beforeunload', warnOnUnload);
}

/** Запрос на уход, ждущий ответа человека: что сделать при согласии и какие действия прервутся. */
interface LeaveRequest {
	proceed: () => void;
	hits: Guard[];
}

let request: LeaveRequest | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/** Подписка на запрос подтверждения (его показывает окно Alert в `LeaveAlert`). */
export function subscribeLeave(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export const getLeaveRequest = () => request;

/** Идёт ли сейчас запрос подтверждения ухода (для окна Alert). */
export const useLeaveRequest = () => useSyncExternalStore(subscribeLeave, getLeaveRequest);

/** Ответ человека в окне: согласие вызывает `onLeave` прерываемых действий и сам переход, отказ оставляет всё как было. */
export function answerLeave(agreed: boolean) {
	const current = request;
	request = null;
	emit();
	if (!agreed || !current) return;
	current.hits.forEach((guard) => guard.onLeave?.());
	current.proceed();
}

/**
 * Выполнить `proceed` (уход со страницы или закрытие окна), если уйти можно. Нет активных действий: сразу. Иначе открывается окно Alert,
 * и `proceed` выполняется после согласия (на ПК и на телефоне одинаково). `modal` — закрывается окно с этим id: учитываются действия
 * этого окна; без него учитываются все действия. Пока вопрос открыт, новые запросы игнорируются.
 */
export function guardedLeave(proceed: () => void, modal?: string): void {
	const hits = [...guards].filter((guard) => modal === undefined || guard.modal === modal);
	if (!hits.length) return proceed();
	if (request) return;
	request = { proceed, hits };
	emit();
}

/**
 * Пока `active`, закрытие вкладки (только на ПК), уход со страницы и закрытие окна `modal` (если задано) требуют подтверждения. `onLeave` вызывается,
 * когда человек подтвердил уход из приложения (не закрытие вкладки: оно не отслеживается).
 */
export function useLeaveGuard(active: boolean, modal: string | null = null, onLeave?: () => void) {
	const leave = useRef(onLeave);
	useEffect(() => {
		leave.current = onLeave;
	});
	useEffect(() => {
		if (!active) return;
		listen();
		const guard: Guard = { modal, onLeave: () => leave.current?.() };
		guards.add(guard);
		return () => {
			guards.delete(guard);
		};
	}, [active, modal]);
}
