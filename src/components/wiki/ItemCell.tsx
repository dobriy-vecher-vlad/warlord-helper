import { Tappable } from '@vkontakte/vkui';
import { Icon24CheckCircleOutline, Icon24CubeBoxOutline, Icon24InfoCircleOutline, Icon24StickerOutline, Icon24TshirtOutline } from '@vkontakte/icons';
import { PATH_IMAGES } from '../../config';
import { BorderedImage } from '../BorderedImage';
import { largeImage } from '../../lib/largeImage';
import { numberSpaces } from '../../lib/format';
import { itemAt, tooltipText, type ItemRef } from '../../lib/items';
import { useOwned } from '../../profile/owned';
import { useItemFilter } from '../../store/itemFilter';
import { openModal } from '../../store/modal';
import styles from './ItemCell.module.css';

interface ItemCellProps {
	data: ItemRef;
	/** Полный вид (в окне предмета): описание вместо подсказки и без перехода по нажатию */
	full?: boolean;
}

/** Карточка предмета: картинка, урон, здоровье, цена и вид награды. */
export function ItemCell({ data, full = false }: ItemCellProps) {
	const item = itemAt(data.id);
	const filter = useItemFilter();
	const { isDonut, owns } = useOwned();
	if (!item) return null;
	// С подпиской: зелёная галочка, если предмет или коллекция уже есть у персонажа
	const owned = isDonut && filter.stock && ((filter.item && data.item) || (filter.collection && data.collection)) && owns(item.id);
	const tooltip = full ? item.description : tooltipText(data);

	const types = full ? (
		item.fragments.length > 0 ? (
			<Icon24CubeBoxOutline />
		) : (
			<Icon24TshirtOutline />
		)
	) : (
		<>
			{owned && <Icon24CheckCircleOutline style={{ color: 'var(--dynamic_green)' }} />}
			{filter.item && data.item && <Icon24TshirtOutline />}
			{filter.collection && data.collection && !data.personal && <Icon24CubeBoxOutline />}
			{filter.personal && data.personal && <Icon24CubeBoxOutline style={{ color: 'var(--destructive)' }} />}
			{filter.scroll && data.scroll && <Icon24StickerOutline />}
		</>
	);

	const content = (
		<>
			<div className={styles.main}>
				<BorderedImage src={largeImage(item.icon)} className={styles.avatar} />
				<div className={styles.body}>
					<div className={styles.title}>{item.title}</div>
					<div className={styles.stats}>
						<span>DMG</span>
						<span>{numberSpaces(item.dmg)}</span>
						<span>HP</span>
						<span>{numberSpaces(item.hp * 15)}</span>
					</div>
				</div>
				<div className={styles.prices}>
					{item.prices.map(([currency, price]) => (
						<div key={currency} className={styles.price}>
							{numberSpaces(price)}
							<span style={{ backgroundImage: `url(${PATH_IMAGES}currency/all/m${currency}.png)` }} />
						</div>
					))}
				</div>
			</div>
			<div className={`${styles.tooltip} ${full || tooltip ? styles.tooltipFull : ''}`}>
				{(full || tooltip) && (
					<>
						<Icon24InfoCircleOutline className={styles.tooltipIcon} />
						<span className={styles.tooltipText}>{tooltip}</span>
					</>
				)}
				<span className={styles.types}>{types}</span>
			</div>
		</>
	);

	if (full) return <div className={`${styles.cell} ${styles.full}`}>{content}</div>;
	return (
		<Tappable className={styles.cell} onClick={() => openModal('item', { ref: data }, 'item')}>
			{content}
		</Tappable>
	);
}
