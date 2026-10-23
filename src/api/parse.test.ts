// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fixXml, parseResponse } from './parse';

describe('fixXml', () => {
	it('переводит значения в двойные кавычки и экранирует спецсимволы', () => {
		expect(fixXml(`<a n='He said "hi" & <left>'/>`)).toBe(`<a n="He said &quot;hi&quot; &amp; &lt;left&gt;"/>`);
	});
	it('экранирует апостроф в значении с двойными кавычками', () => {
		expect(fixXml(`<a n="it's"/>`)).toBe(`<a n="it&#039;s"/>`);
	});
	it('оставляет пустые значения пустыми', () => {
		expect(fixXml(`<a n=''/>`)).toBe(`<a n=""/>`);
	});
});

describe('parseResponse', () => {
	it('разбирает JSON', () => {
		expect(parseResponse('{"a":1}')).toEqual({ a: 1 });
	});
	it('разбирает XML, атрибуты получают префикс _', () => {
		const data = parseResponse(`<data><u id="5" name="Воин"/></data>`);
		expect(data.u._id).toBe('5');
		expect(data.u._name).toBe('Воин');
	});
	it('разбирает XML с одинарными кавычками и сырыми символами', () => {
		const data = parseResponse(`<data><u name='A & B <C>'/></data>`);
		expect(data.u._name).toBe('A & B <C>');
	});
	it('несколько одинаковых узлов становятся массивом', () => {
		const data = parseResponse(`<data><s n="1"/><s n="2"/></data>`);
		expect(data.s.map((s: { _n: string }) => s._n)).toEqual(['1', '2']);
	});
	it('без корня data возвращает корень как есть', () => {
		expect(parseResponse(`<root><a x="1"/></root>`).root.a._x).toBe('1');
	});
	it('при ошибке разбора возвращает исходный текст', () => {
		expect(parseResponse('просто текст')).toBe('просто текст');
	});
	it('пустой ответ -> null', () => {
		expect(parseResponse('')).toBeNull();
	});
});
