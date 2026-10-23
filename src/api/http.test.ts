import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const link = (x: string) => `https://tmp1-fb.geronimo.su/warlord_vk/game.php?x=${x}`;

describe('очередь запросов к игровому серверу', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetModules();
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('в пути один запрос, остальные ждут по важности: действие игрока обгоняет окно и опрос', async () => {
		const sent: string[] = [];
		const open: Array<() => void> = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_url: string, init?: { body?: FormData }) => {
				sent.push(String(init?.body?.get('x')));
				await new Promise<void>((resolve) => open.push(resolve));
				return { status: 200, text: async () => '<data/>' };
			}),
		);
		const { getData, PRIORITY } = await import('./http');
		const all = [getData(link('poll1')), getData(link('poll2')), getData(link('window'), PRIORITY.window), getData(link('hit'), PRIORITY.action)];
		await vi.advanceTimersByTimeAsync(0);
		// Первый ушёл сразу, остальные ждут
		expect(sent).toEqual(['poll1']);
		for (const expected of [
			['poll1', 'hit'],
			['poll1', 'hit', 'window'],
			['poll1', 'hit', 'window', 'poll2'],
		]) {
			open.shift()!();
			await vi.advanceTimersByTimeAsync(0);
			expect(sent).toEqual(expected);
		}
		open.shift()!();
		await Promise.all(all);
	});

	it('при ответе «слишком часто» очередь ждёт секунду, запрос повторяется со своим приоритетом', async () => {
		let calls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				calls++;
				return { status: 200, text: async () => (calls === 1 ? 'Err. More than 1 request per second' : '<data/>') };
			}),
		);
		const { getData, PRIORITY } = await import('./http');
		const done = getData(link('1'), PRIORITY.action);
		await vi.advanceTimersByTimeAsync(500);
		expect(calls).toBe(1);
		await vi.advanceTimersByTimeAsync(600);
		await done;
		expect(calls).toBe(2);
	});

	it('зависший запрос освобождает очередь через 15 секунд', async () => {
		const sent: string[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn((_url: string, init?: { body?: FormData }) => {
				sent.push(String(init?.body?.get('x')));
				return sent.length === 1 ? new Promise(() => undefined) : Promise.resolve({ status: 200, text: async () => '<data/>' });
			}),
		);
		const { getData } = await import('./http');
		void getData(link('stuck'));
		const next = getData(link('next'));
		await vi.advanceTimersByTimeAsync(14_000);
		expect(sent).toEqual(['stuck']);
		await vi.advanceTimersByTimeAsync(2000);
		await next;
		expect(sent).toEqual(['stuck', 'next']);
	});
});
