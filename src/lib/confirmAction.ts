import { useSyncExternalStore } from 'react';

/** Что спрашивается у человека перед необратимым или платным действием. */
export interface ConfirmOptions {
	/** Заголовок окна, например «Удалить профиль?» */
	title: string;
	/** Пояснение под заголовком (без тире, двоеточий и точек) */
	description?: string;
	/** Надпись кнопки согласия */
	confirm: string;
	/** Красная кнопка согласия (удаление, потеря прогресса) */
	destructive?: boolean;
	/** Что сделать, если человек согласился */
	onConfirm: () => void;
}

let current: ConfirmOptions | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export const getConfirm = () => current;

/** Идёт ли сейчас вопрос (его показывает `ConfirmAlert` в окне Alert). */
export const useConfirm = () => useSyncExternalStore(subscribe, getConfirm);

/** Спросить подтверждение окном Alert; пока вопрос открыт, новые вопросы игнорируются. */
export function askConfirm(options: ConfirmOptions): void {
	if (current) return;
	current = options;
	emit();
}

/** Ответ человека: согласие выполняет действие, отказ или закрытие окна ничего не делает. */
export function answerConfirm(agreed: boolean): void {
	const asked = current;
	current = null;
	emit();
	if (agreed) asked?.onConfirm();
}
