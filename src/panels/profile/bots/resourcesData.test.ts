import { describe, expect, it } from 'vitest';
import { RESOURCES, resourceIcon } from './resourcesData';

describe('значки строки ресурсов', () => {
	it('прозрачные иконки из currency/all по полю награды, расходники itemN как iN', () => {
		expect(resourceIcon('m1')).toBe('currency/all/m1.png');
		expect(resourceIcon('exp')).toBe('currency/all/exp.png');
		expect(resourceIcon('item1')).toBe('currency/all/i1.png');
		expect(resourceIcon('item3')).toBe('currency/all/i3.png');
	});

	it('у сундука значок прежний, пока прозрачного нет; остальные ключи строки ссылаются на currency/all', () => {
		expect(resourceIcon('chest')).toBe('bot/resources/chest.png');
		expect(RESOURCES.filter((key) => key !== 'chest').every((key) => resourceIcon(key).startsWith('currency/all/'))).toBe(true);
	});
});
