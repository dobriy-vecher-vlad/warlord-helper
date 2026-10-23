import type { ReactNode } from 'react';
import { Cell } from '@vkontakte/vkui';
import { Icon24CheckCircleOutline, Icon24CubeBoxOutline, Icon24StickerOutline, Icon24TshirtOutline } from '@vkontakte/icons';
import type { ItemFilter } from '../../lib/items';
import { useOwned } from '../../profile/owned';
import { setItemFilter, useItemFilter } from '../../store/itemFilter';
import styles from './ItemFilterBar.module.css';

const OPTIONS: { key: keyof ItemFilter; title: string; icon: ReactNode; color: string }[] = [
	{ key: 'item', title: 'Предмет', icon: <Icon24TshirtOutline />, color: 'var(--accent)' },
	{ key: 'scroll', title: 'Заточка', icon: <Icon24StickerOutline />, color: 'var(--accent)' },
	{ key: 'collection', title: 'Коллекция', icon: <Icon24CubeBoxOutline />, color: 'var(--accent)' },
	{ key: 'personal', title: 'Личная коллекция', icon: <Icon24CubeBoxOutline />, color: 'var(--destructive)' },
];

/** С подпиской: показывать предметы, которые уже есть у персонажа. */
const STOCK = { key: 'stock' as const, title: 'Наличие предмета', icon: <Icon24CheckCircleOutline />, color: 'var(--dynamic_green)' };

export interface FilterCardOption {
	key: string;
	title: ReactNode;
	icon: ReactNode;
	/** Цвет значка, когда переключатель включён */
	color: string;
	checked: boolean;
}

/** Карточки-переключатели по две в ряд (Cell mode="selectable" в старом приложении). */
export function FilterCards({ options, onToggle }: { options: readonly FilterCardOption[]; onToggle: (key: string, checked: boolean) => void }) {
	return (
		<div className={styles.grid}>
			{options.map(({ key, title, icon, color, checked }) => (
				<Cell
					key={key}
					className={styles.option}
					mode="selectable"
					checked={checked}
					subtitle="Отображение в списке"
					after={<span style={{ color: checked ? color : 'var(--icon_secondary)' }}>{icon}</span>}
					onChange={() => onToggle(key, !checked)}
				>
					{title}
				</Cell>
			))}
		</div>
	);
}

/** Переключатели видов наград (в старом приложении — SortableItems). */
export function ItemFilterBar() {
	const filter = useItemFilter();
	const { isDonut } = useOwned();
	const options = (isDonut ? [...OPTIONS, STOCK] : OPTIONS).map((option) => ({ ...option, checked: filter[option.key] }));
	return <FilterCards options={options} onToggle={(key, checked) => setItemFilter(key as keyof ItemFilter, checked)} />;
}
