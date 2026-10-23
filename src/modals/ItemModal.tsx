import { Icon24StickerOutline } from '@vkontakte/icons';
import { Divider } from '../components/Divider';
import { IconCell, LinkCell, imageUrl } from '../components/wiki/Description';
import { ItemCell } from '../components/wiki/ItemCell';
import { itemAt, type ItemRef } from '../lib/items';
import { scrollSources } from './scrollSources';
import styles from './ItemModal.module.css';

/** Окно предмета: полная карточка, где получить заточку, ссылки на картинки. */
export function ItemModalBody({ data }: { data: ItemRef }) {
	const item = itemAt(data.id);
	if (!item) return null;
	const sources = scrollSources(data.id);
	return (
		<>
			<div className={styles.cell}>
				<ItemCell data={data} full />
			</div>
			<Divider />
			<IconCell icon={<Icon24StickerOutline />} title={sources.length ? sources.join(', ') : 'Нет информации'} subtitle="Получение заточки" />
			<Divider />
			<LinkCell href={imageUrl(`items/${item.id}.png`)}>Изображение иконки</LinkCell>
			<LinkCell href={imageUrl(`items/${item.id}b.png`)}>Изображение предмета</LinkCell>
			{item.type === 2 && <LinkCell href={imageUrl(`items/${item.id}e.png`)}>Изображение улучшенного предмета</LinkCell>}
		</>
	);
}
