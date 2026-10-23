import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { getGame } from '../../api/game';
import { parseResponse } from '../../api/parse';
import { chunks, fetchInvites, parseInvites, sortInvites, visibleInvites, type Invite } from './invites';

const invite = (overrides: Partial<Invite> = {}): Invite => ({ id: 1, uid: 10, npc: 300, fightId: 5, guild: 0, players: 3, name: '', others: [], ...overrides });

describe('parseInvites', () => {
	it('читает поля из дочерних элементов (так присылает КПК)', () => {
		const data = parseResponse('<data><ur><id>5</id><uid>7</uid><t>1</t><v2>304</v2><v3>99</v3><v5>0</v5><d1>12</d1><n>Имя</n></ur></data>');
		expect(parseInvites(data)).toEqual([{ id: 5, uid: 7, npc: 304, fightId: 99, guild: 0, players: 12, name: 'Имя', others: [] }]);
	});

	it('читает и атрибуты, если сервер пришлёт их', () => {
		const data = parseResponse('<data><ur id="5" uid="7" t="1" v2="304" v3="9" v5="40" d1="2"/></data>');
		expect(parseInvites(data)).toEqual([{ id: 5, uid: 7, npc: 304, fightId: 9, guild: 40, players: 2, name: '', others: [] }]);
	});

	it('один узел и несколько узлов приходят по-разному, оба разбираются', () => {
		const two = parseResponse('<data><ur><id>1</id><t>1</t></ur><ur><id>2</id><t>1</t></ur></data>');
		expect(parseInvites(two).map((item) => item.id)).toEqual([1, 2]);
	});

	it('пропускает сообщения других типов и узлы без номера', () => {
		const data = parseResponse('<data><ur><id>1</id><t>2</t></ur><ur><t>1</t></ur><ur><id>3</id><t>1</t></ur></data>');
		expect(parseInvites(data).map((item) => item.id)).toEqual([3]);
	});

	it('пустой ответ и непригодные значения дают пустой список', () => {
		expect(parseInvites(parseResponse('<?xml version="1.0" encoding="utf-8"?><data></data>'))).toEqual([]);
		expect(parseInvites(null)).toEqual([]);
		expect(parseInvites('текст')).toEqual([]);
	});
});

describe('visibleInvites', () => {
	it('оставляет приглашения для всех и для гильдии игрока', () => {
		const list = [invite({ id: 1, fightId: 1, guild: 0 }), invite({ id: 2, fightId: 2, guild: 40 }), invite({ id: 3, fightId: 3, guild: 41 })];
		expect(visibleInvites(list, 40).map((item) => item.id)).toEqual([1, 2]);
		expect(visibleInvites(list, 0).map((item) => item.id)).toEqual([1]);
	});

	it('убирает повторы по номеру сообщения', () => {
		expect(visibleInvites([invite({ id: 1, fightId: 1 }), invite({ id: 1, fightId: 1 }), invite({ id: 2, fightId: 2 })], 0)).toHaveLength(2);
	});
});

describe('visibleInvites: объединение', () => {
	it('несколько приглашений на один бой — одно, остальные приглашающие в others', () => {
		const list = [
			invite({ id: 1, uid: 10, fightId: 7, players: 3 }),
			invite({ id: 5, uid: 20, fightId: 7, players: 4 }),
			invite({ id: 3, uid: 30, fightId: 7 }),
			invite({ id: 2, uid: 40, fightId: 8 }),
		];
		const result = visibleInvites(list, 0);
		expect(result).toHaveLength(2);
		const merged = result.find((item) => item.fightId === 7)!;
		expect(merged).toMatchObject({ id: 5, uid: 20, players: 4 });
		expect([...merged.others].sort()).toEqual([10, 30]);
	});

	it('один игрок, позвавший дважды, в others не попадает; приглашения без номера боя не склеиваются; чужая гильдия отсекается раньше', () => {
		expect(visibleInvites([invite({ id: 1, uid: 10, fightId: 7 }), invite({ id: 2, uid: 10, fightId: 7 })], 0)[0]!.others).toEqual([]);
		expect(visibleInvites([invite({ id: 1, fightId: 0 }), invite({ id: 2, fightId: 0 })], 0)).toHaveLength(2);
		expect(visibleInvites([invite({ id: 1, uid: 10, fightId: 7 }), invite({ id: 2, uid: 20, fightId: 7, guild: 99 })], 0)[0]!.others).toEqual([]);
	});
});

describe('sortInvites', () => {
	it('сильные боссы выше: порядок по id босса, а не по номеру приглашения', () => {
		const sorted = sortInvites([invite({ id: 100, npc: 300 }), invite({ id: 1, npc: 474 }), invite({ id: 50, npc: 120 })]);
		expect(sorted.map((item) => item.npc)).toEqual([474, 300, 120]);
	});

	it('при равных боссах — где больше игроков, затем новее', () => {
		const sorted = sortInvites([invite({ id: 1, npc: 300, players: 2 }), invite({ id: 2, npc: 300, players: 9 }), invite({ id: 3, npc: 300, players: 2 })]);
		expect(sorted.map((item) => item.id)).toEqual([2, 3, 1]);
	});

	it('не меняет исходный список', () => {
		const list = [invite({ npc: 1 }), invite({ npc: 2 })];
		sortInvites(list);
		expect(list.map((item) => item.npc)).toEqual([1, 2]);
	});
});

describe('chunks', () => {
	it('делит на порции по 300', () => {
		const list = Array.from({ length: 650 }, (_, index) => index);
		expect(chunks(list).map((part) => part.length)).toEqual([300, 300, 50]);
		expect(chunks([])).toEqual([]);
	});
});

describe('fetchInvites', () => {
	const auth = { login: 1, password: 'k' };
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
	});

	it('шлёт порции по 300 id методом 67 и собирает приглашения', async () => {
		vi.mocked(getGame).mockImplementation(async (_server, body) => ({ ur: [{ id: String(body?.i === 67 ? 1000 + String(body.sdata).length : 0), t: '1', v2: '300' }] }));
		const ids = Array.from({ length: 650 }, (_, index) => index + 1);
		const result = await fetchInvites(1, auth, ids);
		expect(getGame).toHaveBeenCalledTimes(3);
		const [first] = vi.mocked(getGame).mock.calls[0]!.slice(1, 2);
		expect(first).toMatchObject({ i: 67, t: 33 });
		expect(String((first as { sdata: string }).sdata).startsWith('<data><u>1</u>')).toBe(true);
		expect(result).toHaveLength(3);
	});

	it('пустые ответы дают пустой список, а не ошибку', async () => {
		vi.mocked(getGame).mockResolvedValue('<?xml version="1.0" encoding="utf-8"?><data></data>');
		expect(await fetchInvites(1, auth, [1, 2, 3])).toEqual([]);
	});

	it('если одна порция без ответа — весь результат отсутствует', async () => {
		vi.mocked(getGame).mockResolvedValueOnce({ ur: [] }).mockResolvedValueOnce(null);
		expect(
			await fetchInvites(
				1,
				auth,
				Array.from({ length: 400 }, (_, index) => index + 1),
			),
		).toBeNull();
	});
});
