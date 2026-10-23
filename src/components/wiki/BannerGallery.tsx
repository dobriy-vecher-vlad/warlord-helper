import type { ReactNode } from 'react';
import { Gallery } from '@vkontakte/vkui';
import { useIsDesktop } from '../../app/layout';
import { PATH_IMAGES } from '../../config';
import { Preload } from '../Preload';
import styles from './BannerGallery.module.css';

interface BannerGalleryProps {
	images: readonly string[];
	title?: ReactNode;
	subtitle?: ReactNode;
}

/** Баннеры раздела с затемнением снизу и подписью (листаются, меняются каждые 5 секунд). */
export function BannerGallery({ images, title, subtitle }: BannerGalleryProps) {
	const isDesktop = useIsDesktop();
	return (
		<Gallery className={styles.gallery} bullets={false} showArrows={isDesktop} slideWidth="100%" align="center" timeout={5000} dragDisabled={isDesktop}>
			{images.map((image) => (
				<div key={image} className={styles.slide}>
					<div className={`${styles.banner} BannerBorder`}>
						<Preload src={`${PATH_IMAGES}${image}`} size="xl" className={styles.preload} />
						<div className={styles.image} style={{ backgroundImage: `url(${PATH_IMAGES}${image})` }} />
						{(title || subtitle) && (
							<div className={styles.content}>
								{title && <div className={styles.title}>{title}</div>}
								{subtitle && <div className={styles.subtitle}>{subtitle}</div>}
							</div>
						)}
					</div>
				</div>
			))}
		</Gallery>
	);
}

/** Место под баннеры, пока раздел загружается: та же высота, поэтому содержимое не прыгает. */
export function BannerPlaceholder() {
	return (
		<div className={styles.gallery}>
			<div className={styles.slide}>
				<div className={`${styles.banner} BannerBorder`} />
			</div>
		</div>
	);
}
