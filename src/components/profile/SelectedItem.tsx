import type { ComponentProps, ReactNode } from 'react';
import { useIsDesktop } from '../../app/layout';
import { ItemCard } from '../wiki/ItemCard';
import styles from './SelectedItem.module.css';

/** Высота строки с кнопкой под карточкой на телефоне: отступ 8px и кнопка 36px (нижняя кнопка размера S по высоте как M, `FooterButton`). */
export const MOBILE_ACTION_HEIGHT = 8 + 36;

/** Вид кнопки действия: справа в карточке на ПК, на всю ширину второй строкой на телефоне. */
export interface ActionLayout {
	stretched: boolean;
}

/** Выбранный предмет внизу панели с кнопкой действия («Улучшить», «Купить»); без кнопки карточка просто показывает предмет. */
export function SelectedItem({ index, button, custom }: { index: number; button?: (layout: ActionLayout) => ReactNode; custom?: ComponentProps<typeof ItemCard>['custom'] }) {
	const isDesktop = useIsDesktop();
	return (
		<div className={styles.selected}>
			{isDesktop ? (
				<ItemCard index={index} custom={custom} after={button?.({ stretched: false })} disabled={!button} plain={!button} />
			) : (
				<>
					<ItemCard index={index} custom={custom} disabled plain />
					{button && <div className={styles.action}>{button({ stretched: true })}</div>}
				</>
			)}
		</div>
	);
}
