import dataCharacter from '../../data/character.json';
import { TileCollection, TileGroups } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { getTime } from '../../lib/format';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { CHARACTER_DESCRIPTIONS } from '../../modals/descriptions/character';
import { sectionBase, type SectionPanels } from '../section';
import type { HubData } from '../../stories/hubData';

const base = sectionBase('character', 'Персонаж');
registerDescriptions(CHARACTER_DESCRIPTIONS);

const ACHIEVEMENTS_TOTAL = dataCharacter.achievements.reduce((sum, group) => sum + group.items.length, 0);

/** 1. Таланты. */
export function TalentsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Таланты', 12)}
			info={
				<>
					Всего в игре 4 вида навыков и каждый можно прокачать до 9 999 уровня, цена с каждым разом увеличивается
					<br />
					Также за определённые уровни прокачки навыка можно получить достижение
				</>
			}
		>
			<TileCollection
				wide
				list={dataCharacter.talents}
				describe={(entry) => ({ title: entry.title, subtitle: entry.description, image: entry.icon })}
				open={(entry, link) => openDescription('character.talent', entry, link)}
			/>
		</WikiPanel>
	);
}

/** 2. Достижения. */
export function AchievementsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Достижения', 13)}
			info={
				<>
					Почти каждое достижение имеет 10 стадий, которых {ACHIEVEMENTS_TOTAL} в игре
					<br />
					За каждую стадию достижения игрок получает награду в виде 1 рубина
				</>
			}
		>
			<TileGroups
				counted
				groups={dataCharacter.achievements}
				title={(group) => group.title}
				items={(group) => group.items}
				describe={(achievement) => ({ title: achievement.name, subtitle: achievement.description, image: achievement.icon })}
				open={(achievement, link) => openDescription('character.achievement', achievement, link)}
			/>
		</WikiPanel>
	);
}

/** 3. Ресурсы. */
export function ResourcesPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Ресурсы', 14)}
			info={
				<>
					В игре множество ресурсов и каждый добывается своим способом
					<br />
					Иногда ресурсы можно получить по подарочной ссылке в официальной группе
				</>
			}
		>
			<TileCollection
				wide
				list={dataCharacter.resources}
				describe={(entry) => ({ title: entry.title, subtitle: entry.description, image: entry.icon })}
				open={(entry, link) => openDescription('character.resource', entry, link)}
			/>
		</WikiPanel>
	);
}

/** 4. Питомцы. */
export function PetsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Питомцы', 15)}
			filter
			info={
				<>
					Чем выше уровень питомца, тем больше и лучше добыча с поисков
					<br />
					Питомца необходимо найти и выращивать, коллекции с поисков являются личными
				</>
			}
		>
			<TileCollection
				wide
				list={dataCharacter.pets}
				describe={(entry) => ({ title: entry.title, subtitle: entry.from, image: entry.icon, badges: [getTime(entry.time)] })}
				open={(entry, link) => openDescription('character.pet', entry, link)}
			/>
		</WikiPanel>
	);
}

/** 5. Фоны. */
export function BackgroundsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Фоны', 17)}
			info={
				<>
					Всего в игре {dataCharacter.backgrounds.length} видов фонов
					<br />
					Зимние фоны включаются сами в новогодние праздники
				</>
			}
		>
			<TileCollection
				wide
				list={dataCharacter.backgrounds}
				describe={(entry) => ({ title: entry.title, subtitle: entry.description, image: entry.icon })}
				open={(entry, link) => openDescription('character.background', entry, link)}
			/>
		</WikiPanel>
	);
}

/** 6. Аватары. */
export function AvatarsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Аватары', 16)}
			info={
				<>
					Всего в игре {dataCharacter.avatars.length} видов аватаров, они все изначально открыты
					<br />
					Выбранный аватар отображается в списке друзей и боя
				</>
			}
		>
			<TileCollection
				wide
				list={dataCharacter.avatars}
				describe={(entry) => ({ title: entry.title, subtitle: entry.description, image: entry.icon })}
				open={(entry, link) => openDescription('character.avatar', entry, link)}
			/>
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const CHARACTER_HUB: HubData = {
	images: dataCharacter.images,
	counts: {
		'1': dataCharacter.talents.length,
		'2': ACHIEVEMENTS_TOTAL,
		'3': dataCharacter.resources.length,
		'4': dataCharacter.pets.length,
		'5': dataCharacter.backgrounds.length,
		'6': dataCharacter.avatars.length,
	},
};

export const CHARACTER_PANELS: SectionPanels = {
	'1': TalentsPanel,
	'2': AchievementsPanel,
	'3': ResourcesPanel,
	'4': PetsPanel,
	'5': BackgroundsPanel,
	'6': AvatarsPanel,
};
