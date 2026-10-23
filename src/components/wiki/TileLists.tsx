import type { ReactNode } from 'react';
import { Tile, TileGrid, TileScroll, type TileProps } from './Tiles';
import { TileGroup, groupLink } from './TileGroup';

/** Вид плитки по записи списка; нажатие и ссылку добавляет список. */
export type TileView = Omit<TileProps, 'onClick' | 'deepLink'>;

interface TileCollectionProps<T> {
	list: readonly T[];
	describe: (entry: T) => TileView;
	/** Открыть окно записи; `link` — значение `modal=` в ссылке на него */
	open: (entry: T, link: string) => void;
	/** По 4 в ряд на десктопе (иначе по 3) */
	wide?: boolean;
	/** Сколько ссылок занято предыдущими списками на странице (номера идут подряд) */
	offset?: number;
}

/** Сетка плиток по списку: ссылка плитки — её номер в списке (с 1). */
export function TileCollection<T>({ list, describe, open, wide = false, offset = 0 }: TileCollectionProps<T>) {
	return (
		<TileGrid wide={wide}>
			{list.map((entry, index) => {
				const link = String(offset + index + 1);
				return <Tile key={index} {...describe(entry)} onClick={() => open(entry, link)} deepLink={link} />;
			})}
		</TileGrid>
	);
}

interface TileGroupsProps<G, T> {
	groups: readonly G[];
	title: (group: G) => string;
	items: (group: G) => readonly T[];
	describe: (entry: T) => TileView;
	open: (entry: T, link: string) => void;
	/** Красный счётчик записей рядом с заголовком */
	counted?: boolean;
	/** Ссылка справа в заголовке группы */
	after?: (group: G, index: number) => ReactNode;
}

/** Группы плиток с заголовком и горизонтальной лентой; ссылка плитки — номер группы и номер записи (см. groupLink). */
export function TileGroups<G, T>({ groups, title, items, describe, open, counted = false, after }: TileGroupsProps<G, T>) {
	return (
		<>
			{groups.map((group, x) => {
				const list = items(group);
				return (
					<TileGroup key={x} first={x === 0} title={title(group)} count={counted ? list.length : undefined} after={after?.(group, x)}>
						<TileScroll>
							{list.map((entry, y) => {
								const link = groupLink(x, y);
								return <Tile key={y} {...describe(entry)} onClick={() => open(entry, link)} deepLink={link} />;
							})}
						</TileScroll>
					</TileGroup>
				);
			})}
		</>
	);
}
