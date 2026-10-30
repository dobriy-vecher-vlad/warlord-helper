import { Icon56FragmentsOutline } from '@vkontakte/icons';
import { Placeholder } from './Placeholder';
import { FooterButton } from '../form/FooterButton';

/** Сервер игры не ответил (сообщение уже показано): можно повторить загрузку без выхода со страницы. */
export function LoadFailed({ onRetry }: { onRetry: () => void }) {
	return (
		<Placeholder
			icon={<Icon56FragmentsOutline />}
			title="Не удалось загрузить данные"
			action={
				<FooterButton mode="secondary" onClick={onRetry}>
					Повторить
				</FooterButton>
			}
		>
			Игровой сервер не ответил
		</Placeholder>
	);
}
