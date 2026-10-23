import type Bosses from '../../data/bosses.json';
import { Divider } from '../../components/Divider';
import { CardGrid, DescriptionCard, DescriptionCell, ItemList, LinkCell, imageUrl } from '../../components/wiki/Description';
import { getTime, numberForm, numberSpaces } from '../../lib/format';
import type { ItemRef } from '../../lib/items';
import { findRegion } from './map';

export type Boss = (typeof Bosses)[number] & { items: ItemRef[]; rewards: { exp: number; m1: number; m2: number; m6?: number } };

/** Фон картинки босса: сам босс поверх фона локации. */
export const bossBackground = (boss: { image: string; background: string }) =>
	`url(${imageUrl(boss.image)}) top left 25%/cover no-repeat, url(${imageUrl(boss.background)}) center/cover`;

export const BOSSES_DESCRIPTIONS = {
	'bosses.boss': (data: Boss) => {
		const location = findRegion(data.region);
		const { m1, m2, m6, exp } = data.rewards;
		return {
			head: { title: data.name, description: 'Боссы — Список боссов', background: bossBackground(data) },
			body: (
				<>
					<DescriptionCell label="Описание" text={data.description} />
					<DescriptionCell label="Характеристики" text={`${numberSpaces(data.hp)} здоровья\n${numberSpaces(data.dmg)} атаки`} />
					{data.energy !== 0 && <DescriptionCell label="Стоимость нападения" text={`${data.energy} ${numberForm(data.energy, ['энергия', 'энергии', 'энергии'])}`} />}
					<DescriptionCell label="Лимит убийств" text={`${data.tries} ${numberForm(data.tries, ['попытка', 'попытки', 'попыток'])}, ${getTime(data.time)}`} />
					<DescriptionCell label="Тип боя" text={data.type === 1 ? 'Одиночный бой' : 'Общий бой'} />
					{data.region !== 0 && location && (
						<>
							<Divider />
							<DescriptionCell label="Местоположение" text={`${location.title} [${location.id}]`} />
							<DescriptionCell label="Уровень нападения" text={`${(typeof location.lvl === 'number' && location.lvl) || 0} уровень`} />
						</>
					)}
					{(m1 !== 0 || m2 !== 0 || !!m6 || exp !== 0) && (
						<>
							<Divider />
							<CardGrid>
								{m1 !== 0 && <DescriptionCard label={`${numberSpaces(m1)} серебра`} text="Награда за победу" avatar="bot/raids/12.png" />}
								{m2 !== 0 && <DescriptionCard label={`${numberSpaces(m2)} золота`} text="Награда за победу" avatar="bot/raids/11.png" />}
								{!!m6 && <DescriptionCard label={`${numberSpaces(m6)} турмалинов`} text="Награда за победу" avatar="bot/raids/21.png" />}
								{exp !== 0 && <DescriptionCard label={`${numberSpaces(exp)} опыта`} text="Награда за победу" avatar="bot/raids/10.png" />}
							</CardGrid>
						</>
					)}
					<Divider />
					<ItemList items={data.items} />
					<Divider />
					<LinkCell href={imageUrl(data.image)}>Изображение босса</LinkCell>
					<LinkCell href={imageUrl(data.background)}>Изображение фона</LinkCell>
				</>
			),
		};
	},
};
