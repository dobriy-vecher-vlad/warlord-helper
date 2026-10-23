import { describe, expect, it } from 'vitest';
import { findRating, ratingDate, tagColor } from './ratingData';

const rows = [
	{ id: 1, vkId: 100, name: 'Дракон' },
	{ id: 2, vkId: 200, name: 'Mage King' },
	{ id: 3, vkId: 300, name: 'Иван (воин)' },
];

describe('findRating', () => {
	it('находит строку по номеру ВК или по номеру в рейтинге', () => {
		expect(findRating(rows, '200')).toBe(200);
		expect(findRating(rows, '3')).toBe(3);
	});

	it('находит по части имени без учёта регистра', () => {
		expect(findRating(rows, 'драк')).toBe(1);
		expect(findRating(rows, 'KING')).toBe(2);
	});

	it('находит имя, набранное в другой раскладке', () => {
		// «Дракон» в английской раскладке: lhfrjy
		expect(findRating(rows, 'lhfrjy')).toBe(1);
		// «Mage» в русской раскладке: ьфпу
		expect(findRating(rows, 'ьфпу')).toBe(2);
	});

	it('находит имя, набранное транслитом', () => {
		expect(findRating(rows, 'drakon')).toBe(1);
	});

	it('спецсимволы в запросе не ломают поиск', () => {
		expect(findRating(rows, '(воин')).toBe(3);
		expect(findRating(rows, '[[[')).toBeUndefined();
		expect(findRating(rows, '*')).toBeUndefined();
	});

	it('пустой запрос и неизвестное имя дают undefined', () => {
		expect(findRating(rows, '   ')).toBeUndefined();
		expect(findRating(rows, 'несуществующий')).toBeUndefined();
	});
});

describe('подписи рейтинга', () => {
	it('дата файла превращается в «дд.мм.гггг»', () => {
		expect(ratingDate('2026.10.19')).toBe('19.10.2026');
	});

	it('цвет тега зависит от номера гильдии', () => {
		expect(tagColor(0)).toBe('red');
		expect(tagColor(6)).toBe('red');
		expect(tagColor(5)).toBe('violet');
	});
});
