import type { KeyboardEvent } from 'react';

/**
 * Свойства для элемента, который нажимается как кнопка, но не является ею (div, ссылка без адреса):
 * роль, фокус с клавиатуры и срабатывание по Enter и пробелу.
 */
export function clickable(onClick: (() => void) | undefined) {
	if (!onClick) return {};
	return {
		role: 'button' as const,
		tabIndex: 0,
		onClick,
		onKeyDown: (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick();
			}
		},
	};
}
