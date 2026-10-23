import type { ReactNode } from 'react';
import { PATH_IMAGES } from '../config';
import styles from './GameBanner.module.css';

interface GameBannerProps {
	title: ReactNode;
	subtitle: ReactNode;
	/** Фон, путь внутри media/images/ */
	background: string;
	/** Фигура босса (отражена, выглядывает слева снизу) */
	person?: string;
	/** Предмет (справа вверху) */
	item?: string;
	children: ReactNode;
}

/** Баннер с затемнённым фоном и панелью результатов в золотой рамке (BannerBoss в старом приложении). */
export function GameBanner({ title, subtitle, background, person, item, children }: GameBannerProps) {
	return (
		<section className={`${styles.banner} BannerBorder`}>
			<div className={styles.background} style={{ backgroundImage: `url(${PATH_IMAGES}${background})` }} />
			{person && <img className={styles.person} src={`${PATH_IMAGES}${person}`} alt="" />}
			{item && <img className={styles.item} src={`${PATH_IMAGES}${item}`} alt="" />}
			<div className={styles.content}>
				<div className={styles.title}>{title}</div>
				<div className={styles.subtitle}>{subtitle}</div>
				<div className={styles.actions}>{children}</div>
			</div>
		</section>
	);
}

/** Пергаментная карточка на панели результатов: значение и подпись (или номер слева). */
export function Parchment({ value, label, badge }: { value?: ReactNode; label: ReactNode; badge?: ReactNode }) {
	return (
		<div className={`${styles.parchment} ${badge !== undefined ? styles.withBadge : ''}`}>
			{badge !== undefined && <span className={styles.badge}>{badge}</span>}
			<span className={styles.parchmentBody}>
				{value !== undefined && <span className={styles.value}>{value}</span>}
				<span className={styles.label}>{label}</span>
			</span>
		</div>
	);
}
