import type { ReactNode } from 'react';
import { HorizontalScroll } from '@vkontakte/vkui';
import styles from './StatCards.module.css';

export interface StatCardData {
	/** Значение крупно: «858 предметов» */
	value: ReactNode;
	/** Подпись снизу: «всего» */
	label: ReactNode;
	icon: ReactNode;
	/** Цвет значка и его круглой подложки */
	color: string;
}

/** Карточка-сводка (beautifulCard в старом приложении). */
export function StatCard({ card }: { card: StatCardData }) {
	return (
		<div className={styles.stat}>
			<span className={styles.statValue}>{card.value}</span>
			<span className={styles.statLabel}>{card.label}</span>
			<span className={styles.statIcon} style={{ ['--fill' as string]: card.color }}>
				{card.icon}
			</span>
		</div>
	);
}

/**
 * Карточки-сводки в ленту по три. По умолчанию — на светлом градиенте (белые карточки),
 * plain — без градиента, карточки на сером фоне.
 */
export function StatCards({ cards, plain = false }: { cards: readonly StatCardData[]; plain?: boolean }) {
	return (
		<div className={plain ? styles.plain : styles.gradient}>
			<HorizontalScroll className={styles.statsScroll} arrowSize="m">
				<div className={styles.statsIn}>
					{cards.map((card, index) => (
						<StatCard key={index} card={card} />
					))}
				</div>
			</HorizontalScroll>
		</div>
	);
}

/** Карточки-сводки по две в ряд (CardGrid size="m"). */
export function StatGrid({ cards }: { cards: readonly StatCardData[] }) {
	return (
		<div className={styles.statGrid}>
			{cards.map((card, index) => (
				<StatCard key={index} card={card} />
			))}
		</div>
	);
}
