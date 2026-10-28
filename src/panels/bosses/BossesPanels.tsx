import Bosses from '../../data/bosses.json';
import dataBosses from '../../data/boss.json';
import { TileGroups } from '../../components/wiki/TileLists';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { numberForm } from '../../lib/format';
import { openDescription, registerDescriptions } from '../../modals/descriptions';
import { largeImage } from '../../lib/largeImage';
import { BOSSES_DESCRIPTIONS, type Boss } from '../../modals/descriptions/bosses';
import { sectionBase, type SectionPanels } from '../section';
import { BossCalcPanel } from './BossCalcPanel';
import { BossPickPanel, PowerPickPanel } from './BossPickPanels';
import type { HubData } from '../../stories/hubData';

const base = sectionBase('bosses', 'Боссы');
registerDescriptions(BOSSES_DESCRIPTIONS);

/** Босс группы: запись из bosses.json, дополненная наградами группы (как Object.assign в старом приложении). */
const BOSS_GROUPS = dataBosses.bosses.map((group) => ({
	...group,
	mobs: group.mobs.map((mob) => ({ ...Bosses.find((boss) => boss.id === mob.id)!, ...mob }) satisfies Boss),
}));

const TOTAL = dataBosses.bosses.reduce((sum, group) => sum + group.mobs.length, 0);

/** 2. Список боссов. */
export function BossListPanel({ id }: { id: string }) {
	return (
		<WikiPanel
			{...base(id, 'Список боссов', 29)}
			filter
			info={
				<>
					Всего в игре {TOTAL} {numberForm(TOTAL, ['босс', 'босса', 'боссов'])}, которые делятся на временных, общих, одиночных, рейдовых и уникальных
					<br />
					Каждый босс имеет свой лимит побед и стоимость нападения
				</>
			}
		>
			<TileGroups
				counted
				groups={BOSS_GROUPS}
				title={(group) => group.title}
				items={(group) => group.mobs}
				describe={(boss) => ({ title: boss.name, subtitle: boss.description, image: largeImage(boss.icon) })}
				open={(boss, link) => openDescription('bosses.boss', boss, link)}
			/>
		</WikiPanel>
	);
}

/** Данные главной панели раздела: картинки баннера и количество записей по подразделам. */
export const BOSSES_HUB: HubData = { images: dataBosses.images, counts: { '2': TOTAL } };

export const BOSSES_PANELS: SectionPanels = {
	'1': BossCalcPanel,
	'2': BossListPanel,
	'3': BossPickPanel,
	'4': PowerPickPanel,
};
