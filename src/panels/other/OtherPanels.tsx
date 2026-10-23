import dataOther from '../../data/other.json';
import { ItemCard, ItemCardGrid, RewardCards } from '../../components/wiki/ItemCard';
import { TileGroups } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { OTHER_EVENTS } from '../../lib/data';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { OTHER_DESCRIPTIONS } from '../../modals/descriptions/other';
import { sectionBase, type SectionPanels } from '../section';
import { ItemCalcPanel } from './ItemCalcPanel';
import { ItemPickPanel } from './ItemPickPanel';
import { nested, type HubData } from '../../stories/hubData';

const base = sectionBase('other', 'Разное');
registerDescriptions(OTHER_DESCRIPTIONS);

/** 2. Лотерея. */
export function LotteryPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Лотерея', 27)}
			info={
				<>
					Бесплатная попытка в лотерею доступна каждые 24 часа
					<br />В лотереи можно также найти различные ресурсы
				</>
			}
		>
			<RewardCards list={dataOther.lottery} />
		</WikiPanel>
	);
}

/** 3. События. */
export function EventsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'События', 28)}
			info={
				<>
					Ивенты — это уникальные события, которые запускаются во время крупных праздников
					<br />
					Участие в ивенте доступно для каждого игрока и не требует никаких затрат
				</>
			}
		>
			<TileGroups
				counted
				groups={OTHER_EVENTS}
				title={(group) => group.title}
				items={(group) => group.items}
				describe={(event) => ({ title: event.name, subtitle: event.date, image: event.icon })}
				open={(event, link) => openDescription('other.event', event, link)}
			/>
		</WikiPanel>
	);
}

/** 4. Обыск друзей. */
export function SearchPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Обыск друзей', 30)}
			info={
				<>
					Ежедневно к обыску доступно 15 друзей
					<br />
					При обыске можно найти различные ресурсы, а также элементы коллекций
				</>
			}
		>
			<RewardCards list={dataOther.search} />
		</WikiPanel>
	);
}

/** 5. Новые предметы (с подпиской): последние добавленные предметы и есть ли они у персонажа. */
export function NewItemsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Новые предметы', 20)}
			info="В игру регулярно поступают новые предметы, этот раздел отображает последние добавленные предметы и указывает их наличие у вас"
		>
			<ItemCardGrid>
				{dataOther.new.map((index, x) => (
					<ItemCard key={x} index={index} deepLink={String(x + 1)} />
				))}
			</ItemCardGrid>
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const OTHER_HUB: HubData = {
	images: dataOther.images,
	counts: {
		'2': dataOther.lottery.length,
		'3': nested(dataOther.events, 'items'),
		'4': dataOther.search.length,
		'5': dataOther.new.length,
	},
};

export const OTHER_PANELS: SectionPanels = {
	'1': ItemCalcPanel,
	'2': LotteryPanel,
	'3': EventsPanel,
	'4': SearchPanel,
	'5': NewItemsPanel,
	'6': ItemPickPanel,
};
