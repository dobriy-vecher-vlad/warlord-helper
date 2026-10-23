import type { ReactNode } from 'react';
import { Tappable } from '@vkontakte/vkui';
import { Icon24ChevronCompactRight, Icon24Done } from '@vkontakte/icons';
import { BorderedImage } from '../BorderedImage';
import styles from './NavCell.module.css';

interface NavCellProps {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Иконка, путь внутри media/images/ */
	image?: string;
	/** Своя иконка вместо картинки */
	icon?: ReactNode;
	/** Метка справа, перед числом (например, SOLO) */
	badge?: ReactNode;
	/** Своё содержимое справа, перед стрелкой (после числа) */
	after?: ReactNode;
	/** Число справа и подпись под ним («27 / предметов») */
	count?: ReactNode;
	countLabel?: ReactNode;
	/** Стрелка справа (false — строка выбора из списка) */
	chevron?: boolean;
	/** Строка выбрана: справа отметка вместо стрелки */
	selected?: boolean;
	/** Строка страницы профиля: на телефоне высота по содержимому (60px, со счётчиком 61px) */
	profile?: boolean;
	/** Без обработчика строка просто показывает данные: без подложки при наведении и без указателя */
	onClick?: () => void;
	className?: string;
}

/** Строка перехода в подраздел с картинкой, счётчиком и стрелкой. */
export function NavCell({ title, subtitle, image, icon, count, countLabel, badge, after, chevron = true, selected = false, profile = false, onClick, className }: NavCellProps) {
	return (
		<Tappable
			className={`${styles.cell} ${profile ? styles.profile : ''} ${!image && icon ? styles.compact : ''} ${onClick ? '' : styles.static} ${className ?? ''}`}
			onClick={onClick}
			hasHover={!!onClick}
			hasActive={!!onClick}
		>
			{image ? <BorderedImage src={image} className={styles.image} /> : icon && <span className={styles.icon}>{icon}</span>}
			<span className={styles.body}>
				<span className={styles.title}>{title}</span>
				{subtitle && <span className={styles.subtitle}>{subtitle}</span>}
			</span>
			{badge && <span className={styles.badge}>{badge}</span>}
			{(count !== undefined || countLabel) && (
				<span className={styles.indicator}>
					{count !== undefined && <span className={styles.count}>{count}</span>}
					{countLabel && <span className={styles.countLabel}>{countLabel}</span>}
				</span>
			)}
			{after && <span className={styles.after}>{after}</span>}
			{selected ? <Icon24Done className={styles.selected} /> : chevron && <Icon24ChevronCompactRight className={styles.chevron} />}
		</Tappable>
	);
}
