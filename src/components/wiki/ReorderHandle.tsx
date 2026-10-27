import type { PointerEvent } from 'react';
import { Icon24Reorder } from '@vkontakte/icons';
import styles from './FavoriteButton.module.css';

/** Кнопка перетаскивания («три полоски») на месте звезды: строка движется вместе с пальцем или мышью. */
export function ReorderHandle({ onStart }: { onStart: (event: PointerEvent<HTMLElement>) => void }) {
	return (
		<span className={`${styles.star} ${styles.handle}`} role="button" aria-label="Переместить" onPointerDown={onStart} onClick={(event) => event.stopPropagation()}>
			<Icon24Reorder />
		</span>
	);
}
