// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGameUrl, getGame } from './game';
import { getData } from './http';

const params = (url: string) => Object.fromEntries(new URL(url).searchParams);
const response = (text: string, status = 200) => ({ status, text: async () => text }) as Response;

describe('buildGameUrl', () => {
	it('vk1: пустое тело — без UID', () => {
		const url = buildGameUrl(1, {}, { login: '10', password: 'key' });
		expect(url.startsWith('https://tmp1-fb.geronimo.su/warlord_vk/game.php?')).toBe(true);
		expect(params(url)).toEqual({ api_type: 'vk', api_id: '5536422', sslt: '0', api_uid: '10', auth_key: 'key' });
	});
	it('vk1: с телом — UID берётся из id, иначе из логина', () => {
		expect(params(buildGameUrl('vk1', { i: 5 }, { id: 77, login: '10', password: 'k' })).UID).toBe('77');
		expect(params(buildGameUrl(1, { i: 5 }, { login: '10', password: 'k' })).UID).toBe('10');
	});
	it('сохраняет порядок параметров', () => {
		const url = buildGameUrl(1, { i: 5 }, { login: '10', password: 'k' });
		expect(url.split('?')[1]).toBe('api_type=vk&api_id=5536422&sslt=0&api_uid=10&auth_key=k&UID=10&i=5');
	});
	it('vk2 — другой путь', () => {
		expect(buildGameUrl(2, {}, { login: '1', password: 'p' })).toContain('/warlord_vk2/game.php?');
	});
	it('ya использует lapi_uid и gs1', () => {
		const url = buildGameUrl('ya', {}, { login: '1', password: 'p' });
		expect(url.startsWith('https://gs1.geronimo.su/warlord_ya1/game.php?')).toBe(true);
		expect(params(url)).toMatchObject({ api_type: 'ya', api_id: '100430', lapi_uid: 'p' });
	});
	it('gm добавляет currency и lang', () => {
		expect(params(buildGameUrl(6, {}, { login: '1', password: 'p' }))).toMatchObject({
			api_type: 'gm',
			api_id: '5782',
			currency: 'RUB',
			lang: 'ru_RU',
		});
	});
	it('ok1: делит логин и пароль по запятой', () => {
		const url = buildGameUrl(4, {}, { login: '111,222', password: 'sig,sess' });
		expect(url).toContain('/OK_WARLORD/game.php?');
		expect(params(url)).toEqual({
			api_type: 'ok',
			sslt: '0',
			session_key: 'sess',
			api_uid: '111',
			auth_sig: 'sig',
			UID: '222',
		});
	});
	it('ok2 — отдельный путь', () => {
		expect(buildGameUrl(5, {}, { login: '1,2', password: 'a,b' })).toContain('/OK_WARLORD2/game.php?');
	});
	it('хаб: свой путь и только api_uid', () => {
		const vk = buildGameUrl(1, {}, { login: '10' }, 2);
		expect(vk.startsWith('https://tmp1-fb.geronimo.su/gameHub/index.php?')).toBe(true);
		expect(params(vk)).toEqual({ api_type: 'vk', api_id: '5536422', api_uid: '10' });
		expect(buildGameUrl(4, {}, { login: '111,222' }, 2)).toContain('/gameHubOk/index.php?api_type=ok&api_uid=111');
	});
	it('тип 3: только базовые параметры и тело', () => {
		expect(buildGameUrl(1, { x: 1 }, {}, 3)).toBe('https://tmp1-fb.geronimo.su/?api_type=vk&api_id=5536422&x=1');
	});
	it('бросает ошибки при неверных аргументах', () => {
		expect(() => buildGameUrl('nope')).toThrow('Укажите сервер запроса');
		expect(() => buildGameUrl(1, {}, { password: 'p' })).toThrow('Укажите логин запроса');
		expect(() => buildGameUrl(1, {}, { login: '1' })).toThrow('Укажите пароль запроса');
	});
});

describe('getData', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('tmp1-fb: POST с параметрами в теле', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response('{"ok":1}'));
		vi.stubGlobal('fetch', fetchMock);
		const data = await getData('https://tmp1-fb.geronimo.su/warlord_vk/game.php?a=1&b=x%2By');
		expect(data).toEqual({ ok: 1 });
		const [url, init] = fetchMock.mock.calls[0]!;
		expect(url).toBe('https://tmp1-fb.geronimo.su/warlord_vk/game.php');
		expect(init.method).toBe('POST');
		expect((init.body as FormData).get('a')).toBe('1');
		// %2B заменяется на + до отправки
		expect((init.body as FormData).get('b')).toBe('x+y');
	});
	it('при 500 повторяет GET-ом', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce(response('', 500)).mockResolvedValueOnce(response('{"a":2}'));
		vi.stubGlobal('fetch', fetchMock);
		expect(await getData('https://tmp1-fb.geronimo.su/g.php?a=1')).toEqual({ a: 2 });
		expect(fetchMock.mock.calls[1]).toEqual(['https://tmp1-fb.geronimo.su/g.php?a=1', { signal: expect.any(AbortSignal) }]);
	});
	it('другие хосты — обычный GET', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response('{"a":3}'));
		vi.stubGlobal('fetch', fetchMock);
		await getData('https://gs1.geronimo.su/g.php?a=1');
		expect(fetchMock).toHaveBeenCalledWith('https://gs1.geronimo.su/g.php?a=1');
	});
	it('при лимите запросов ждёт секунду и повторяет', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValueOnce(response('Too many requests per second.')).mockResolvedValueOnce(response('{"a":4}'));
		vi.stubGlobal('fetch', fetchMock);
		const promise = getData('https://gs1.geronimo.su/g.php?a=1');
		await vi.advanceTimersByTimeAsync(1000);
		expect(await promise).toEqual({ a: 4 });
	});
	it('ошибка сети -> null', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		expect(await getData('https://gs1.geronimo.su/g.php')).toBeNull();
	});
});

describe('getGame (хаб)', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('выбирает запись своего сервера', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`<data><s n="Эрмун"/><s n="Антарес"/></data>`)));
		expect((await getGame(2, {}, { login: '1' }, 2))._n).toBe('Антарес');
	});
	it('completeData возвращает массив, одиночный узел оборачивается', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(`<data><s n="Эрмун"/></data>`)));
		expect(await getGame(1, {}, { login: '1' }, 2, true)).toHaveLength(1);
	});
});
