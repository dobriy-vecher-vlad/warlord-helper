import { PickPanel } from '../../components/wiki/PickPanel';
import { setBossDiscount, setBossId, useBossDiscount, useBossId } from '../../store/bossCalc';
import { openPanel } from '../../store/nav';
import { BOSS_CALC_PANELS } from '../calcPanels';
import { sectionBase } from '../section';
import { DISCOUNTS, type BossEntry } from './bossCalcData';
import { useBossGroups } from './useBossCalc';

const base = sectionBase('bosses', 'Калькулятор');

const bossName = ({ boss }: BossEntry) => boss.name;
const powerGroups = [{ items: DISCOUNTS }];

/** Выбор босса для калькулятора: боссы по группам с поиском по названию. Нажатие выбирает босса и возвращает в калькулятор. */
export function BossPickPanel({ id }: { id: string }) {
	const selected = useBossId();
	const groups = useBossGroups();
	return (
		<PickPanel
			head={base(id, 'Выбор босса', 8)}
			back={BOSS_CALC_PANELS.calc}
			groups={groups}
			searchBy={bossName}
			empty="Нет боссов"
			view={({ boss }) => ({ title: boss.name, subtitle: boss.description, image: boss.icon })}
			isSelected={(entry) => entry.id === selected}
			onPick={(entry) => {
				setBossId(entry.id);
				openPanel(BOSS_CALC_PANELS.calc);
			}}
		/>
	);
}

/** Выбор силы босса (ослабление событиями и бонусами). Нажатие выбирает значение и возвращает в калькулятор. */
export function PowerPickPanel({ id }: { id: string }) {
	const selected = useBossDiscount();
	return (
		<PickPanel
			head={base(id, 'Выбор силы', 8)}
			back={BOSS_CALC_PANELS.calc}
			groups={powerGroups}
			view={(item) => ({ title: item.title, subtitle: item.description })}
			isSelected={(item) => item.value === selected}
			onPick={(item) => {
				setBossDiscount(item.value);
				openPanel(BOSS_CALC_PANELS.calc);
			}}
		/>
	);
}
