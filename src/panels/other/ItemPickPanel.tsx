import { PickPanel, type PickGroup } from '../../components/wiki/PickPanel';
import { ITEMS, ITEM_TYPES } from '../../lib/items';
import { setCalcItem, useCalcItem } from '../../store/itemCalc';
import { openPanel } from '../../store/nav';
import { ITEM_CALC_PANELS } from '../calcPanels';
import { sectionBase } from '../section';

const base = sectionBase('other', 'Калькулятор');

/** Предметы по типам (индексы в каталоге): каталог разбирается за один проход и один раз за всё время работы. */
let groups: PickGroup<number>[] | null = null;
function itemGroups() {
	if (!groups) {
		const byType = new Map<number, number[]>();
		ITEMS.forEach((item, index) => {
			const list = byType.get(item.type);
			if (list) list.push(index);
			else byType.set(item.type, [index]);
		});
		groups = ITEM_TYPES.filter((type) => byType.has(type.value)).map((type) => ({ title: type.title, items: byType.get(type.value)! }));
	}
	return groups;
}

const itemTitle = (index: number) => ITEMS[index]!.title;

/**
 * Выбор предмета для калькулятора: предметы по типам, одна строка на предмет, поиск по названию. Строки вне экрана браузер
 * не отрисовывает (content-visibility, в каталоге около тысячи предметов). Нажатие выбирает предмет и возвращает в калькулятор.
 */
export function ItemPickPanel({ id }: { id: string }) {
	const selected = useCalcItem();
	return (
		<PickPanel
			head={base(id, 'Выбор предмета', 26)}
			back={ITEM_CALC_PANELS.calc}
			groups={itemGroups()}
			searchBy={itemTitle}
			empty="Нет предметов"
			view={(index) => ({ title: ITEMS[index]!.title, subtitle: ITEMS[index]!.description, image: ITEMS[index]!.icon })}
			isSelected={(index) => index === selected}
			onPick={(index) => {
				setCalcItem(index);
				openPanel(ITEM_CALC_PANELS.calc);
			}}
		/>
	);
}
