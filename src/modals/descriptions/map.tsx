import Bosses from '../../data/bosses.json';
import { Divider } from '../../components/Divider';
import dataMap from '../../data/map.json';
import { CardGrid, DescriptionCard, DescriptionCell, ItemList, LinkCell, imageUrl } from '../../components/wiki/Description';
import { getTime, numberForm, numberSpaces } from '../../lib/format';
import type { ItemRef } from '../../lib/items';

export type MapBuild = (typeof dataMap.builds)[number];
export type MapChest = (typeof dataMap.crusade.chests)[number];
export type MapPoint = (typeof dataMap.crusade.points)[number] & { pet?: string; chests?: string };
export type MapRaidLevel = (typeof dataMap.raids)[number]['levels'][number];
export type MapFloor = (typeof dataMap.adventures)[number]['floors'][number];
export type MapScrolls = { title: string; items: ItemRef[] };
/** Район карты. `lvl` и `boss` равны false, если требования нет; `boss` — индекс в bosses.json. */
export interface MapRegion {
	id: number;
	title: string;
	description: string;
	lvl: number | boolean;
	boss: number | boolean;
	bosses: number[];
	builds: number[];
	icon: string;
}
export type MapCapture = (typeof dataMap.capture)[number];

/** Группы районов карты (по землям). */
export const REGION_GROUPS = dataMap.regions as { title: string; items: MapRegion[] }[];

/** Район карты по номеру. */
export const LOCATIONS: readonly MapRegion[] = REGION_GROUPS.flatMap((group) => group.items);

export const findRegion = (id: number) => LOCATIONS.find((location) => location.id === id);

/** Иконки сундуков рейда по порядку: бочка, старый, железный, сапфировый, древний, эпический. */
const RAID_CHEST_ICONS = ['bot/raids/108.png', 'bot/raids/92.png', 'bot/raids/94.png', 'bot/raids/96.png', 'bot/raids/98.png', 'bot/raids/100.png'];

function RegionLevel({ region, label }: { region: number; label: string }) {
	const location = findRegion(region);
	if (!region || !location) return null;
	return (
		<>
			<Divider />
			<DescriptionCell label={label} text={`${location.title} [${location.id}]`} />
			<DescriptionCell label="Уровень района" text={`${(typeof location.lvl === 'number' && location.lvl) || 0} уровень`} />
		</>
	);
}

export const MAP_DESCRIPTIONS = {
	'map.build': (data: MapBuild) => ({
		head: { title: data.title, description: 'Карта — Обыск', avatar: data.image },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Ресурс для улучшения" text={`${data.item} с босса ${data.from}`} />
				<DescriptionCell label="Задержка перед обыском" text={getTime(data.time)} />
				<RegionLevel region={data.region} label="Местоположение" />
				<Divider />
				<CardGrid>
					{data.levels.map(([count = 0, resources = 0], index) => (
						<DescriptionCard
							key={index}
							label={`${count} ${numberForm(count, data.sign)}`}
							text={`${numberSpaces(resources)} ${numberForm(resources, ['ресурс', 'ресурса', 'ресурсов'])}`}
							avatar={data.icon}
							counter={index + 1}
						/>
					))}
				</CardGrid>
			</>
		),
	}),

	'map.chest': (data: MapChest) => ({
		head: { title: data.title, description: 'Карта — Походы', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Открытие за энергию" text={`${data.open[0]?.[0]} за ${data.open[0]?.[1]}`} />
				<DescriptionCell label="Открытие за рубины" text={`${data.open[1]?.[0]} за ${data.open[1]?.[1]}`} />
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'map.point': (data: MapPoint) => ({
		head: { title: data.title, description: 'Карта — Походы', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Требуемый уровень" text={`${data.lvl} уровень`} />
				<DescriptionCell label="Длительность похода" text={getTime(data.time)} />
				<DescriptionCell label="Стоимость похода" text={`${data.price} энергии`} />
				<DescriptionCell label="Обход противника" text={`${data.skip} рубинов`} />
				{data.pet && <DescriptionCell label="Питомец" text={data.pet} />}
				{data.chests && <DescriptionCell label="Дополнительная награда" text={data.chests} />}
				<Divider />
				<LinkCell href={imageUrl(data.icon)}>Изображение похода</LinkCell>
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'map.raid': (data: MapRaidLevel) => ({
		head: { title: data.title, description: 'Карта — Рейды', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Хранитель рейда" text={`${numberSpaces(data.guard[0])} здоровья\n${numberSpaces(data.guard[1])} атаки`} />
				<Divider />
				<CardGrid>
					{data.chests.map((chest, index) => (
						<DescriptionCard key={index} label={`${chest.count} ${numberForm(chest.count, ['штука', 'штуки', 'штук'])}`} text={chest.title} avatar={RAID_CHEST_ICONS[index]} />
					))}
				</CardGrid>
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'map.floor': (data: MapFloor) => ({
		head: { title: data.title, description: 'Карта — Приключения', avatar: data.icon },
		body: <ItemList items={data.items} />,
	}),

	'map.scrolls': (data: MapScrolls) => ({
		head: { title: data.title, description: 'Карта — Приключения', plain: true },
		body: <ItemList items={data.items} />,
	}),

	'map.region': (data: MapRegion) => ({
		head: { title: data.title, description: 'Карта — Районы', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Номер района" text={`${data.id} номер`} />
				{typeof data.lvl !== 'boolean' && <DescriptionCell label="Требуемый уровень" text={`${data.lvl} уровень`} />}
				{typeof data.boss === 'number' && <DescriptionCell label="Необходимо убить босса" text={Bosses[data.boss]?.name} />}
				{data.bosses.length !== 0 && (
					<>
						<Divider />
						<CardGrid>
							{data.bosses.map((boss) => (
								<DescriptionCard key={boss} label={Bosses[boss]?.name} text={Bosses[boss]?.description} avatar={Bosses[boss]?.icon} />
							))}
						</CardGrid>
					</>
				)}
				{data.builds.length !== 0 && (
					<>
						<Divider />
						<CardGrid>
							{data.builds.map((build) => (
								<DescriptionCard key={build} label={dataMap.builds[build]?.title} text={dataMap.builds[build]?.description} avatar={dataMap.builds[build]?.image} />
							))}
						</CardGrid>
					</>
				)}
			</>
		),
	}),

	'map.capture': (data: MapCapture) => {
		const location = findRegion(data.region);
		return {
			head: { title: data.title, description: 'Карта — Захват', avatar: data.icon },
			body: (
				<>
					<DescriptionCell label="Описание" text={data.description} />
					<DescriptionCell label="Необходимо очков для захвата района" text={`${numberSpaces(data.score)} очков`} />
					{data.region !== 0 && location && (
						<>
							<Divider />
							<DescriptionCell label="Номер района" text={`${location.id} номер`} />
							<DescriptionCell label="Уровень района" text={`${(typeof location.lvl === 'number' && location.lvl) || 0} уровень`} />
						</>
					)}
				</>
			),
		};
	},
};
