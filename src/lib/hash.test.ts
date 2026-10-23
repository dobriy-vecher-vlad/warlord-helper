import { describe, expect, it } from 'vitest';
import { buildLink, parseParams } from './hash';

describe('parseParams', () => {
	it('разбирает хеш ссылки', () => {
		expect(parseParams('#view=map&panel=3&modal=12')).toEqual({ view: 'map', panel: '3', modal: '12' });
	});
	it('флаги без значения', () => {
		expect(parseParams('#view=home&dev')).toEqual({ view: 'home', dev: undefined });
	});
	it('пустая строка -> пустой объект', () => {
		expect(parseParams('')).toEqual({});
	});
	it('значение с «=» не обрезается', () => {
		expect(parseParams('#view=map&token=a=b=c')).toEqual({ view: 'map', token: 'a=b=c' });
	});
});

describe('buildLink', () => {
	const base = 'https://vk.com/app7787242';
	it('собирает ссылку на раздел, подраздел и окно', () => {
		expect(buildLink(base, 'map', '4', 21)).toBe(`${base}#view=map&panel=4&modal=21`);
		expect(buildLink(base, 'map')).toBe(`${base}#view=map`);
		expect(buildLink(base)).toBe(base);
	});
	it('без раздела ссылка не получает «&panel=»', () => {
		expect(buildLink(base, null, '4')).toBe(`${base}#panel=4`);
		expect(buildLink(base, 'map', null, 21)).toBe(`${base}#view=map&modal=21`);
	});
});
