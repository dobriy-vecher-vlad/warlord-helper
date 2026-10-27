import { describe, expect, it } from 'vitest';
import { ATTEMPTS_FROM, compactNumber, getTime, numberForm, numberSpaces } from './format';

describe('numberSpaces', () => {
	it('разделяет тысячи', () => {
		expect(numberSpaces(1234567)).toBe('1 234 567');
		expect(numberSpaces(999)).toBe('999');
		expect(numberSpaces(0)).toBe('0');
	});
	it('принимает свой разделитель', () => {
		expect(numberSpaces(12345, '.')).toBe('12.345');
	});
});

describe('numberForm', () => {
	const titles = ['предмет', 'предмета', 'предметов'] as const;
	it.each([
		[1, 'предмет'],
		[2, 'предмета'],
		[4, 'предмета'],
		[5, 'предметов'],
		[11, 'предметов'],
		[14, 'предметов'],
		[21, 'предмет'],
		[22, 'предмета'],
		[100, 'предметов'],
		[101, 'предмет'],
		[0, 'предметов'],
		[-2, 'предмета'],
	])('%i -> %s', (n, expected) => {
		expect(numberForm(n, titles)).toBe(expected);
	});
});

describe('getTime', () => {
	it('форматирует секунды', () => {
		expect(getTime(0)).toBe('00:00:00');
		expect(getTime(61)).toBe('00:01:01');
		expect(getTime(3661)).toBe('01:01:01');
		expect(getTime(100 * 3600)).toBe('100:00:00');
	});
	it('отрицательные и нецелые значения -> ноль', () => {
		expect(getTime(-5)).toBe('00:00:00');
		expect(getTime(1.5)).toBe('00:00:00');
	});
});

describe('compactNumber', () => {
	it('сжимает большие числа до миллионов, тысяч и миллиардов', () => {
		expect(compactNumber(41_158_594)).toBe('41,2 млн');
		expect(compactNumber(175_000_000)).toBe('175 млн');
		expect(compactNumber(950_000)).toBe('950 тыс.');
		expect(compactNumber(1_500_000_000)).toBe('1,5 млрд');
		expect(compactNumber(12_000)).toBe('12 тыс.');
	});

	it('до тысячи и отрицательные', () => {
		expect(compactNumber(999)).toBe('999');
		expect(compactNumber(0)).toBe('0');
		expect(compactNumber(-2_500_000)).toBe('-2,5 млн');
	});
});

describe('ATTEMPTS_FROM', () => {
	it('«из N попытки / попыток» — родительный падеж по последнему числу', () => {
		const text = (number: number) => `1 из ${number} ${numberForm(number, ATTEMPTS_FROM)}`;
		expect(text(1)).toBe('1 из 1 попытки');
		expect(text(2)).toBe('1 из 2 попыток');
		expect(text(3)).toBe('1 из 3 попыток');
		expect(text(5)).toBe('1 из 5 попыток');
		expect(text(11)).toBe('1 из 11 попыток');
		expect(text(21)).toBe('1 из 21 попытки');
		expect(text(30)).toBe('1 из 30 попыток');
	});
});
