import type { ReactNode } from 'react';
import { Spinner, Tappable } from '@vkontakte/vkui';
import { Icon24CubeBoxOutline, Icon24TshirtOutline, Icon28CancelCircleOutline, Icon28CheckCircleOutline } from '@vkontakte/icons';
import { useDeepLink } from '../../app/deepLink';
import { itemAt, type ItemRef } from '../../lib/items';
import { useOwned } from '../../profile/owned';
import { openModal } from '../../store/modal';
import { BorderedImage } from '../BorderedImage';
import { useImgLoaded } from '../Preload';
import styles from './ItemCard.module.css';

interface ItemCardProps {
	/** Индекс предмета в каталоге */
	index: number;
	/** Вид награды: определяет иконку справа */
	kind?: 'item' | 'collection';
	/** Подпись вместо описания предмета */
	caption?: ReactNode;
	/** Своё действие по нажатию (по умолчанию — окно предмета) */
	onClick?: () => void;
	deepLink?: string;
	/** Строка под подписью (камни инкрустации) */
	bottom?: ReactNode;
	/** Без значка справа (в старом приложении — карточка с подписью) */
	plain?: boolean;
	/** Карточка выбора на подложке с рамкой (Card__Item--checkbox); true — выбрана */
	selected?: boolean;
	/** Своё содержимое справа (кнопка); подпись тогда переносится на несколько строк */
	after?: ReactNode;
	/** Содержимое справа без кнопки (цена, статус): карточка при этом остаётся нажимаемой */
	end?: ReactNode;
	/** Карточку нельзя нажать (без подсветки и действия) */
	disabled?: boolean;
}

/** Компактная карточка предмета (в старом приложении — getItemPreview). */
export function ItemCard({ index, kind, caption, onClick, deepLink, bottom, plain = false, selected, after, end, disabled }: ItemCardProps) {
	const item = itemAt(index);
	const open =
		onClick ??
		(() => {
			const ref: ItemRef = { id: index, item: kind === 'item', collection: kind === 'collection' };
			openModal('item', { ref, link: deepLink }, 'item');
		});
	useDeepLink(deepLink, open);
	const { loaded, imgProps } = useImgLoaded();
	const { isDonut, owns } = useOwned();
	if (!item) return null;
	const classes = [
		styles.card,
		selected !== undefined ? styles.selectable : '',
		selected ? styles.selected : '',
		after || disabled ? styles.withAction : '',
		bottom ? styles.withBottom : '',
	]
		.filter(Boolean)
		.join(' ');
	return (
		<Tappable className={classes} onClick={after || disabled ? undefined : open} hasHover={!after && !disabled} hasActive={!after && !disabled}>
			<BorderedImage src={item.icon} className={styles.image} imgProps={imgProps}>
				{!loaded && <Spinner size="m" className={styles.preload} />}
			</BorderedImage>
			<span className={styles.body}>
				<span className={styles.title}>{item.title}</span>
				<span className={styles.caption}>{caption ?? item.description}</span>
				{bottom && <span className={styles.bottom}>{bottom}</span>}
			</span>
			{after ? (
				<span className={styles.action}>{after}</span>
			) : end ? (
				<span className={styles.end}>{end}</span>
			) : plain || selected !== undefined ? null : isDonut ? (
				// С подпиской вместо вида награды — есть ли предмет у персонажа
				<span className={styles.after}>
					{owns(item.id) ? (
						<Icon28CheckCircleOutline width={24} height={24} style={{ color: 'var(--dynamic_green)' }} />
					) : (
						<Icon28CancelCircleOutline width={24} height={24} style={{ color: 'var(--destructive)' }} />
					)}
				</span>
			) : (
				kind && <span className={styles.after}>{kind === 'item' ? <Icon24TshirtOutline /> : <Icon24CubeBoxOutline />}</span>
			)}
		</Tappable>
	);
}

/** Сетка карточек предметов: по две в ряд на десктопе, по одной на телефоне; в профиле — по три и по две. */
export function ItemCardGrid({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
	return <div className={`${styles.grid} ${wide ? styles.wide : ''}`}>{children}</div>;
}

/** Карточки наград списком: вид награды (предмет, коллекция) берётся из подсказки записи. */
export function RewardCards({ list }: { list: readonly { id: number; tooltip: string }[] }) {
	return (
		<ItemCardGrid>
			{list.map((entry, index) => (
				<ItemCard
					key={index}
					index={entry.id}
					kind={entry.tooltip === 'Предмет' ? 'item' : entry.tooltip === 'Коллекция' ? 'collection' : undefined}
					deepLink={String(index + 1)}
				/>
			))}
		</ItemCardGrid>
	);
}
