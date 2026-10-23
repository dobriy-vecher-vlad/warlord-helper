import { useDeferredValue, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Header, Search, filterFnForSelect } from '@vkontakte/vkui';
import { EmptyCell } from './Description';
import { NavCell } from './NavCell';
import { WikiPanel } from './WikiPanel';
import styles from './PickPanel.module.css';

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
		after?: ReactNode;
		count?: ReactNode;
		countLabel?: ReactNode;
		/** Строка недоступна: серая, не нажимается */ disabled?: boolean;
	};
	isSelected: (item: T) => boolean;
	onPick: (item: T) => void;
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
export function PickPanel<T>({ head, back, groups, view, isSelected, onPick, searchBy, empty = 'Ничего не найдено', onVisible, onHidden }: PickPanelProps<T>) {
	const [query, setQuery] = useState('');
	const deferred = useDeferredValue(query);
	const rows = useMemo(() => pickRows(groups, deferred, searchBy), [groups, deferred, searchBy]);

	const render = (row: PickRow<T>, index: number) => {
		if ('group' in row) {
			return (
				<Header key={`group-${index}`} size="s">
					{row.group}
				</Header>
			);
		}
		const { disabled, ...props } = view(row.item);
		const cell = (
			<NavCell
				key={index}
				className={`${styles.row} ${disabled ? styles.disabled : ''}`}
				chevron={false}
				selected={isSelected(row.item)}
				{...props}
				onClick={disabled ? undefined : () => onPick(row.item)}
			/>
		);
		return onVisible && !disabled ? (
			<VisibleRow key={index} onVisible={() => onVisible(row.item)} onHidden={onHidden ? () => onHidden(row.item) : undefined}>
				{cell}
			</VisibleRow>
		) : (
			cell
		);
	};

	return (
		<WikiPanel
			{...head}
			back={back}
			top={searchBy && <Search noPadding after={null} className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию" />}
		>
			{rows.length ? rows.map(render) : <EmptyCell>{empty}</EmptyCell>}
		</WikiPanel>
	);
}
