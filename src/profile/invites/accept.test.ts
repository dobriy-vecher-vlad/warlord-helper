import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../lib/async', () => ({ wait: vi.fn(async () => undefined) }));

import { getGame } from '../../api/game';
import { callFriends, createFight, enterFight, fetchBoss, fetchFight, parseNpcs, type Npc } from './accept';
import type { Invite } from './invites';

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const invite: Invite = { id: 1, uid: 77, npc: 69, fightId: 500, guild: 0, players: 2, name: '', others: [] };
const npc: Npc = { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 };
const player = { _lvl: '67', _en: '49', _dmgi: '1000', _s3: '10' };
const info = { fight: { _id: '500' }, u: { _hp: '5000', _mhp: '9000', _avail: '4' } };

describe('parseNpcs', () => {
	it('читает место, тип и цену боя; один узел приходит объектом', () => {
		const many = parseNpcs({ npcs: { npc: [{ u: { _id: '69', _rid: '13', _rn: '2', _type: '1', _rq1: '30', _rlmt: '5' } }, { u: { _id: '' } }] } });
		expect(many.get(69)).toEqual(npc);
		expect(many.size).toBe(1);
		expect(parseNpcs({ npcs: { npc: { u: { _id: '3' } } } }).has(3)).toBe(true);
		expect(parseNpcs({}).size).toBe(0);
	});
});

describe('fetchFight', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
	});

	it('передаёт параметры клиента игры и читает здоровье и попытки', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(info);
		expect(await fetchFight(bot, invite, npc)).toEqual({ hp: 5000, maxHp: 9000, left: 4, next: 0 });
		expect(vi.mocked(getGame).mock.calls[0]![1]).toEqual({ i: 10, t1: 13, t2: 2, t3: 77, t4: 69, t5: 1, fid: 500 });
	});

	it('нет боя — null', async () => {
		vi.mocked(getGame).mockResolvedValueOnce('');
		expect(await fetchFight(bot, invite, npc)).toBeNull();
	});
});

describe('enterFight', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
	});
	const joined = { fight: { _fid: '500', _eid: '69', _hp: '5000', _mhp: '9000', _dmg: '10', _myhp: '100000', _myr: '10', _time: '0', _res: '2' } };

	it('проверяет бой и входит в него, не нанося ударов', async () => {
		vi.mocked(getGame)
			.mockResolvedValueOnce({ u: { ...player, _id: '7', _name: 'Я', _aid: '8' } })
			.mockResolvedValueOnce(info)
			.mockResolvedValueOnce(joined);
		const result = await enterFight(bot, invite, npc, 5);
		expect(result).toMatchObject({ ok: true, battle: { fightId: 500, npc: 69, hp: 5000, rage: 10 }, fighter: { dmg: 1000 }, me: { id: 7, name: 'Я', avatar: 8 } });
		const calls = vi.mocked(getGame).mock.calls.map((call) => call[1] as { i?: number });
		expect(calls.map((call) => call.i)).toEqual([undefined, 10, 11]);
		expect(calls[2]).toEqual({ i: 11, t: 69, t2: 1, t3: 0, t4: 77, t5: 0, fid: 500 });
	});

	it('не хватает энергии или уровня — в бой не входит', async () => {
		vi.mocked(getGame).mockResolvedValueOnce({ u: { ...player, _en: '4' } });
		expect(await enterFight(bot, invite, npc, 5)).toEqual({ ok: false, message: 'Не хватает энергии' });
		vi.mocked(getGame).mockResolvedValueOnce({ u: { ...player, _lvl: '10' } });
		expect(await enterFight(bot, invite, npc, 5)).toEqual({ ok: false, message: 'Нужен 30 уровень' });
		expect(getGame).toHaveBeenCalledTimes(2);
	});

	it('устаревшее приглашение: сервер присылает другой номер боя, в бой не входим', async () => {
		vi.mocked(getGame)
			.mockResolvedValueOnce({ u: player })
			.mockResolvedValueOnce({ fight: { _id: '999' }, u: { _hp: '9000', _mhp: '9000', _avail: '4' } });
		const result = await enterFight(bot, invite, npc, 5);
		expect(result).toEqual({ ok: false, message: 'Приглашение устарело: бой уже закончился' });
		expect(getGame).toHaveBeenCalledTimes(2);
	});

	it('попыток нет — в бой не входим', async () => {
		vi.mocked(getGame)
			.mockResolvedValueOnce({ u: player })
			.mockResolvedValueOnce({ fight: { _id: '500' }, u: { _hp: '5000', _mhp: '9000', _avail: '0' } });
		expect(await enterFight(bot, invite, npc, 5)).toEqual({ ok: false, message: 'Попытки на сегодня закончились' });
	});

	it('нет ответа на вход в бой — повтор через 3 секунды и отказ', async () => {
		vi.mocked(getGame).mockResolvedValueOnce({ u: player }).mockResolvedValueOnce(info).mockResolvedValueOnce('').mockResolvedValueOnce('');
		expect(await enterFight(bot, invite, npc, 5)).toEqual({ ok: false, message: 'Не удалось войти в бой' });
	});
});

describe('createFight', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
	});
	const joined = { fight: { _fid: '600', _eid: '69', _hp: '9000', _mhp: '9000', _dmg: '10', _myhp: '100000', _myr: '10', _time: '0', _res: '2' } };
	const boss = { u: { _hp: '9000', _mhp: '9000', _avail: '3', _nrgn: '120' } };

	it('данные босса без боя: попытки и время до новой', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(boss);
		expect(await fetchBoss(bot, npc)).toEqual({ hp: 9000, maxHp: 9000, left: 3, next: 120 });
		expect(vi.mocked(getGame).mock.calls[0]![1]).toEqual({ i: 10, t1: 13, t2: 2, t3: 0, t4: 69, t5: 1, fid: 0 });
	});

	it('создаёт бой без приглашающего и номера боя', async () => {
		vi.mocked(getGame).mockResolvedValueOnce({ u: player }).mockResolvedValueOnce(boss).mockResolvedValueOnce(joined);
		const result = await createFight(bot, npc, 5);
		expect(result).toMatchObject({ ok: true, battle: { fightId: 600, npc: 69 } });
		expect(vi.mocked(getGame).mock.calls[2]![1]).toEqual({ i: 11, t: 69, t2: 1, t3: 0, t4: 0, t5: 0, fid: 0 });
	});

	it('попыток нет или босса не получить — бой не создаётся', async () => {
		vi.mocked(getGame)
			.mockResolvedValueOnce({ u: player })
			.mockResolvedValueOnce({ u: { ...boss.u, _avail: '0' } });
		expect(await createFight(bot, npc, 5)).toEqual({ ok: false, message: 'Попытки на сегодня закончились' });
		vi.mocked(getGame).mockResolvedValueOnce({ u: player }).mockResolvedValueOnce('');
		expect(await createFight(bot, npc, 5)).toEqual({ ok: false, message: 'Не удалось получить данные босса' });
		expect(getGame).toHaveBeenCalledTimes(4);
	});
});

describe('callFriends', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
	});

	it('зовёт всех друзей методом 29; res = 1 — приглашение отправлено', async () => {
		vi.mocked(getGame)
			.mockResolvedValueOnce({ a: { _res: '1' } })
			.mockResolvedValueOnce({ a: { _res: '0' } });
		expect(await callFriends(bot)).toBe(true);
		expect(await callFriends(bot)).toBe(false);
		expect(vi.mocked(getGame).mock.calls[0]![1]).toEqual({ i: 29 });
	});
});
