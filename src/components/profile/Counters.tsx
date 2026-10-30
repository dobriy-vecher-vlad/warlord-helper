import type { ReactNode } from 'react';
import { Icon16Add, Icon16Minus } from '@vkontakte/icons';
import { HorizontalScroll } from '@vkontakte/vkui';
import { useIsDesktop } from '../../app/layout';
import { numberSpaces } from '../../lib/format';
import { Divider } from '../Divider';
import { Skeleton } from '../Skeleton';
import styles from './Counters.module.css';

/** Высота ячейки сетки и зазор между ячейками (px): ячейка из двух строк по 20px и полей по 8px, зазор как у ряда. */
const GRID_CELL = 56;
const GRID_GAP = 6;

/**
 * Высота сетки `Counters grid`: не меньше двух рядов (на ПК по три ячейки, на телефоне по две), даже если ячеек меньше, поэтому по ней
 * считается заглушка. Ячеек больше четырёх на телефоне сетка растёт ещё на ряд.
 */
export const COUNTERS_GRID_HEIGHT = 2 * GRID_CELL + GRID_GAP;

/**
 * Ряд ячеек футера: в одну строку, листается по горизонтали, ячейки прижаты к левому краю.
 * `grid` — сеткой в три колонки равной ширины (на телефоне в две; ячеек не больше шести), без прокрутки.
 */
export function Counters({ children, grid = false }: { children: ReactNode; grid?: boolean }) {
	if (grid) {
		return (
			<div className={styles.scroll}>
				<div className={`${styles.counters} ${styles.grid}`} style={{ minHeight: COUNTERS_GRID_HEIGHT }}>
					{children}
				</div>
			</div>
		);
	}
	return (
		<HorizontalScroll className={styles.scroll} arrowSize="m">
			<div className={styles.counters}>{children}</div>
		</HorizontalScroll>
	);
}

/**
 * Ячейка футера: сверху сколько сейчас, снизу на сколько изменится (плюс зелёным, минус красным); без изменения вторая строка пуста.
 * `tight` — суффикс вплотную к числу («70%» вместо «70 %»).
 * `now` — число (с пробелами между разрядами), готовая строка или undefined (неизвестно, показывается тире); `suffix` стоит после чисел.
 */
export function Counter({
	title,
	now,
	change = 0,
	suffix,
	tight = false,
}: {
	title: string;
	now: number | string | undefined;
	change?: number;
	suffix?: ReactNode;
	tight?: boolean;
}) {
	return (
		<div className={styles.counter}>
			<div className={styles.counterTitle}>{title}</div>
			<div className={styles.counterContent}>
				<div className={styles.counterText}>
					{now === undefined ? '—' : typeof now === 'number' ? numberSpaces(now) : now}
					{tight ? '' : ' '}
					{now !== undefined && suffix}
				</div>
				<div className={`${styles.counterText} ${change > 0 ? styles.up : change < 0 ? styles.down : ''}`}>
					{change === 0 ? (
						' '
					) : (
						<>
							{change > 0 ? <Icon16Add /> : <Icon16Minus />} {numberSpaces(Math.abs(change))}
							{tight ? '' : ' '}
							{suffix}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

/** Заглушка загрузки футера выбранного предмета: карточка, разделитель и ряд ячеек той же высоты; `grid` — ячейки сеткой, как у `Counters grid` (по ширине колонки). */
export function FooterSkeleton({ cell = { count: 4, width: 140, height: 56 }, grid = false }: { cell?: { count: number; width: number; height: number }; grid?: boolean }) {
	const isDesktop = useIsDesktop();
	return (
		<>
			<Skeleton height={68} style={isDesktop ? undefined : { margin: '0 8px', width: 'auto' }} />
			{!isDesktop && <Skeleton height={36} style={{ margin: '8px 8px 0', width: 'auto' }} />}
			<Divider />
			<Counters grid={grid}>
				{Array.from({ length: cell.count }, (_, index) => (
					<Skeleton key={index} height={cell.height} width={grid ? '100%' : cell.width} />
				))}
			</Counters>
		</>
	);
}
