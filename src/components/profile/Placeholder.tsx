import type { CSSProperties, ReactNode } from 'react';
import styles from './Placeholder.module.css';

interface PlaceholderProps {
	icon?: ReactNode;
	title?: ReactNode;
	action?: ReactNode;
	children?: ReactNode;
	/** Свои отступы содержимого вместо 48px 32px */
	style?: CSSProperties;
	className?: string;
	/** На телефоне занять всё свободное место страницы и встать по центру по высоте (страница с нижней панелью) */
	fill?: boolean;
}

/** Пустое состояние (Placeholder VKUI 4): значок, заголовок, текст и кнопка по центру. */
export function Placeholder({ icon, title, action, children, style, className, fill }: PlaceholderProps) {
	return (
		<div className={`${styles.placeholder} ${className ?? ''}`} data-fill={fill ? '' : undefined}>
			<div className={styles.in} style={style}>
				{icon && <div className={styles.icon}>{icon}</div>}
				{title && <div className={styles.title}>{title}</div>}
				{children && <div className={styles.text}>{children}</div>}
				{action && <div className={styles.action}>{action}</div>}
			</div>
		</div>
	);
}
