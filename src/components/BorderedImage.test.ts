import { describe, expect, it } from 'vitest';
import { cropStyle, hasBakedBorder, isCurrencyTile } from './BorderedImage';

describe('плитки валют с вшитой белой рамкой', () => {
	it('рамка есть у плиток `_big` из currency/all и нет у прозрачных иконок и обычных картинок', () => {
		expect(isCurrencyTile('currency/all/m1_big.png')).toBe(true);
		expect(isCurrencyTile('currency/all/k10_big.png')).toBe(true);
		expect(isCurrencyTile('currency/all/m1.png')).toBe(false);
		expect(isCurrencyTile('currency/all/nested/m1_big.png')).toBe(false);
		expect(isCurrencyTile('bot/arena/2.png')).toBe(false);
		expect(hasBakedBorder('currency/all/exp_big.png')).toBe(true);
		expect(hasBakedBorder('currency/all/exp.png')).toBe(false);
		expect(hasBakedBorder('items/5.png')).toBe(true);
	});

	it('срез у плитки такой же, как у остальных картинок по умолчанию, у прозрачной иконки среза нет', () => {
		expect(cropStyle('currency/all/m1_big.png')).toMatchObject({ '--crop-x': '7.5%', '--crop-y': '7%' });
		expect(cropStyle('currency/all/m1.png')).toBeUndefined();
	});
});
