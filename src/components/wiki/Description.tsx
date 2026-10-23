import type { ReactNode } from 'react';
import { Tappable } from '@vkontakte/vkui';
import { Icon24ChainOutline, Icon24ChevronCompactRight } from '@vkontakte/icons';
import { PATH_IMAGES } from '../../config';
import { itemAt, visibleItems, type ItemRef } from '../../lib/items';
import { useOwned } from '../../profile/owned';
import { useItemFilter } from '../../store/itemFilter';
import { BorderedImage } from '../BorderedImage';
import { ItemCell } from './ItemCell';
import styles from './Description.module.css';

/** Строка «подпись — значение» в окне описания. */
export function DescriptionCell({ label, text }: { label: ReactNode; text: ReactNode }) {
	return (
		<div className={styles.cell}>
			<span className={styles.label}>{label}</span>
			<span className={styles.text}>{text}</span>
		</div>
	);
}

/** Сетка карточек по две в ряд. */
export function CardGrid({ children }: { children: ReactNode }) {
	return <div className={styles.cardGrid}>{children}</div>;
}

interface DescriptionCardProps {
	label: ReactNode;
	text?: ReactNode;
	/** Путь картинки внутри media/images/ */
	avatar?: string;
	/** Немного увеличить картинку, обрезав края (для иконок с рамкой) */
	avatarFix?: boolean;
	/** Порядковый номер слева */
	counter?: ReactNode;
}

/** Карточка с иконкой, заголовком и подписью (в старом приложении — DescriptionRichCell). */
export function DescriptionCard({ label, text, avatar, avatarFix, counter }: DescriptionCardProps) {
	return (
		<div className={styles.card}>
			<div className={styles.richCell}>
				{(avatar || counter !== undefined) && (
					<div className={styles.richBefore}>
						{counter !== undefined && <span className={styles.counter}>{counter}</span>}
						{avatar && <BorderedImage src={avatar} className={`${styles.avatar} ${avatarFix ? styles.avatarFix : ''}`} />}
					</div>
				)}
				<div className={styles.richBody}>
					<div className={styles.richTitle}>{label}</div>
					{text !== undefined && <div className={styles.richText}>{text}</div>}
				</div>
			</div>
		</div>
	);
}

/** Строка с иконкой, заголовком и подписью (в старом приложении — DescriptionCellButton). */
export function IconCell({ icon, title, subtitle }: { icon: ReactNode; title: ReactNode; subtitle: ReactNode }) {
	return (
		<div className={styles.iconCell}>
			<span className={styles.iconCellIcon}>{icon}</span>
			<span className={styles.iconCellBody}>
				<span className={styles.iconCellTitle}>{title}</span>
				<span className={styles.iconCellSubtitle}>{subtitle}</span>
			</span>
		</div>
	);
}

/** Ссылка на картинку (открывается в новой вкладке). */
export function LinkCell({ href, children }: { href: string; children: ReactNode }) {
	return (
		<Tappable Component="a" href={href} target="_blank" className={`${styles.iconCell} ${styles.link}`}>
			<span className={styles.iconCellIcon}>
				<Icon24ChainOutline />
			</span>
			<span className={styles.iconCellBody}>
				<span className={styles.iconCellTitle}>{children}</span>
				<span className={styles.iconCellSubtitle}>Ссылка</span>
			</span>
			<Icon24ChevronCompactRight className={styles.chevron} />
		</Tappable>
	);
}

export const imageUrl = (path: string) => `${PATH_IMAGES}${path}`;

/** Пустая ячейка по центру высотой 44px (в VKUI 4 так выглядел пустой список); по умолчанию «Нет предметов». */
export const EmptyCell = ({ children = 'Нет предметов' }: { children?: ReactNode }) => <div className={styles.empty}>{children}</div>;

/** Список наград с учётом фильтра; если ничего не осталось — «Нет предметов». */
export function ItemList({ items }: { items: readonly (ItemRef | null | undefined)[] }) {
	const filter = useItemFilter();
	const { owns } = useOwned();
	// Без переключателя «Наличие предмета» предметы, которые уже есть, скрываются
	const visible = visibleItems(items, filter).filter((ref) => filter.stock || !owns(itemAt(ref.id)!.id));
	if (!visible.length) return <EmptyCell />;
	return (
		<div className={styles.itemList}>
			{visible.map((ref, index) => (
				<ItemCell key={`${ref.id}-${index}`} data={ref} />
			))}
		</div>
	);
}
