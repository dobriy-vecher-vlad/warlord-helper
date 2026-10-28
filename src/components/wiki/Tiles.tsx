import type { ReactNode } from 'react';
import { HorizontalScroll, Spinner, Tappable } from '@vkontakte/vkui';
import { useIsDesktop } from '../../app/layout';
import { useDeepLink } from '../../app/deepLink';
import { BorderedImage } from '../BorderedImage';
import { useImgLoaded } from '../Preload';
import styles from './Tiles.module.css';

export interface TileProps {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Путь картинки внутри media/images/ */
	image?: string;
	/** Плашки поверх картинки (время, количество и т. п.) */
	badges?: ReactNode[];
	onClick?: () => void;
	/** Значение `modal=` в ссылке, по которому плитка открывается автоматически */
	deepLink?: string;
}

/** Плитка с квадратной картинкой и подписью (в старом приложении — HorizontalCell внутри Horizontal__Cells). */
export function Tile({ title, subtitle, image, badges, onClick, deepLink }: TileProps) {
	useDeepLink(deepLink, onClick);
	const { loaded, imgProps } = useImgLoaded();
	return (
		<Tappable className={styles.tile} onClick={onClick}>
			<div className={styles.image}>
				{!loaded && <Spinner size="m" className={styles.preload} />}
				<BorderedImage src={image ?? ''} className={styles.frame} imgProps={imgProps} />
				{badges?.map((badge, index) => (
					<span key={index} className={styles.badge} style={{ top: 14 + index * 26 }}>
						{badge}
					</span>
				))}
			</div>
			<div className={styles.text}>
				<div className={styles.title}>{title}</div>
				{subtitle !== undefined && <div className={styles.subtitle}>{subtitle}</div>}
			</div>
		</Tappable>
	);
}

/**
 * Сетка плиток. `wide` — по 4 в ряд на десктопе (иначе по 3, как CardGrid size="s").
 */
export function TileGrid({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
	const isDesktop = useIsDesktop();
	return <div className={`${styles.grid} ${wide && isDesktop ? styles.wide : ''}`}>{children}</div>;
}

/** Горизонтальная лента плиток. На десктопе при наведении появляются стрелки прокрутки, как в старом CardScroll. */
export function TileScroll({ children }: { children: ReactNode }) {
	return (
		<HorizontalScroll className={styles.scroll} arrowSize="m">
			<div className={styles.scrollInner}>{children}</div>
		</HorizontalScroll>
	);
}
