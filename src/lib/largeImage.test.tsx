import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { LargeImg } from '../components/LargeImg';
import { installBrowserStubs, render } from '../test/harness';
import { isMissingLarge, largeImage, preferLarge, regularImage } from './largeImage';

installBrowserStubs();

describe('большие версии картинок', () => {
	it('largeImage и regularImage меняют суффикс, не удваивая его; понимают png и webp', () => {
		expect(largeImage('items/164.png')).toBe('items/164x.png');
		expect(largeImage('items/164x.png')).toBe('items/164x.png');
		expect(largeImage('items/164.webp')).toBe('items/164x.webp');
		expect(regularImage('bosses/icons/274x.png')).toBe('bosses/icons/274.png');
		expect(regularImage('items/164x.webp')).toBe('items/164.webp');
	});

	it('preferLarge берёт большую только из папок, где она есть', () => {
		for (const folder of ['bosses/icons', 'items', 'keys', 'rooms', 'stones', 'collections', 'labels']) expect(preferLarge(`${folder}/5.png`)).toBe(`${folder}/5x.png`);
		expect(preferLarge('items/5x.png')).toBe('items/5x.png');
		expect(preferLarge('items/5b.png')).toBe('items/5b.png');
		expect(preferLarge('items/5.webp')).toBe('items/5x.webp');
		expect(preferLarge('bot/arena/avatar_3.png')).toBe('bot/arena/avatar_3.png');
		expect(preferLarge('currency/1.png')).toBe('currency/1.png');
		expect(preferLarge('')).toBe('');
	});
});

describe('LargeImg', () => {
	it('показывает большую, а если её нет, один раз откатывается на обычную и больше большую не просит', async () => {
		const container = await render(<LargeImg src="items/9001.png" />);
		const img = () => container.querySelector('img')!;
		expect(img().getAttribute('src')).toMatch(/items\/9001x\.png$/);

		await act(async () => void img().dispatchEvent(new Event('error')));
		expect(img().getAttribute('src')).toMatch(/items\/9001\.png$/);
		expect(isMissingLarge('items/9001x.png')).toBe(true);

		// Ошибка уже обычной картинки ничего не меняет
		await act(async () => void img().dispatchEvent(new Event('error')));
		expect(img().getAttribute('src')).toMatch(/items\/9001\.png$/);
	});

	it('картинки не из папок с большими версиями остаются как есть', async () => {
		const container = await render(<LargeImg src="bot/arena/avatar_3.png" />);
		expect(container.querySelector('img')!.getAttribute('src')).toMatch(/bot\/arena\/avatar_3\.png$/);
	});
});
