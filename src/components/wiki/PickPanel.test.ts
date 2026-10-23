import { describe, expect, it } from 'vitest';
import { pickRows } from './PickPanel';

const groups = [{ title: 'Оружие', items: ['Меч', 'Лук', 'Молот'] }, { title: 'Шлемы', items: ['Шлем воина', 'Корона'] }, { items: ['Без группы'] }];
const label = (item: string) => item;

describe('pickRows', () => {
	it('без запроса даёт заголовки групп и все элементы по порядку', () => {
		expect(pickRows(groups, '', label)).toEqual([
			{ group: 'Оружие' },
			{ item: 'Меч' },
			{ item: 'Лук' },
			{ item: 'Молот' },
			{ group: 'Шлемы' },
			{ item: 'Шлем воина' },
			{ item: 'Корона' },
			{ item: 'Без группы' },
		]);
	});

	it('по запросу оставляет подходящие элементы, пустые группы пропускает', () => {
		expect(pickRows(groups, 'шлем', label)).toEqual([{ group: 'Шлемы' }, { item: 'Шлем воина' }]);
		expect(pickRows(groups, 'zzz', label)).toEqual([]);
	});

	it('без функции поиска запрос игнорируется', () => {
		expect(pickRows(groups, 'шлем')).toHaveLength(8);
	});

	it('группа без названия идёт без заголовка', () => {
		expect(pickRows([{ items: [1, 2] }], '')).toEqual([{ item: 1 }, { item: 2 }]);
	});
});
