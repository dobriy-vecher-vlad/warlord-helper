import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { getGame } from '../../api/game';
import { parseResponse } from '../../api/parse';
import type { FightInfo } from '../../profile/invites/accept';
import { useBattleSync } from '../../profile/invites/battleFlow';
import { setBattleSession, setInvitesContext, startBattle } from '../../profile/invites/battleStore';
import { setSession } from '../../profile/session';
import { closeModal } from '../../store/modal';
import { act } from 'react';
import { flush, installBrowserStubs, render } from '../../test/harness';
import { useFightStats } from './useBossStats';

installBrowserStubs();

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const npc = { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 };
const fighter = { dmg: 1000, skills: { 1: 0, 2: 0, 3: 0, 4: 0 } as const, lightning: 0, fire: 0, potions: 0 };
const battle = { fightId: 5, npc: 69, hp: 1000, maxHp: 1000, bossDmg: 10, myHp: 500, rage: 10, elapsed: 0, receivedAt: 0, won: false, lost: false, participants: [] };
const roundResponse = parseResponse('<data><fight hp="900" mhp="1000" dmg="10" myhp="500" myr="10" eid="69" fid="5" res="2" time="10"/></data>');
const rounds = () => vi.mocked(getGame).mock.calls.filter((call) => (call[1] as { i?: number } | undefined)?.i === 12).length;

function SyncProbe({ open }: { open: boolean }) {
	useBattleSync(open);
	return null;
}

describe('useBattleSync', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(getGame).mockReset().mockResolvedValue(roundResponse);
		closeModal();
		setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
		startBattle(bot, battle, fighter, { id: 7, name: 'Я', avatar: 8 }, null);
	});
	afterEach(() => {
		vi.useRealTimers();
		setBattleSession(null);
	});

	it('раз в 5 секунд шлёт пустой раунд, пока окно открыто', async () => {
		await render(<SyncProbe open />);
		// Сразу при открытии: профиль даёт участников без ников и аватарок, их присылает только раунд боя
		await vi.advanceTimersByTimeAsync(0);
		expect(rounds()).toBe(1);
		await vi.advanceTimersByTimeAsync(5000);
		expect(rounds()).toBe(2);
		await vi.advanceTimersByTimeAsync(10_000);
		expect(rounds()).toBe(4);
	});

	it('закрытое окно бой не обновляет', async () => {
		await render(<SyncProbe open={false} />);
		await vi.advanceTimersByTimeAsync(20_000);
		expect(rounds()).toBe(0);
	});

	it('скрытая вкладка не обновляется, а при возвращении — сразу', async () => {
		const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
		await render(<SyncProbe open />);
		await vi.advanceTimersByTimeAsync(15_000);
		expect(rounds()).toBe(0);
		hidden.mockReturnValue(false);
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(0);
		expect(rounds()).toBe(1);
		hidden.mockRestore();
	});
});

const info = (left: number): FightInfo => ({ hp: 1, maxHp: 1, left, next: 0 });

function StatsProbe({ open, id, load }: { open: boolean; id: number; load: () => Promise<FightInfo | null> }) {
	const { info: loaded, player, wait } = useFightStats(open, id, load);
	return (
		<div>
			<span id="info">{loaded === undefined ? 'загрузка' : loaded === null ? 'нет' : String(loaded.left)}</span>
			<span id="player">{player ? String(player.energy) : '-'}</span>
			<span id="wait">{wait === null ? '-' : String(wait)}</span>
		</div>
	);
}
/** Прокрутить таймеры так, чтобы React успел применить обновления состояния. */
const advance = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const read = (id: string) => document.getElementById(id)?.textContent;

describe('useFightStats', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(getGame)
			.mockReset()
			.mockResolvedValue({ u: { _en: '51', _dmgi: '1', _end: '1', _endi: '1' } });
		setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
		setInvitesContext({ bot, npcs: new Map([[69, npc]]), players: null, player: null });
	});
	afterEach(() => vi.useRealTimers());

	it('состояние обновляется каждые 5 секунд, персонаж (весь профиль) загружается один раз', async () => {
		const load = vi.fn().mockResolvedValueOnce(info(4)).mockResolvedValue(info(3));
		await render(<StatsProbe open id={1} load={load} />);
		await flush();
		expect(read('info')).toBe('4');
		expect(read('player')).toBe('51');
		await advance(5000);
		expect(read('info')).toBe('3');
		await advance(10_000);
		expect(load).toHaveBeenCalledTimes(4);
		expect(vi.mocked(getGame)).toHaveBeenCalledTimes(1);
	});

	it('до первого ответа — «загрузка»; смена ключа сбрасывает показанное', async () => {
		let release: (value: FightInfo) => void = () => undefined;
		const load = vi.fn(() => new Promise<FightInfo>((resolve) => (release = resolve)));
		await render(<StatsProbe open id={1} load={load} />);
		expect(read('info')).toBe('загрузка');
		await advance(0);
		release(info(2));
		await flush();
		expect(read('info')).toBe('2');
	});

	it('время до новой попытки тикает вживую', async () => {
		const load = vi.fn().mockResolvedValue({ ...info(1), next: 120 });
		await render(<StatsProbe open id={1} load={load} />);
		await flush();
		expect(Number(read('wait'))).toBeGreaterThan(100);
		await advance(3000);
		expect(Number(read('wait'))).toBeLessThan(120);
	});

	it('скрытая вкладка не опрашивается, при возвращении состояние обновляется сразу', async () => {
		const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
		const load = vi.fn().mockResolvedValue(info(1));
		await render(<StatsProbe open id={1} load={load} />);
		await advance(15_000);
		expect(load).not.toHaveBeenCalled();
		hidden.mockReturnValue(false);
		document.dispatchEvent(new Event('visibilitychange'));
		await advance(0);
		expect(load).toHaveBeenCalledTimes(1);
		hidden.mockRestore();
	});

	it('закрытое окно ничего не запрашивает', async () => {
		const load = vi.fn().mockResolvedValue(info(1));
		await render(<StatsProbe open={false} id={1} load={load} />);
		await advance(10_000);
		expect(load).not.toHaveBeenCalled();
	});
});
