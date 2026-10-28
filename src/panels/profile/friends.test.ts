import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../profile/vk', () => ({ getBridge: vi.fn() }));
vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { getGame } from '../../api/game';
import { setSession } from '../../profile/session';
import { getBridge } from '../../profile/vk';
import { scanFriends } from './PeoplePanels';

/** Узел игрока в ответе сервера. */
const node = (id: number) => ({ _vkId: String(id), _id: String(id), _name: `Друг${id}`, _dmgi: String(id), _endi: '1', _end: '1', _lvl: '5', _exp: '10', _bd: '0', _l_t: '0' });

/** Ответ сервера на запрос `f_data`: по узлу на каждый переданный id. */
function answer(body: Record<string, string | number>) {
	const ids = [...String(body.f_data).matchAll(/<u>(\d+)<\/u>/g)].map((match) => Number(match[1]));
	return Promise.resolve({ u: ids.length === 1 ? node(ids[0]!) : ids.map(node) });
}

function friendsList(count: number, extra: number[] = []) {
	return [...Array.from({ length: count }, (_, index) => ({ id: 1000 + index, photo_50: `p${1000 + index}` })), ...extra.map((id) => ({ id }))];
}

function mockVk(items: { id: number; photo_50?: string }[]) {
	vi.mocked(getBridge).mockReset();
	vi.mocked(getBridge).mockResolvedValueOnce({ access_token: 'token' }).mockResolvedValueOnce({ response: { items } });
}

describe('scanFriends', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		vi.mocked(getGame).mockImplementation((_server, body) => answer(body ?? {}));
		setSession({ user: { id: 7, first_name: 'Я', last_name: 'Я' }, profiles: [{ id: 7, server: 1 }], index: 0 });
	});

	it('возвращает всех друзей, последний не пропадает', async () => {
		mockVk(friendsList(3));
		const result = await scanFriends();
		expect(Array.isArray(result) && result.map((friend) => friend.id).sort()).toEqual([1000, 1001, 1002]);
	});

	it('убирает самого пользователя, если сервер вернул и его', async () => {
		mockVk(friendsList(2, [7]));
		const result = await scanFriends();
		expect(Array.isArray(result) && result.map((friend) => friend.id)).not.toContain(7);
		expect(Array.isArray(result) && result).toHaveLength(2);
	});

	it('делит друзей на запросы по 300 и собирает всех', async () => {
		mockVk(friendsList(650));
		const result = await scanFriends();
		expect(getGame).toHaveBeenCalledTimes(3);
		expect(Array.isArray(result) && result).toHaveLength(650);
	});

	it('сортирует по урону и нумерует места', async () => {
		mockVk(friendsList(3));
		const result = (await scanFriends()) as { id: number; x: number }[];
		expect(result.map((friend) => friend.id)).toEqual([1002, 1001, 1000]);
		expect(result.map((friend) => friend.x)).toEqual([1, 2, 3]);
	});

	it('ошибка одной из страниц даёт ошибку, а не пустой список друзей', async () => {
		mockVk(friendsList(650));
		vi.mocked(getGame).mockImplementation((_server, body) => (String(body?.f_data).includes('<u>1300</u>') ? Promise.resolve(null) : answer(body ?? {})));
		const result = await scanFriends();
		expect(result).toEqual({ error: 'Игровой сервер не ответил' });
	});

	it('пустой список друзей — пустой результат без запросов к серверу', async () => {
		mockVk([]);
		expect(await scanFriends()).toEqual([]);
		expect(getGame).not.toHaveBeenCalled();
	});

	it('VK не вернул ответ со списком друзей — это ошибка, а не «нет друзей»', async () => {
		vi.mocked(getBridge).mockReset();
		vi.mocked(getBridge)
			.mockResolvedValueOnce({ access_token: 'token' })
			.mockResolvedValueOnce({ error_data: { error_reason: 'Too many requests' } });
		const result = await scanFriends();
		expect(Array.isArray(result)).toBe(false);
		expect(getGame).not.toHaveBeenCalled();
	});

	it('равный урон не путает порядок: места стабильны', async () => {
		mockVk(friendsList(3));
		vi.mocked(getGame).mockImplementation(async (_server, body) => {
			const reply = (await answer(body ?? {})) as { u: Record<string, string>[] };
			return { u: reply.u.map((user) => ({ ...user, _dmgi: '5' })) };
		});
		const result = (await scanFriends()) as { id: number; x: number }[];
		expect(result.map((friend) => friend.id)).toEqual([1000, 1001, 1002]);
	});

	it('отказ в доступе к друзьям возвращает причину', async () => {
		vi.mocked(getBridge).mockReset();
		vi.mocked(getBridge).mockResolvedValueOnce({ error_data: { error_reason: 'User denied' } });
		expect(await scanFriends()).toEqual({ error: 'User denied' });
	});
});
