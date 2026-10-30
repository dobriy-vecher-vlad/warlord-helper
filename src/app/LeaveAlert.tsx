import { answerLeave } from '../lib/leaveGuard';
import { AppAlert } from './AppAlert';

/**
 * Подтверждение ухода, пока идёт действие, которое уход прервёт (работа бота, покупка, обмен). Вид общий для алертов приложения (`AppAlert`),
 * одинаково на ПК и на телефоне.
 */
export function LeaveAlert() {
	return (
		<AppAlert
			title="Покинуть страницу?"
			description="Идёт действие, при уходе оно прервётся"
			// Кнопки без автозакрытия VKUI: их действие вызывается сразу, а не после анимации закрытия, и ответ не теряется; окно убирает сам ответ
			actions={[
				{ title: 'Остаться', mode: 'cancel', autoCloseDisabled: true, action: () => answerLeave(false) },
				{ title: 'Уйти', mode: 'destructive', autoCloseDisabled: true, action: () => answerLeave(true) },
			]}
			onClose={() => answerLeave(false)}
		/>
	);
}
