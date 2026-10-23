import dataGuild from '../../data/guild.json';
import { ItemCard, ItemCardGrid } from '../../components/wiki/ItemCard';
import { TileCollection } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { numberForm } from '../../lib/format';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { GUILD_DESCRIPTIONS } from '../../modals/descriptions/guild';
import { sectionBase, type SectionPanels } from '../section';
import { GuildCalcPanel } from './GuildCalcPanel';
import type { HubData } from '../../stories/hubData';

const base = sectionBase('guild', 'Гильдия');
registerDescriptions(GUILD_DESCRIPTIONS);

/** Плитки гильдии: в одних подразделах подпись — бонус, в других — описание. */
function GuildGrid<T extends { title: string; icon: string }>({
	list,
	subtitle,
	open,
}: {
	list: readonly T[];
	subtitle: (entry: T) => string;
	open: (entry: T, link: string) => void;
}) {
	return <TileCollection wide list={list} describe={(entry) => ({ title: entry.title, subtitle: subtitle(entry), image: entry.icon })} open={open} />;
}

/** 2. Улучшения. */
export function BuildsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Улучшения', 19)}
			info="Благодаря улучшению зданий, вам открываются новые ступени навыков, предметы в кузнице и сборщики налогов, позволяющие собирать различные бонусы"
		>
			<GuildGrid list={dataGuild.builds} subtitle={(build) => build.bonus} open={(build, link) => openDescription('guild.build', build, link)} />
		</WikiPanel>
	);
}

/** 3. Кузница — карточки предметов, по нажатию открывается описание (а не окно предмета). */
export function ForgePanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Кузница', 20)}
			info={
				<>
					Аметисты и Топазы можно получить только вкладываясь в улучшения навыков и при пополнении казны
					<br />
					Заточки можно купить после покупки самого предмета
				</>
			}
		>
			<ItemCardGrid>
				{dataGuild.items.map((item, index) => {
					const link = String(index + 1);
					return (
						<ItemCard
							key={index}
							index={item.id}
							kind="item"
							caption={`Стаж от ${item.days} ${numberForm(item.days, ['день', 'дней', 'дней'])}`}
							onClick={() => openDescription('guild.forge', item, link)}
							deepLink={link}
						/>
					);
				})}
			</ItemCardGrid>
		</WikiPanel>
	);
}

/** 4. Академия. */
export function AcademyPanel({ id }: { id: string }) {
	return (
		<WikiPanel {...base(id, 'Академия', 21)} info="Навыки гильдии — это уникальные бонусы, чей бонус зависит от уровня самого навыка">
			<GuildGrid list={dataGuild.academy} subtitle={(skill) => skill.bonus} open={(skill, link) => openDescription('guild.academy', skill, link)} />
		</WikiPanel>
	);
}

/** 5. Набеги. */
export function RaidsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Набеги', 22)}
			filter
			info={
				<>
					Набеги — это уникальный вид боя всех участников гильдии против вражеской гильдии или NPC
					<br />
					Набеги доступны всем гильдиям, начиная с 5 уровня
				</>
			}
		>
			<GuildGrid list={dataGuild.raids} subtitle={(raid) => raid.description} open={(raid, link) => openDescription('guild.raid', raid, link)} />
		</WikiPanel>
	);
}

/** 6. Рейды — рейдовые боссы гильдии. */
export function BossesPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Рейды', 23)}
			filter
			info={
				<>
					Лидер гильдии или её генералы могут создавать рейдовых боссов гильдии
					<br />
					Золото и серебро, требуемое для создания, взимается с казны гильдии
				</>
			}
		>
			<GuildGrid list={dataGuild.bosses} subtitle={(boss) => boss.description} open={(boss, link) => openDescription('guild.boss', boss, link)} />
		</WikiPanel>
	);
}

/** 7. Звания. */
export function RangsPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Звания', 28)}
			info={
				<>
					Всего в гильдии 6 рангов, но только три из них имеют доступ к действиям в гильдии
					<br />
					Лидер не может покинуть гильдию, не передав свои полномочия другому игроку
				</>
			}
		>
			<GuildGrid list={dataGuild.rangs} subtitle={(rang) => rang.bonus} open={(rang, link) => openDescription('guild.rang', rang, link)} />
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const GUILD_HUB: HubData = {
	images: dataGuild.images,
	counts: {
		'2': dataGuild.builds.length,
		'3': dataGuild.items.length,
		'4': dataGuild.academy.length,
		'5': dataGuild.raids.length,
		'6': dataGuild.bosses.length,
		'7': dataGuild.rangs.length,
	},
};

export const GUILD_PANELS: SectionPanels = {
	'1': GuildCalcPanel,
	'2': BuildsPanel,
	'3': ForgePanel,
	'4': AcademyPanel,
	'5': RaidsPanel,
	'6': BossesPanel,
	'7': RangsPanel,
};
