import type { ReactNode } from 'react';
import { Icon16Add, Icon16Minus } from '@vkontakte/icons';
import { HorizontalScroll } from '@vkontakte/vkui';
import { useIsDesktop } from '../../app/layout';
import { numberSpaces } from '../../lib/format';
import { Divider } from '../Divider';
import { Skeleton } from '../Skeleton';
import styles from './Counters.module.css';

/** Ряд ячеек футера: в одну строку, листается по горизонтали, ячейки прижаты к левому краю. */
export function Counters({ children }: { children: ReactNode }) {
	return (
		<HorizontalScroll className={styles.scroll} arrowSize="m">
			<div className={styles.counters}>{children}</div>
		</HorizontalScroll>
	);
}

/**
 * Ячейка футера: сверху сколько сейчас, снизу на сколько изменится (плюс зелёным, минус красным); без изменения вторая строка пуста.
 * `now` — число (с пробелами между разрядами), готовая строка или undefined (неизвестно, показывается тире); `suffix` стоит после чисел.
 */
export function Counter({ title, now, change = 0, suffix }: { title: string; now: number | string | undefined; change?: number; suffix?: ReactNode }) {
	return (
		<div className={styles.counter}>
			<div className={styles.counterTitle}>{title}</div>
			<div className={styles.counterContent}>
				<div className={styles.counterText}>
					{now === undefined ? '—' : typeof now === 'number' ? numberSpaces(now) : now} {now !== undefined && suffix}
				</div>
				<div className={`${styles.counterText} ${change > 0 ? styles.up : change < 0 ? styles.down : ''}`}>
					{change === 0 ? (
						' '
					) : (
						<>
							{change > 0 ? <Icon16Add /> : <Icon16Minus />} {numberSpaces(Math.abs(change))} {suffix}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

/** Заглушка загрузки футера выбранного предмета: карточка, разделитель и ряд ячеек той же высоты. */
export function FooterSkeleton({ cell = { count: 4, width: 140, height: 56 } }: { cell?: { count: number; width: number; height: number } }) {
	const isDesktop = useIsDesktop();
	return (
		<>
			<Skeleton height={68} style={isDesktop ? undefined : { margin: '0 8px', width: 'auto' }} />
			{!isDesktop && <Skeleton height={36} style={{ margin: '8px 8px 0', width: 'auto' }} />}
			<Divider />
			<Counters>
				{Array.from({ length: cell.count }, (_, index) => (
					<Skeleton key={index} height={cell.height} width={cell.width} />
				))}
			</Counters>
		</>
	);
}
