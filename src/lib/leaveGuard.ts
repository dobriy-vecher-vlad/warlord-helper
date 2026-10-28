import { useEffect, useRef } from 'react';

/** Стандартный текст браузера при закрытии страницы с несохранённой работой: один и тот же при закрытии вкладки и при уходе внутри приложения. */
export const LEAVE_TEXT = 'Покинуть сайт? Внесенные изменения могут не сохраниться.';

/** Активное действие, которое уход со страницы или из окна прервёт (работа бота, запрос, меняющий данные игры). */
interface Guard {
	/** Окно, которое защищено: закрытие именно этого окна просит подтверждения; null — защищена вся страница */
	modal: string | null;
	/** Вызывается, когда уход подтверждён (бот может понять, что окно закрывают) */
	onLeave?: () => void;
}

const guards = new Set<Guard>();

/** Телефонная раскладка (её ставит приложение на корневой элемент): там подтверждений нет, выход остаётся на совести человека. */
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

/**
 * Можно ли уйти. Нет активных действий — да. Иначе системное подтверждение браузера со стандартным текстом (как при закрытии вкладки).
 * `modal` — закрывается окно с этим id: учитываются действия этого окна; без него — уход со страницы, учитываются все действия.
 */
export function confirmLeave(modal?: string): boolean {
	const hit = [...guards].filter((guard) => modal === undefined || guard.modal === modal);
	if (!hit.length) return true;
	// На телефоне без вопроса: диалоги в мобильном клиенте ненадёжны, а свайпом закрыть окно можно и так
	if (!isMobile() && !window.confirm(LEAVE_TEXT)) return false;
	hit.forEach((guard) => guard.onLeave?.());
	return true;
}

/**
 * Пока `active`, закрытие вкладки, уход со страницы и закрытие окна `modal` (если задано) требуют подтверждения. `onLeave` вызывается,
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
