import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { getGame } from '../../api/game';
import { parseResponse } from '../../api/parse';
import { closeModal, getModalStack } from '../../store/modal';
import { setSession } from '../session';
import { BATTLE_SECONDS, type Battle, type Fighter } from './battle';
import { endIfFinished, syncBattle } from './battleFlow';
import { getBattleSession, startBattle } from './battleStore';

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const battle: Battle = { fightId: 5, npc: 69, hp: 1000, maxHp: 1000, bossDmg: 10, myHp: 500, rage: 10, elapsed: 0, receivedAt: 0, won: false, lost: false, participants: [] };
const fighter: Fighter = { dmg: 100, skills: { 1: 0, 2: 0, 3: 0, 4: 0 }, lightning: 0, fire: 0, potions: 0 };
const me = { id: 7, name: 'Я', avatar: 8 };
const fight = (attrs: string) => parseResponse(`<data><fight hp="900" mhp="1000" dmg="10" myhp="500" myr="10" eid="69" fid="5" res="2" ${attrs}/></data>`);

describe('конец боя', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		closeModal();
		setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
		startBattle(bot, battle, fighter, me, null);
	});

	it('бой идёт — ничего не происходит', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(fight('time="100"'));
		await syncBattle();
		expect(getBattleSession()?.battle.elapsed).toBe(100);
		expect(getModalStack()).toHaveLength(0);
	});

	it('время боя 2 часа: на нуле босс побеждает — открываются итоги без награды, бой снимается', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(fight(`time="${BATTLE_SECONDS}"`));
		await syncBattle();
		expect(getBattleSession()).toBeNull();
		const top = getModalStack().at(-1)!;
		expect(top.id).toBe('battleResult');
		expect(top.data).toMatchObject({ npc: 69, lines: [], timeout: true });
	});

	it('босса побеждают — итоги с наградой, не по таймеру', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(
			parseResponse('<data><fight hp="-1" mhp="1000" dmg="10" myhp="500" myr="0" eid="69" fid="5" res="3" time="50"/><r exp="5" m3="3"/></data>'),
		);
		await syncBattle();
		expect(getBattleSession()).toBeNull();
		expect(getModalStack().at(-1)!.data).toMatchObject({ timeout: false });
		expect((getModalStack().at(-1)!.data.lines as unknown[]).length).toBeGreaterThan(0);
	});

	it('гибель персонажа бой не заканчивает: бой общий', () => {
		expect(endIfFinished({ ok: true, battle: { ...battle, myHp: 0, lost: true }, lines: [] })).toBe(false);
		expect(getBattleSession()).not.toBeNull();
	});

	it('сбой запроса не ломает обновление', async () => {
		vi.mocked(getGame).mockRejectedValueOnce(new Error('сеть'));
		await expect(syncBattle()).resolves.toBeUndefined();
		expect(getBattleSession()).not.toBeNull();
	});
});
