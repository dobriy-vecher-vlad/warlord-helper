import { Alert, ConfigProvider, useConfigProvider } from '@vkontakte/vkui';
import { answerLeave } from '../lib/leaveGuard';

/**
 * Подтверждение ухода, пока идёт действие, которое уход прервёт (работа бота, покупка, обмен). Окно Alert с платформой vkcom только для него:
 * остальное приложение на ios, где Alert рисуется мелким и не так, как нужно. Одинаково на ПК и на телефоне.
 */
export function LeaveAlert() {
	const config = useConfigProvider();
	return (
		<ConfigProvider {...config} platform="vkcom">
			<Alert
				title="Покинуть страницу?"
				description="Идёт действие, при уходе оно прервётся"
				actions={[
					{ title: 'Остаться', mode: 'cancel', autoCloseDisabled: true, action: () => answerLeave(false) },
					{ title: 'Уйти', mode: 'destructive', autoCloseDisabled: true, action: () => answerLeave(true) },
				]}
				// Кнопки без автозакрытия VKUI: их действие вызывается сразу, а не после анимации закрытия, и ответ не теряется; окно убирает сам ответ
				onClose={() => answerLeave(false)}
				onClosed={() => undefined}
			/>
		</ConfigProvider>
	);
}
