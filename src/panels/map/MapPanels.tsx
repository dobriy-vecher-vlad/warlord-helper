import dataMap from '../../data/map.json';
import { RewardCards } from '../../components/wiki/ItemCard';
import { TileCollection, TileGroups } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { GroupLink } from '../../components/wiki/TileGroup';
import { Divider } from '../../components/Divider';
import { getTime, numberForm, numberSpaces } from '../../lib/format';
import { ARENA_SEASONS } from '../../lib/data';
import type { ItemRef } from '../../lib/items';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { MAP_DESCRIPTIONS, REGION_GROUPS, findRegion } from '../../modals/descriptions/map';
import { sectionBase, type SectionPanels } from '../section';
import { nested, type HubData } from '../../stories/hubData';

const base = sectionBase('map', 'Карта');
registerDescriptions(MAP_DESCRIPTIONS);

/** 1. Мустафа — товары лавки (id — индекс в каталоге). */
export function ShopPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Мустафа', 1)}
			info={
				<>
					Мустафа продаёт различные товары, начиная с ресурсов и заканчивая элементами коллекций
					<br />
					Список товаров обновляется каждые 8 часов
				</>
			}
		>
			<RewardCards list={dataMap.shop} />
		</WikiPanel>
	);
}

/** 2. Обыск — постройки. */
export function BuildsPanel({ id }: { id: string }) {
	return (
		<WikiPanel {...base(id, 'Обыск', 2)} info="При помощи обыска можно получать различные ресурсы со зданий совершенно бесплатно">
			<TileCollection
				wide
				list={dataMap.builds}
				describe={(build) => ({ title: build.title, subtitle: build.map, image: build.image, badges: [getTime(build.time)] })}
				open={(build, link) => openDescription('map.build', build, link)}
			/>
		</WikiPanel>
	);
}

/** 3. Походы — сундуки и точки похода. */
export function CrusadePanel({ id }: { id: string }) {
	const { chests, points } = dataMap.crusade;
	return (
		<WikiPanel
			{...base(id, 'Походы', 3)}
			filter
			info={
				<>
					Походы доступны с 10 уровня и в день возможно запустить поход 7 раз
					<br />В походах можно найти уникальных питомцев, а также ключи к фонам
				</>
			}
		>
			<TileCollection
				list={chests}
				describe={(chest) => ({ title: chest.title, subtitle: chest.description, image: chest.icon })}
				open={(chest, link) => openDescription('map.chest', chest, link)}
			/>
			<Divider />
			<TileCollection
				wide
				offset={chests.length}
				list={points}
				describe={(point) => ({
					title: point.title,
					subtitle: `${point.items.length} ${numberForm(point.items.length, ['награда', 'награды', 'наград'])}`,
					image: point.icon,
					badges: [getTime(point.time)],
				})}
				open={(point, link) => openDescription('map.point', point, link)}
			/>
		</WikiPanel>
	);
}

/** 4. Рейды — уровни сложности каждого рейда. */
export function RaidsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Рейды', 4)}
			filter
			info={
				<>
					Рейды доступны с 40 уровня и в день возможно войти в рейд не более 3 раз
					<br />
					Чтобы открыть новый режим сложности, требуется убить финального босса на предыдущем режиме
				</>
			}
		>
			<TileGroups
				groups={dataMap.raids}
				title={(raid) => raid.title}
				after={(raid) => <GroupLink href={raid.map}>Открыть карту</GroupLink>}
				items={(raid) => raid.levels}
				describe={(level) => ({ title: level.title, subtitle: level.description, image: level.icon })}
				open={(level, link) => openDescription('map.raid', level, link)}
			/>
		</WikiPanel>
	);
}

/**
 * Заточки приключения: первая награда каждого этажа и все награды сезонов арены, все — как заточки.
 * Повторяет расчёт старого приложения.
 */
function adventureScrolls(adventure: (typeof dataMap.adventures)[number]): ItemRef[] {
	const floors = adventure.floors.flatMap((floor) => (floor.items[0] ? [{ id: floor.items[0].id, scroll: true }] : []));
	const arena = ARENA_SEASONS.flatMap((season) => season.month.flatMap((month) => month.items.map((item) => ({ id: item.id, scroll: true }))));
	return [...floors, ...arena];
}

/** 5. Приключения — этажи и заточки. */
export function AdventuresPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Приключения', 5)}
			info={
				<>
					Приключения доступны с 30 уровня и в день возможно войти в приключения не более 8 раз
					<br />
					После прохождения всех этажей, открывается возможность получать заточки за каждый бой
				</>
			}
		>
			<TileGroups
				groups={dataMap.adventures}
				title={(adventure) => adventure.title}
				after={(adventure, x) => {
					const link = String(x + 1);
					return (
						<GroupLink onClick={() => openDescription('map.scrolls', { title: adventure.scrolls.title, items: adventureScrolls(adventure) }, link)} deepLink={link}>
							Посмотреть заточки
						</GroupLink>
					);
				}}
				items={(adventure) => adventure.floors}
				describe={(floor) => ({ title: floor.title, subtitle: `Враги от ${numberSpaces(floor.guards[0])} HP`, image: floor.icon })}
				open={(floor, link) => openDescription('map.floor', floor, link)}
			/>
		</WikiPanel>
	);
}

/** 6. Районы. */
export function RegionsPanel({ id }: { id: string }) {
	const total = dataMap.regions.reduce((sum, region) => sum + region.items.length, 0);
	return (
		<WikiPanel
			{...base(id, 'Районы', 6)}
			info={
				<>
					Районы это главная часть всей игры, всего их {total}
					<br />
					Каждый район имеет внутри себя босса и по возможности постройку
				</>
			}
		>
			<TileGroups
				counted
				groups={REGION_GROUPS}
				title={(region) => region.title}
				items={(region) => region.items}
				describe={(location) => {
					const badges: string[] = [];
					if (location.builds.length) badges.push(`${location.builds.length} ${numberForm(location.builds.length, ['здание', 'здания', 'зданий'])}`);
					if (location.bosses.length) badges.push(`${location.bosses.length} ${numberForm(location.bosses.length, ['босс', 'босса', 'боссов'])}`);
					return { title: location.title, subtitle: location.description, image: location.icon, badges };
				}}
				open={(location, link) => openDescription('map.region', location, link)}
			/>
		</WikiPanel>
	);
}

/** 7. Захват районов. */
export function CapturePanel({ id }: { id: string }) {
	return (
		<WikiPanel {...base(id, 'Захват', 7)} info="Раз в неделю есть возможность захватить район всей гильдией и получать дань с захваченного района">
			<TileCollection
				wide
				list={dataMap.capture}
				describe={(capture) => {
					const region = dataMap.regions.find((group) => group.items.some((location) => location.title === capture.title));
					return {
						title: capture.title,
						subtitle: region?.title ?? findRegion(capture.region)?.title,
						image: capture.icon,
						badges: [`${capture.score} очков`],
					};
				}}
				open={(capture, link) => openDescription('map.capture', capture, link)}
			/>
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const MAP_HUB: HubData = {
	images: dataMap.images,
	counts: {
		'1': dataMap.shop.length,
		'2': dataMap.builds.length,
		'3': dataMap.crusade.points.length,
		'4': dataMap.raids.length,
		'5': dataMap.adventures.length,
		'6': nested(dataMap.regions, 'items'),
		'7': dataMap.capture.length,
	},
};

/** Подразделы карты по id панели. */
export const MAP_PANELS: SectionPanels = {
	'1': ShopPanel,
	'2': BuildsPanel,
	'3': CrusadePanel,
	'4': RaidsPanel,
	'5': AdventuresPanel,
	'6': RegionsPanel,
	'7': CapturePanel,
};
