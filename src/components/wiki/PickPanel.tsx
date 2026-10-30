import { useDeferredValue, useEffect, useMemo, useRef, useState, type ComponentProps, type PointerEvent, type ReactNode } from 'react';
import { Header, Search, filterFnForSelect } from '@vkontakte/vkui';
import { EmptyCell } from './Description';
import { NavCell } from './NavCell';
import { ReorderHandle } from './ReorderHandle';
import { WikiPanel } from './WikiPanel';
import styles from './PickPanel.module.css';
import { GroupLink } from './TileGroup';

/** Действие справа от заголовка группы («Изменить список», «Очистить список»). */
export interface GroupAction {
	label: string;
	onClick: () => void;
}

/** Группа в режиме изменения порядка: строки перетаскиваются (`from` и `to` — места в показанных строках группы). */
export interface Reorder {
	group: string;
	onReorder: (from: number, to: number) => void;
}

/**
 * Перетаскивание строк блока за ручку: строка идёт за указателем, соседи сдвигаются на её высоту, на месте отпускания порядок
 * меняется (`onReorder`). Сами узлы двигаются через transform, порядок в DOM меняет перерисовка после `onReorder`.
 */
function useRowDrag(onReorder: (from: number, to: number) => void) {
	const container = useRef<HTMLDivElement>(null);
	const finish = useRef(onReorder);
	useEffect(() => {
		finish.current = onReorder;
	});
	/** Снять слушатели текущего перетаскивания (страница закрылась, пока строку тянули) */
	const abort = useRef<(() => void) | null>(null);
	useEffect(() => () => abort.current?.(), []);
	const start = (place: number, event: PointerEvent<HTMLElement>) => {
		const rows = [...(container.current?.children ?? [])] as HTMLElement[];
		const node = rows[place];
		if (!node) return;
		event.preventDefault();
		const boxes = rows.map((row) => row.getBoundingClientRect());
		const height = boxes[place]!.height;
		const startY = event.clientY;
		let target = place;
		node.classList.add(styles.dragged!);
		const move = (next: globalThis.PointerEvent) => {
			// Строка не выходит за края блока
			const shift = Math.min(Math.max(next.clientY - startY, boxes[0]!.top - boxes[place]!.top), boxes[rows.length - 1]!.bottom - boxes[place]!.bottom);
			node.style.transform = `translateY(${shift}px)`;
			const middle = boxes[place]!.top + height / 2 + shift;
			target = Math.max(0, boxes.findIndex((box) => middle < box.bottom) === -1 ? rows.length - 1 : boxes.findIndex((box) => middle < box.bottom));
			rows.forEach((row, index) => {
				if (index === place) return;
				const moved = place < target && index > place && index <= target ? -height : place > target && index < place && index >= target ? height : 0;
				row.style.transition = 'transform 0.15s';
				row.style.transform = moved ? `translateY(${moved}px)` : '';
			});
		};
		/** Убрать слушатели и сдвиги строк */
		const release = () => {
			abort.current = null;
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', end);
			window.removeEventListener('pointercancel', end);
			node.classList.remove(styles.dragged!);
			rows.forEach((row) => {
				row.style.transform = '';
				row.style.transition = '';
			});
		};
		function end() {
			release();
			if (target !== place) finish.current(place, target);
		}
		abort.current = release;
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', end);
		window.addEventListener('pointercancel', end);
	};
	return { container, start };
}

/** Шапка страницы выбора (то, что возвращает sectionBase). */
type PanelHead = Pick<ComponentProps<typeof WikiPanel>, 'id' | 'parent' | 'title' | 'description' | 'avatar'>;

export interface PickGroup<T> {
	/** Заголовок группы; без него элементы идут без заголовка */
	title?: string;
	items: readonly T[];
}

export type PickRow<T> = { group: string } | { item: T };

interface PickPanelProps<T> {
	head: PanelHead;
	/** Панель калькулятора, в которую возвращает «назад» */
	back: string;
	/** Группы элементов; массив должен быть стабильным (константа или useMemo) */
	groups: readonly PickGroup<T>[];
	view: (item: T) => {
		title: string;
		subtitle?: string;
		image?: string;
		/** В начале строки, перед картинкой */
		before?: ReactNode;
		/** Метка справа, перед числом */
		badge?: ReactNode;
		after?: ReactNode;
		count?: ReactNode;
		countLabel?: ReactNode;
		/** Строка недоступна: серая, не нажимается */ disabled?: boolean;
	};
	isSelected: (item: T) => boolean;
	onPick: (item: T) => void;
	/** Постоянный ключ элемента: строка остаётся тем же узлом, когда список выше неё меняется (иначе узлы переиспользуются по номеру) */
	itemKey?: (item: T) => string | number;
	/** Действие справа от заголовка группы; `searching` — идёт поиск (списки отфильтрованы) */
	groupActions?: (title: string, searching: boolean) => readonly GroupAction[];
	/** Режим изменения порядка группы: её строки перетаскиваются, как в Cell из VKUI. Во время поиска не действует */
	reorder?: Reorder | null;
	/** Название элемента для поиска; без него поля поиска нет. Функция должна быть стабильной (вне компонента) */
	searchBy?: (item: T) => string;
	/** Текст пустого списка */
	empty?: string;
	/** Строка попала на экран (по ней можно подгружать данные только для видимых строк) */
	onVisible?: (item: T) => void;
	/** Строка ушла с экрана или убрана из списка: ненужная подгрузка можно отменить */
	onHidden?: (item: T) => void;
}

/** Строки списка: заголовки групп и элементы, подходящие под запрос; пустые группы пропускаются. */
export function pickRows<T>(groups: readonly PickGroup<T>[], query: string, searchBy?: (item: T) => string): PickRow<T>[] {
	const result: PickRow<T>[] = [];
	for (const group of groups) {
		const items = query && searchBy ? group.items.filter((item) => filterFnForSelect(query, { value: 0, label: searchBy(item) })) : group.items;
		if (!items.length) continue;
		if (group.title) result.push({ group: group.title });
		for (const item of items) result.push({ item });
	}
	return result;
}

/**
 * Сообщает, когда строка попала на экран (`onVisible`) и когда ушла с него (`onHidden`, в том числе если строку убрали из списка,
 * пока она была видна). Так данные подгружаются только для строк, которые видны сейчас, а при быстрой прокрутке ненужные
 * запросы отменяются. Без поддержки IntersectionObserver строка считается видимой сразу.
 */
export function VisibleRow({ onVisible, onHidden, children }: { onVisible: () => void; onHidden?: () => void; children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const show = useRef(onVisible);
	const hide = useRef(onHidden);
	useEffect(() => {
		show.current = onVisible;
		hide.current = onHidden;
	});
	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		if (typeof IntersectionObserver === 'undefined') return show.current();
		let visible = false;
		// Небольшой запас, чтобы строка, к которой уже подъезжает прокрутка, успевала подгрузиться
		const observer = new IntersectionObserver(
			(entries) => {
				const now = entries[entries.length - 1]!.isIntersecting;
				if (now && !visible) {
					visible = true;
					show.current();
				} else if (!now && visible) {
					visible = false;
					hide.current?.();
				}
			},
			{ rootMargin: '60px 0px' },
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			if (visible) hide.current?.();
		};
	}, []);
	return <div ref={ref}>{children}</div>;
}

/**
 * Страница выбора для калькулятора (SelectMimicry ведёт сюда): элементы по группам, поиск по названию,
 * отметка выбранного. Нажатие вызывает `onPick`; возврат в калькулятор — на стороне вызывающего.
 */
export function PickPanel<T>({
	head,
	back,
	groups,
	view,
	isSelected,
	onPick,
	searchBy,
	itemKey,
	groupActions,
	reorder,
	empty = 'Ничего не найдено',
	onVisible,
	onHidden,
}: PickPanelProps<T>) {
	const [query, setQuery] = useState('');
	const deferred = useDeferredValue(query);
	const rows = useMemo(() => pickRows(groups, deferred, searchBy), [groups, deferred, searchBy]);

	const searching = !!deferred;
	const drag = useRowDrag((from, to) => reorder?.onReorder(from, to));
	let group = '';
	const render = (row: PickRow<T>, index: number, place?: number) => {
		if ('group' in row) {
			group = row.group;
			const actions = groupActions?.(row.group, searching) ?? [];
			return (
				<Header
					key={`group-${index}`}
					size="s"
					className={styles.header}
					after={
						actions.length > 0 && (
							<span className={styles.headerActions}>
								{actions.map((action) => (
									<GroupLink key={action.label} onClick={action.onClick} chevron={false}>
										{action.label}
									</GroupLink>
								))}
							</span>
						)
					}
				>
					{row.group}
				</Header>
			);
		}
		const { disabled, ...props } = view(row.item);
		const key = itemKey ? `${group}|${itemKey(row.item)}` : index;
		const cell = (
			<NavCell
				key={key}
				className={`${styles.row} ${disabled ? styles.disabled : ''}`}
				chevron={false}
				selected={isSelected(row.item)}
				{...props}
				before={place === undefined ? props.before : <ReorderHandle onStart={(event) => drag.start(place, event)} />}
				// В режиме изменения порядка строка босса не открывается
				onClick={disabled || place !== undefined ? undefined : () => onPick(row.item)}
			/>
		);
		return onVisible && !disabled ? (
			<VisibleRow key={key} onVisible={() => onVisible(row.item)} onHidden={onHidden ? () => onHidden(row.item) : undefined}>
				{cell}
			</VisibleRow>
		) : (
			cell
		);
	};

	/** Строки по порядку; строки группы, чей порядок меняется, лежат в одном блоке (перетаскивание двигает соседей внутри него) */
	const renderRows = () => {
		const nodes: ReactNode[] = [];
		for (let index = 0; index < rows.length;) {
			const row = rows[index]!;
			if ('group' in row || !reorder || searching || group !== reorder.group) {
				nodes.push(render(row, index++));
				continue;
			}
			const block: ReactNode[] = [];
			for (; index < rows.length && !('group' in rows[index]!); index++) block.push(<div key={block.length}>{render(rows[index]!, index, block.length)}</div>);
			nodes.push(
				<div key={`drag-${group}`} ref={drag.container}>
					{block}
				</div>,
			);
		}
		return nodes;
	};

	return (
		<WikiPanel
			{...head}
			back={back}
			top={searchBy && <Search noPadding after={null} className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию" />}
		>
			{rows.length ? renderRows() : <EmptyCell>{empty}</EmptyCell>}
		</WikiPanel>
	);
}
