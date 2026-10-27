import { Tappable } from '@vkontakte/vkui';
import { Icon24Favorite, Icon24FavoriteOutline } from '@vkontakte/icons';
import styles from './FavoriteButton.module.css';

/** Звезда «в избранное» в начале строки списка: серый контур, а у отмеченного жёлтая заливка. Нажатие строку не открывает. */
export function FavoriteButton({ active, onToggle, label }: { active: boolean; onToggle: (button: HTMLElement) => void; label: string }) {
	return (
		<Tappable
			className={`${styles.star} ${active ? styles.active : ''}`}
			hasHover
			hasActive
			data-star=""
			aria-label={label}
			aria-pressed={active}
			onClick={(event) => {
				event.stopPropagation();
				onToggle(event.currentTarget);
			}}
		>
			{active ? <Icon24Favorite /> : <Icon24FavoriteOutline />}
		</Tappable>
	);
}
