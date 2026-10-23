import { useEffect, useRef } from 'react';
import { consumePendingModal, usePendingModal } from '../store/nav';

/**
 * Открытие окна по ссылке `…&modal=N`: когда на экране появляется элемент с ключом N, вызывается его действие.
 * Заменяет старый приём с `document.querySelector('#modal_N').click()`.
 * Действие хранится в ref: у плиток оно новое на каждой отрисовке, и без ref эффект перезапускался бы у каждой плитки списка.
 */
export function useDeepLink(key: string | undefined, open: (() => void) | undefined) {
	const pending = usePendingModal();
	const action = useRef(open);
	useEffect(() => {
		action.current = open;
	});
	const matches = key !== undefined && !!open && pending === key;
	useEffect(() => {
		if (!matches) return;
		consumePendingModal();
		action.current?.();
	}, [matches]);
}
