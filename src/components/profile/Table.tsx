import type { CSSProperties, ReactNode } from 'react';
import { Tappable } from '@vkontakte/vkui';
import { Icon28ChevronLeftOutline, Icon28Chevrons2LeftOutline } from '@vkontakte/icons';
import { clickable } from '../../lib/clickable';
import { numberSpaces } from '../../lib/format';
import styles from './Table.module.css';

export interface TableColumn {
	title: ReactNode;
	/** Прижать к правому краю */
	right?: boolean;
}

interface TableRowProps {
	/** Сетка колонок (grid-template-columns и отступы) */
	grid: CSSProperties;
	/** Номер слева серым */
	count?: ReactNode;
	avatar?: ReactNode;
	columns: TableColumn[];
	href?: string;
	onClick?: () => void;
}

/** Строка таблицы: номер, аватар и колонки (TableCell в старом приложении). */
export function TableRow({ grid, count, avatar, columns, href, onClick }: TableRowProps) {
	const content = (
		<div className={styles.content} style={grid}>
			{count !== undefined && (
				<div className={`${styles.cell} ${styles.count}`}>
					<span>{count}</span>
				</div>
			)}
			{avatar && <div className={`${styles.cell} ${styles.avatar}`}>{avatar}</div>}
			{columns.map((column, index) => (
				<div key={index} className={styles.cell} style={{ justifyContent: column.right ? 'flex-end' : 'space-between' }}>
					<span>{column.title}</span>
				</div>
			))}
		</div>
	);
	if (href) {
		return (
			<Tappable Component="a" href={href} target="_blank" className={styles.row}>
				{content}
			</Tappable>
		);
	}
	return (
		<Tappable className={styles.row} onClick={onClick} disabled={!onClick}>
			{content}
		</Tappable>
	);
}

/** Строка без нажатия (заголовок таблицы, скелетон). */
export function TableStatic({ grid, children }: { grid?: CSSProperties; children: ReactNode }) {
	return (
		<div className={styles.row}>
			<div className={styles.content} style={grid}>
				{children}
			</div>
		</div>
	);
}

/** Ячейка заголовка: серый текст, по нажатию — сортировка. */
export function TableHead({ children, right, onClick, sort }: { children: ReactNode; right?: boolean; onClick?: () => void; sort?: ReactNode }) {
	return (
		<div className={`${styles.cell} ${styles.head}`} style={{ justifyContent: right ? 'flex-end' : undefined, cursor: onClick ? 'pointer' : undefined }} {...clickable(onClick)}>
			<span>{children}</span>
			{sort}
		</div>
	);
}

/** «Показана N страница из M» и кнопки листания. */
export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
	return (
		<div className={styles.row}>
			<div className={styles.pager}>
				<span className={styles.pagerText}>
					Показана {numberSpaces(page + 1)} страница из {numberSpaces(pages)}
				</span>
				<span className={styles.pagerButtons}>
					<PagerButton disabled={page <= 0} onClick={() => onChange(0)}>
						<Icon28Chevrons2LeftOutline />
					</PagerButton>
					<PagerButton disabled={page <= 0} onClick={() => onChange(page - 1)}>
						<Icon28ChevronLeftOutline />
					</PagerButton>
					<PagerButton disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
						<Icon28ChevronLeftOutline style={{ transform: 'rotate(180deg)' }} />
					</PagerButton>
					<PagerButton disabled={page >= pages - 1} onClick={() => onChange(pages - 1)}>
						<Icon28Chevrons2LeftOutline style={{ transform: 'rotate(180deg)' }} />
					</PagerButton>
				</span>
			</div>
		</div>
	);
}

function PagerButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) {
	return (
		<Tappable className={styles.pagerButton} disabled={disabled} onClick={onClick}>
			{children}
		</Tappable>
	);
}
