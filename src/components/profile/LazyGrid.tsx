import type { ReactNode } from 'react';
import { EmptyCell } from '../wiki/Description';
import { ItemCardGrid } from '../wiki/ItemCard';
import { ScrollBox } from './ScrollBox';
import { useLazyCount } from './useLazyCount';
import styles from './LazyGrid.module.css';

interface LazyGridProps<T> {
	items: readonly T[];
	/** Сколько карточек добавляется за раз */
	step: number;
	/** Высота прокрутки на ПК */
	height: number;
	render: (item: T, index: number) => ReactNode;
	/** Смена ключа (вкладка, фильтр) — список с начала и прокрутка наверх */
	resetKey: unknown;
	/** По три карточки в ряд на ПК и по две на телефоне (иначе две и одна) */
	wide?: boolean;
}

/**
 * Список карточек, который догружается порциями по мере прокрутки (InfiniteScroll в старом приложении).
 * На ПК список прокручивается внутри блока заданной высоты, на телефоне — вместе со страницей.
 */
export function LazyGrid<T>({ items, step, height, render, resetKey, wide = false }: LazyGridProps<T>) {
	const { count, scroll, sentinel, hasMore } = useLazyCount(items.length, step, resetKey);
	if (!items.length) return <EmptyCell />;
	return (
		<ScrollBox ref={scroll} height={height}>
			<ItemCardGrid wide={wide}>{items.slice(0, count).map(render)}</ItemCardGrid>
			{hasMore && <div ref={sentinel} className={styles.sentinel} />}
		</ScrollBox>
	);
}
