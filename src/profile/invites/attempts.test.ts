import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./accept', () => ({ fetchBoss: vi.fn() }));

import { fetchBoss } from './accept';
import { AttemptsQueue, clearAttempts, loadAttempts } from './attempts';

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const npc = (id: number) => ({ id, region: 1, place: 1, type: 1, level: 1, tries: 5 });

describe('loadAttempts', () => {
	beforeEach(() => {
		vi.mocked(fetchBoss).mockReset();
		clearAttempts();
	});

	it('ответ запоминается на 20 секунд: повторный запрос того же босса не уходит на сервер', async () => {
		vi.mocked(fetchBoss).mockResolvedValue({ hp: 1, maxHp: 1, left: 3, next: 0 });
		await loadAttempts(bot, npc(501));
		await loadAttempts(bot, npc(501));
		expect(fetchBoss).toHaveBeenCalledTimes(1);
		await loadAttempts(bot, npc(502));
		expect(fetchBoss).toHaveBeenCalledTimes(2);
	});

	it('сброс кэша (бой создан или закончен): босс спрашивается заново', async () => {
		vi.mocked(fetchBoss).mockResolvedValue({ hp: 1, maxHp: 1, left: 3, next: 0 });
		await loadAttempts(bot, npc(504));
		clearAttempts();
		await loadAttempts(bot, npc(504));
		expect(fetchBoss).toHaveBeenCalledTimes(2);
	});

	it('через 20 секунд спрашивается заново', async () => {
		vi.mocked(fetchBoss).mockResolvedValue({ hp: 1, maxHp: 1, left: 3, next: 0 });
		await loadAttempts(bot, npc(503));
		await loadAttempts(bot, npc(503), Date.now() + 21_000);
		expect(fetchBoss).toHaveBeenCalledTimes(2);
	});
});

describe('AttemptsQueue', () => {
	beforeEach(() => {
		vi.mocked(fetchBoss).mockReset();
		clearAttempts();
	});
	const npcs = new Map([601, 602, 603].map((id) => [id, npc(id)]));

	it('боссы спрашиваются по одному, каждый один раз, результат отдаётся по мере получения', async () => {
		const order: string[] = [];
		vi.mocked(fetchBoss).mockImplementation(async (_bot, item) => {
			order.push(`старт ${item.id}`);
			await new Promise((resolve) => setTimeout(resolve, 5));
			order.push(`конец ${item.id}`);
			return { hp: 1, maxHp: 1, left: item.id - 600, next: 0 };
		});
		const got: Array<[number, number | undefined]> = [];
		const queue = new AttemptsQueue(bot, npcs, (id, info) => got.push([id, info?.left]));
		queue.request(601);
		queue.request(602);
		queue.request(601);
		queue.request(999);
		await new Promise((resolve) => setTimeout(resolve, 40));
		expect(order).toEqual(['старт 601', 'конец 601', 'старт 602', 'конец 602']);
		expect(got).toEqual([
			[601, 1],
			[602, 2],
		]);
	});

	it('refresh спрашивает заново всех, кого уже спрашивали', async () => {
		let left = 1;
		vi.mocked(fetchBoss).mockImplementation(async () => ({ hp: 1, maxHp: 1, left: left++, next: 0 }));
		const got: number[] = [];
		const queue = new AttemptsQueue(bot, npcs, (_id, info) => got.push(info!.left));
		queue.request(601);
		queue.request(602);
		await new Promise((resolve) => setTimeout(resolve, 10));
		queue.refresh();
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(got).toEqual([1, 2, 3, 4]);
	});

	it('быстрая прокрутка: босс, ушедший с экрана до своей очереди, не запрашивается; вернувшийся — запрашивается', async () => {
		const asked: number[] = [];
		vi.mocked(fetchBoss).mockImplementation(async (_bot, item) => {
			asked.push(item.id);
			await new Promise((resolve) => setTimeout(resolve, 5));
			return { hp: 1, maxHp: 1, left: item.id - 600, next: 0 };
		});
		const got: number[] = [];
		const queue = new AttemptsQueue(bot, npcs, (id) => got.push(id));
		queue.request(601);
		queue.request(602);
		queue.request(603);
		// 601 уже в пути, 602 и 603 ждали и ушли с экрана
		queue.cancel(602);
		queue.cancel(603);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(asked).toEqual([601]);
		expect(got).toEqual([601]);
		// 602 вернулся на экран: спрашивается, а полученный 601 повторно нет
		queue.request(601);
		queue.request(602);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(asked).toEqual([601, 602]);
	});

	it('refresh спрашивает заново только тех, кто на экране сейчас', async () => {
		let left = 1;
		vi.mocked(fetchBoss).mockImplementation(async () => ({ hp: 1, maxHp: 1, left: left++, next: 0 }));
		const got: Array<[number, number]> = [];
		const queue = new AttemptsQueue(bot, npcs, (id, info) => got.push([id, info!.left]));
		queue.request(601);
		queue.request(602);
		await new Promise((resolve) => setTimeout(resolve, 10));
		queue.cancel(601);
		queue.refresh();
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(got.map(([id]) => id)).toEqual([601, 602, 602]);
	});

	it('после остановки очередь не продолжается и ничего не отдаёт', async () => {
		vi.mocked(fetchBoss).mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			return { hp: 1, maxHp: 1, left: 1, next: 0 };
		});
		const got: number[] = [];
		const queue = new AttemptsQueue(bot, npcs, (id) => got.push(id));
		queue.request(603);
		queue.request(602);
		queue.stop();
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(got).toEqual([]);
		queue.request(601);
		expect(fetchBoss).toHaveBeenCalledTimes(1);
	});
});
