import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Snackbar, useSnackbarManager } from '@vkontakte/vkui';
import { Icon28CancelCircleFillRed, Icon28CheckCircleFill, Icon28DonateCircleFillYellow, Icon28ListCircleFillGray } from '@vkontakte/icons';

export interface NotifyOptions {
	text: string;
	icon?: 'done' | 'error' | 'donut';
	/** Текст кнопки действия (как в старом приложении, например ссылка при копировании) */
	action?: string;
	/** Нажатие на кнопку действия */
	onAction?: () => void;
	duration?: number;
}

const ICONS = {
	done: <Icon28CheckCircleFill />,
	error: <Icon28CancelCircleFillRed />,
	donut: <Icon28DonateCircleFillYellow />,
	default: <Icon28ListCircleFillGray />,
};

/** Запас после положенного времени показа: обычное сообщение за это время закрывается само. */
const CLOSE_GRACE_MS = 600;

const NotifyContext = createContext<(options: NotifyOptions) => void>(() => {});

/** Показ сообщений из кода вне компонентов (загрузка профиля и т. п.); подключается NotifyProvider. */
let current: (options: NotifyOptions) => void = () => {};
export const notify = (options: NotifyOptions) => current(options);

/** Показать всплывающее сообщение. Несколько сообщений идут колонкой (штатное поведение менеджера снекбаров VKUI). */
export const useNotify = () => useContext(NotifyContext);

export function NotifyProvider({ children }: { children: ReactNode }) {
	const [api, holder] = useSnackbarManager();
	const notify = useCallback(
		({ text, icon, action, onAction, duration = 3000 }: NotifyOptions) => {
			const toast = api.open({
				duration,
				before: ICONS[icon ?? 'default'],
				action,
				onActionClick: onAction,
				children: text,
			});
			// Страховка от зависшего сообщения. Таймер VKUI стартует только после события окончания анимации входа, а оно теряется,
			// если страница занята (после долгого прохода бота): начало и конец анимации приходят одной пачкой, и сообщение остаётся навсегда.
			// Закрытие уже закрытого сообщения безвредно.
			if (duration > 0) window.setTimeout(toast.close, duration + CLOSE_GRACE_MS);
		},
		[api],
	);
	const value = useMemo(() => notify, [notify]);
	useEffect(() => {
		current = notify;
	}, [notify]);
	return (
		<NotifyContext.Provider value={value}>
			{children}
			{holder}
		</NotifyContext.Provider>
	);
}

export { Snackbar };
