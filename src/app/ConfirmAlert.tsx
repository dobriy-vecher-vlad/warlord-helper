import { Alert, ConfigProvider, useConfigProvider } from '@vkontakte/vkui';
import { answerConfirm, type ConfirmOptions } from '../lib/confirmAction';

/**
 * Подтверждение необратимого или платного действия (удаление профиля, выход из рейда и другие). Окно Alert с платформой vkcom только для него,
 * как и подтверждение ухода: остальное приложение на ios, где Alert рисуется не так, как нужно.
 */
export function ConfirmAlert({ options }: { options: ConfirmOptions }) {
	const config = useConfigProvider();
	return (
		<ConfigProvider {...config} platform="vkcom">
			<Alert
				title={options.title}
				description={options.description}
				actions={[
					{ title: 'Отмена', mode: 'cancel', autoCloseDisabled: true, action: () => answerConfirm(false) },
					{ title: options.confirm, mode: options.destructive ? 'destructive' : 'default', autoCloseDisabled: true, action: () => answerConfirm(true) },
				]}
				// Кнопки без автозакрытия VKUI: их действие вызывается сразу, а не после анимации закрытия, и ответ не теряется; окно убирает сам ответ
				onClose={() => answerConfirm(false)}
				onClosed={() => undefined}
			/>
		</ConfigProvider>
	);
}
