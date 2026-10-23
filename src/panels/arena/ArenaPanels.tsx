import dataArena from '../../data/arena.json';
import { TileCollection, TileGroups } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { getTime, numberSpaces } from '../../lib/format';
import { ARENA_SEASONS } from '../../lib/data';
import { itemAt } from '../../lib/items';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { ARENA_DESCRIPTIONS } from '../../modals/descriptions/arena';
import { sectionBase, type SectionPanels } from '../section';
import { ArenaCalcPanel } from './ArenaCalcPanel';
import { nested, type HubData } from '../../stories/hubData';

const base = sectionBase('arena', 'Арена');
registerDescriptions(ARENA_DESCRIPTIONS);

type Month = (typeof ARENA_SEASONS)[number]['month'][number];

/** Подпись и плашки месяца: два предмета — суммарные урон и здоровье (здоровье ×15), один предмет — без плашек. */
function monthTile(month: Month) {
	const first = itemAt(month.items[0]!.id);
	if (month.items.length > 1) {
		const second = itemAt(month.items[1]!.id);
		const hp = month.items.reduce((sum, ref) => sum + (itemAt(ref.id)?.hp ?? 0), 0) * 15;
		const dmg = month.items.reduce((sum, ref) => sum + (itemAt(ref.id)?.dmg ?? 0), 0);
		const badges = [];
		if (dmg) badges.push(`DMG ${numberSpaces(dmg)}`);
		if (hp) badges.push(`HP ${numberSpaces(hp)}`);
		return { subtitle: `${first?.title} и ${second?.title}`, badges };
	}
	// В старом коде здесь брались hp/dmg самой ссылки на предмет, которых нет, — плашки не показывались
	return { subtitle: `${first?.title}`, badges: [] };
}

/** 2. Сезоны. */
export function SeasonsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Сезоны', 9)}
			info={
				<>
					Ежемесячно в игру поступают 2 новых предмета экипировки, которые доступны в качестве награды за арену
					<br />
					Чем выше лига — тем лучше и больше награда с ежемесячного сундука
				</>
			}
		>
			<TileGroups
				counted
				groups={ARENA_SEASONS}
				title={(season) => season.name}
				items={(season) => season.month}
				describe={(month) => {
					const { subtitle, badges } = monthTile(month);
					return { title: month.name, subtitle, image: month.icon, badges };
				}}
				open={(month, link) => openDescription('arena.season', month, link)}
			/>
		</WikiPanel>
	);
}

/** 3. Лиги. */
export function LeaguesPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Лиги', 10)}
			info={
				<>
					Подбор противников осуществляется из игроков в той же лиге, что и ваш персонаж
					<br />
					Чем выше ваша лига — тем выше шанс на выпадение более редкого сундука
				</>
			}
		>
			<TileCollection
				wide
				list={dataArena.league}
				describe={(league) => ({
					title: league.title,
					subtitle: `${numberSpaces(league.from)} - ${numberSpaces(league.to)} кубков`,
					image: league.icon,
				})}
				open={(league, link) => openDescription('arena.league', league, link)}
			/>
		</WikiPanel>
	);
}

/** 4. Сундуки. */
export function ChestsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Сундуки', 11)}
			filter
			info={
				<>
					Из сундуков могут выпасть предметы, заточки, а также ценные ресурсы
					<br />
					Трофейные сундуки могут выпасть только с противника, который состоит в гильдии
				</>
			}
		>
			<TileCollection
				wide
				list={dataArena.chest}
				describe={(chest) => ({ title: chest.title, subtitle: chest.description, image: chest.icon, badges: [getTime(chest.time)] })}
				open={(chest, link) => openDescription('arena.chest', chest, link)}
			/>
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const ARENA_HUB: HubData = {
	images: dataArena.images,
	counts: { '2': nested(dataArena.season, 'month'), '3': dataArena.league.length, '4': dataArena.chest.length },
};

export const ARENA_PANELS: SectionPanels = {
	'1': ArenaCalcPanel,
	'2': SeasonsPanel,
	'3': LeaguesPanel,
	'4': ChestsPanel,
};
