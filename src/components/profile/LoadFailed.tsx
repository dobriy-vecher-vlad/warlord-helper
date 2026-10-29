import { Icon56FragmentsOutline } from '@vkontakte/icons';
import { Button } from '../form/Form';
import { Placeholder } from './Placeholder';

/** Сервер игры не ответил (сообщение уже показано): можно повторить загрузку без выхода со страницы. */
export function LoadFailed({ onRetry }: { onRetry: () => void }) {
	return (
		<Placeholder
			icon={<Icon56FragmentsOutline />}
			title="Не удалось загрузить данные"
			action={
				<Button size="s" mode="secondary" onClick={onRetry}>
					Повторить
				</Button>
			}
		>
			Игровой сервер не ответил
		</Placeholder>
	);
}
