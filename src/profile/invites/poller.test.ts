import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../bots/common', () => ({ botAuth: vi.fn(), loadBotProfile: vi.fn(), asArray: (value: unknown) => (value == null ? [] : Array.isArray(value) ? value : [value]) }));
vi.mock('./players', () => ({ loadPlayers: vi.fn() }));
vi.mock('./invites', async (importOriginal) => ({ ...(await importOriginal<typeof import('./invites')>()), fetchInvites: vi.fn() }));
vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { parseResponse } from '../../api/parse';
import { setSession } from '../session';
import { botAuth, loadBotProfile } from '../bots/common';
import { getGame } from '../../api/game';
import { getInvitesContext, setBattleSession } from './battleStore';
import { fetchInvites, type Invite } from './invites';
import { InvitesPoller, POLL_MS, emptyInvites, type InvitesState } from './poller';
import { loadPlayers } from './players';

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const invite = (overrides: Partial<Invite>): Invite => ({ id: 1, uid: 10, npc: 300, fightId: 1, guild: 0, players: 1, name: '', others: [], ...overrides });
const profile = (extra = '') =>
	parseResponse(
		`<data><u id="7" name="Я" aid="8" lvl="67" en="50" dmgi="1000" end="1" endi="1" clan_id="0" s1="0" s2="0" s3="0" s4="0" item1="0" item2="0" item3="0"/>${extra}</data>`,
	);
const players = { time: '2026.10.22', ids: [1, 2, 3], byId: new Map() };

/** Опрос с накоплением событий: что стало состоянием и сколько раз менялась загрузка. */
function make(owner = 'o1') {
	let state: InvitesState = emptyInvites(owner);
	const loading: boolean[] = [];
	const poller = new InvitesPoller(owner, {
		state: (update) => {
			state = update(state);
		},
		loading: (value) => loading.push(value),
	});
	return { poller, loading, get: () => state };
}

describe('InvitesPoller', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(botAuth).mockReset().mockReturnValue(bot);
		vi.mocked(loadBotProfile)
			.mockReset()
			.mockResolvedValue(profile() as never);
		vi.mocked(loadPlayers).mockReset().mockResolvedValue(players);
		vi.mocked(fetchInvites)
			.mockReset()
			.mockResolvedValue([invite({ id: 1, npc: 100, fightId: 1 }), invite({ id: 2, npc: 300, fightId: 2 })]);
		vi.mocked(getGame).mockReset().mockResolvedValue(profile());
		setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
		setBattleSession(null);
	});
	afterEach(() => vi.useRealTimers());

	it('первый опрос: готовит контекст и отдаёт список по убыванию босса', async () => {
		const { poller, get, loading } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(get().invites?.map((item) => item.npc)).toEqual([300, 100]);
		expect(get()).toMatchObject({ owner: 'o1', failed: false, players });
		expect(getInvitesContext()).toMatchObject({ current: null, player: { level: 67 } });
		expect(loading).toEqual([true, false]);
		poller.stop();
	});

	it('пока поверх страницы окно, опрос по таймеру стоит; после закрытия обновляется, если минута прошла', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		poller.pause();
		await vi.advanceTimersByTimeAsync(POLL_MS * 3);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		poller.resume();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
		poller.stop();
	});

	it('окно закрыто раньше, чем прошла минута: опрос ждёт остаток минуты', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		poller.pause();
		await vi.advanceTimersByTimeAsync(20_000);
		poller.resume();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(POLL_MS - 20_000);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
		poller.stop();
	});

	it('повторяется раз в минуту; после остановки опрос не идёт', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
		poller.stop();
		await vi.advanceTimersByTimeAsync(POLL_MS * 3);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
	});

	it('сбой опроса не стирает прежний список, а помечает его', async () => {
		const { poller, get } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		vi.mocked(fetchInvites).mockResolvedValueOnce(null);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(get().failed).toBe(true);
		expect(get().invites).toHaveLength(2);
		poller.stop();
	});

	it('нет ключа авторизации — список не строится, опрос помечается неудачным', async () => {
		vi.mocked(botAuth).mockReturnValue(null);
		const { poller, get } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(get()).toMatchObject({ invites: null, failed: true });
		expect(fetchInvites).not.toHaveBeenCalled();
		poller.stop();
	});

	it('скрытая вкладка: опрос ждёт, пока вкладка снова станет видимой', async () => {
		const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(POLL_MS * 2);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		hidden.mockReturnValue(false);
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
		poller.stop();
		hidden.mockRestore();
	});

	it('бой, в котором персонаж, берётся из профиля игры при каждом опросе, в памяти он не хранится', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(getInvitesContext()?.current).toBeNull();
		// Вступили в бой сами (в игре или в другой вкладке): следующий опрос покажет его текущим
		vi.mocked(getGame).mockResolvedValue(profile('<fight hp="500" mhp="1000" dmg="10" myhp="800" myr="10" eid="69" fid="42" res="2" time="5"/>') as never);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(getInvitesContext()?.current?.battle.fightId).toBe(42);
		// Бой закончился: профиль без боя убирает его
		vi.mocked(getGame).mockResolvedValue(profile() as never);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(getInvitesContext()?.current).toBeNull();
		poller.stop();
	});

	it('сбой запроса профиля прежние данные не стирает', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		vi.mocked(getGame).mockResolvedValue(profile('<fight hp="500" mhp="1000" dmg="10" myhp="800" myr="10" eid="69" fid="42" res="2" time="5"/>') as never);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		vi.mocked(getGame).mockResolvedValue(null);
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(getInvitesContext()?.current?.battle.fightId).toBe(42);
		poller.stop();
	});

	it('первый профиль грузится один раз, дальше каждый опрос берёт свежий', async () => {
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(loadBotProfile).toHaveBeenCalledTimes(1);
		expect(getGame).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(POLL_MS);
		expect(loadBotProfile).toHaveBeenCalledTimes(1);
		expect(getGame).toHaveBeenCalledTimes(1);
		poller.stop();
	});

	it('просьба обновить во время опроса не теряется: сразу после него идёт ещё один', async () => {
		let release: (value: Invite[]) => void = () => undefined;
		vi.mocked(fetchInvites).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(1);
		void poller.poll();
		release([invite({ id: 1 })]);
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchInvites).toHaveBeenCalledTimes(2);
		poller.stop();
	});

	it('неожиданный сбой опроса: список помечается устаревшим, загрузка не зависает', async () => {
		vi.mocked(fetchInvites).mockRejectedValueOnce(new Error('сбой'));
		const { poller, get, loading } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(get().failed).toBe(true);
		expect(loading.at(-1)).toBe(false);
		poller.stop();
	});

	it('«текущий бой» известен сразу, не дожидаясь файла игроков', async () => {
		let release: (value: typeof players) => void = () => undefined;
		vi.mocked(loadPlayers).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		vi.mocked(loadBotProfile).mockResolvedValue(profile('<fight hp="500" mhp="1000" dmg="10" myhp="800" myr="10" eid="69" fid="42" res="2" time="5"/>') as never);
		const { poller } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(getInvitesContext()?.current?.battle.fightId).toBe(42);
		release(players);
		await vi.advanceTimersByTimeAsync(0);
		poller.stop();
	});

	it('опрос остановленного (сменили профиль) не меняет состояние: ответ прежнего профиля отбрасывается', async () => {
		let release: (value: Invite[]) => void = () => undefined;
		vi.mocked(fetchInvites).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const { poller, get } = make();
		poller.start();
		await vi.advanceTimersByTimeAsync(0);
		poller.stop();
		release([invite({ id: 9 })]);
		await vi.advanceTimersByTimeAsync(0);
		expect(get().invites).toBeNull();
	});
});
