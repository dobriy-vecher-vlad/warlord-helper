import { memo } from 'react';
import { Avatar } from '@vkontakte/vkui';
import styles from './Photo.module.css';

interface PhotoProps {
	src: string;
	size: number;
	/** Скругление: круг по умолчанию */
	radius?: number | string;
	/** Увеличение картинки внутри рамки (картинки с прозрачными краями) */
	scale?: number;
	/** Картинка грузится, когда подходит к экрану (длинные списки) */
	lazy?: boolean;
	className?: string;
}

/**
 * Картинка в штатном Avatar VKUI; тонкая обводка берёт цвет и толщину из токенов старого приложения (см. .photo).
 * Компонент перерисовывается лишь при смене свойств (в длинных списках это заметно).
 */
export const Photo = memo(function Photo({ src, size, radius = '50%', scale, lazy, className }: PhotoProps) {
	return (
		<Avatar
			className={`${styles.photo} ${className ?? ''}`}
			size={size}
			src={src}
			withTransparentBackground
			style={{ borderRadius: radius }}
			slotProps={scale || lazy ? { img: { ...(lazy ? { loading: 'lazy' as const } : {}), ...(scale ? { style: { transform: `scale(${scale})` } } : {}) } } : undefined}
		/>
	);
});
