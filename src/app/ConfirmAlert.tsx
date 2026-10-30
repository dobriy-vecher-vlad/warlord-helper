import { answerConfirm, type ConfirmOptions } from '../lib/confirmAction';
import { AppAlert } from './AppAlert';

/**
 * Подтверждение необратимого или платного действия (удаление профиля, выход из рейда и другие). Вид общий для алертов приложения (`AppAlert`).
 */
export function ConfirmAlert({ options }: { options: ConfirmOptions }) {
	return (
		<AppAlert
			title={options.title}
			description={options.description}
			// Кнопки без автозакрытия VKUI: их действие вызывается сразу, а не после анимации закрытия, и ответ не теряется; окно убирает сам ответ
			actions={[
				{ title: 'Отмена', mode: 'cancel', autoCloseDisabled: true, action: () => answerConfirm(false) },
				{ title: options.confirm, mode: options.destructive ? 'destructive' : 'default', autoCloseDisabled: true, action: () => answerConfirm(true) },
			]}
			onClose={() => answerConfirm(false)}
		/>
	);
}
