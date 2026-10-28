import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));

import { getGame } from '../../api/game';
import { parseResponse } from '../../api/parse';
import { simulate, type Battle, type Fighter } from './battle';
import { setSession } from '../session';
import { closeModal, openModal } from '../../store/modal';
import { createBattle, getInvitesContext, refreshPlayer, roundBusy, runRound, setInvitesContext, showBattle } from './battleStore';
import { battleFromProfile, getBattleSession, markBattleFinished, participantName, playRound, setBattleSession, startBattle } from './battleStore';

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const battle: Battle = {
	fightId: 5,
	npc: 69,
	hp: 1_000_000,
	maxHp: 1_000_000,
	bossDmg: 100,
	myHp: 10_000,
	rage: 10,
	elapsed: 0,
	receivedAt: 0,
	won: false,
	lost: false,
	participants: [],
};
const fighter: Fighter = { dmg: 1000, skills: { 1: 0, 2: 0, 3: 0, 4: 0 }, lightning: 5, fire: 5, potions: 3 };
const me = { id: 7, name: 'Я', avatar: 8 };

/** Выбранный профиль: бой принадлежит профилю с этим сервером и логином. */
const selectProfile = (login: number, index = 0) =>
	setSession({
		profiles: [
			{ login, server: 1 },
			{ login: 2, server: 1 },
		] as never,
		index,
	});

/** Раунд, который воспроизводит сервер: хэш в запросе не разбираем, ответ задан в тесте. */
const round = (xml: string) => vi.mocked(getGame).mockResolvedValueOnce(parseResponse(xml));

describe('playRound', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		selectProfile(1);
		startBattle(bot, battle, fighter, me, null);
	});

	it('без боя ничего не отправляет', async () => {
		setBattleSession(null);
		expect(await playRound()).toEqual({ ok: false, message: 'Боя нет' });
		expect(getGame).not.toHaveBeenCalled();
	});

	it('пустой раунд обновляет бой и участников, запасы не меняются', async () => {
		round('<data><l id="3" n="Ян" ava="4" dd="500"/><fight hp="900" mhp="1000000" dmg="100" myhp="10000" myr="10" eid="69" fid="5" res="2"/></data>');
		const result = await playRound();
		expect(result).toMatchObject({ ok: true, lines: [], battle: { hp: 900, won: false } });
		expect(getBattleSession()?.battle.participants).toEqual([{ id: 3, name: 'Ян', avatar: 4, damage: 500 }]);
		expect(getBattleSession()?.fighter).toEqual(fighter);
		expect(vi.mocked(getGame).mock.calls[0]![1]).toMatchObject({ i: 12 });
	});

	it('удары уменьшают запас свитков и зелий', async () => {
		const plan = simulate(battle, fighter, { skill: 0, fire: 2, lightning: 1, potions: 3 }, 5);
		round('<data><fight hp="990000" mhp="1000000" dmg="100" myhp="9500" myr="10" eid="69" fid="5" res="2"/></data>');
		await playRound(plan);
		expect(getBattleSession()?.fighter).toMatchObject({ fire: 3, lightning: 4, potions: 3 });
	});

	it('победа: награда из ответа, в том числе предмет отдельным узлом', async () => {
		round('<data><fight hp="-5" mhp="1000000" dmg="100" myhp="9000" myr="0" eid="69" fid="5" res="3"/><r exp="2280" m3="310"/><r item="59" cnt="1" type="6"/></data>');
		const result = await playRound();
		expect(result.ok && result.battle.won).toBe(true);
		expect(result.ok && result.lines.length).toBeGreaterThan(0);
	});

	it('сервер отклонил расчёт — сообщение с кодом, состояние не меняется', async () => {
		round("<data><a res='0' dd='1' rid='13'/><err v='1011'/></data>");
		expect(await playRound()).toEqual({ ok: false, message: 'Сервер не принял удары (ошибка 1011)' });
		expect(getBattleSession()?.battle.hp).toBe(battle.hp);
	});
});

describe('battleFromProfile', () => {
	it('читает идущий бой и персонажа; без боя — null', () => {
		const profile = parseResponse(
			'<data><u id="7" name="Я" aid="8" dmgi="1000" s1="0" s2="0" s3="9" s4="0" item1="1" item2="2" item3="3"/><fight mhp="100" hp="60" dmg="5" myhp="40" myr="7" eid="69" fid="9" res="2"/></data>',
		) as Parameters<typeof battleFromProfile>[0];
		expect(battleFromProfile(profile)).toMatchObject({ battle: { fightId: 9 }, fighter: { dmg: 1000, lightning: 1, potions: 2, fire: 3 }, me: { id: 7, name: 'Я', avatar: 8 } });
		expect(battleFromProfile(parseResponse('<data><u id="7"/><fight eid="0"/></data>') as Parameters<typeof battleFromProfile>[0])).toBeNull();
	});

	it('побеждённый босс, чью награду ещё не забрали, остаётся текущим боем', () => {
		const profile = parseResponse(
			'<data><u id="7" name="Я" aid="8" dmgi="1000" s1="0" s2="0" s3="9" s4="0" item1="1" item2="2" item3="3"/><fight mhp="100" hp="0" dmg="5" myhp="40" myr="7" eid="69" fid="78" res="3"/></data>',
		) as Parameters<typeof battleFromProfile>[0];
		expect(battleFromProfile(profile)).toMatchObject({ battle: { fightId: 78, won: true } });
	});

	it('бой, который уже закончился, из запоздавшего профиля текущим не становится', () => {
		const profile = parseResponse(
			'<data><u id="7" name="Я" aid="8" dmgi="1000" s1="0" s2="0" s3="9" s4="0" item1="1" item2="2" item3="3"/><fight mhp="100" hp="60" dmg="5" myhp="40" myr="7" eid="69" fid="77" res="2"/></data>',
		) as Parameters<typeof battleFromProfile>[0];
		expect(battleFromProfile(profile)).not.toBeNull();
		markBattleFinished(77);
		expect(battleFromProfile(profile)).toBeNull();
	});
});

describe('participantName', () => {
	it('присланное имя, запомненное, из списка игроков, иначе Player<id>; своё имя берётся из профиля', () => {
		selectProfile(1);
		startBattle(bot, { ...battle, participants: [{ id: 3, name: 'Ян', avatar: null, damage: 1 }] }, fighter, me, null);
		const session = getBattleSession()!;
		expect(participantName(session, { id: 3, name: '', avatar: null, damage: 1 })).toBe('Ян');
		expect(participantName(session, { id: 4, name: '', avatar: null, damage: 1 })).toBe('Player4');
		expect(participantName(session, { id: 7, name: '', avatar: null, damage: 1 })).toBe('Я');
	});
});

describe('бой и профиль', () => {
	it('у каждого профиля свой бой: при переключении профиля чужой бой не виден и не используется', () => {
		selectProfile(1);
		startBattle(bot, battle, fighter, me, null);
		expect(getBattleSession()?.battle.fightId).toBe(5);
		setSession({ index: 1 });
		expect(getBattleSession()).toBeNull();
		setSession({ index: 0 });
		expect(getBattleSession()?.battle.fightId).toBe(5);
		setBattleSession(null);
		expect(getBattleSession()).toBeNull();
	});

	it('запрос раунда другого профиля не уходит с данными прежнего боя', async () => {
		selectProfile(1);
		startBattle(bot, battle, fighter, me, null);
		setSession({ index: 1 });
		vi.mocked(getGame).mockReset();
		expect(await playRound()).toEqual({ ok: false, message: 'Боя нет' });
		expect(getGame).not.toHaveBeenCalled();
	});
});

describe('playRound: окно закрыли во время запроса', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		selectProfile(1);
		closeModal();
		setInvitesContext({ bot, npcs: new Map(), players: null });
	});

	it('бой в память не возвращается, страница получает новое состояние', async () => {
		showBattle({ battle, fighter, me });
		let release: (value: unknown) => void = () => undefined;
		vi.mocked(getGame).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const pending = playRound();
		closeModal();
		expect(getBattleSession()).toBeNull();
		release(parseResponse('<data><fight hp="900000" mhp="1000000" dmg="100" myhp="9000" myr="10" eid="69" fid="5" res="2" time="10"/></data>'));
		await pending;
		expect(getBattleSession()).toBeNull();
		expect(getInvitesContext()?.current?.battle.hp).toBe(900_000);
	});

	it('босс убит, пока окно было закрыто: бой с «Текущего боя» страницы уходит и не возвращается из запоздавшего профиля', async () => {
		showBattle({ battle: { ...battle, fightId: 6 }, fighter, me });
		let release: (value: unknown) => void = () => undefined;
		vi.mocked(getGame).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const pending = playRound();
		closeModal();
		release(parseResponse('<data><fight hp="0" mhp="1000000" dmg="100" myhp="9000" myr="10" eid="69" fid="6" res="3" time="10"/></data>'));
		await pending;
		expect(getInvitesContext()?.current).toBeNull();
		expect(getBattleSession()).toBeNull();
	});
});

describe('refreshPlayer', () => {
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		selectProfile(1);
		closeModal();
		setInvitesContext({ bot, npcs: new Map(), players: null });
	});

	it('«текущий бой» берётся из свежего профиля', async () => {
		vi.mocked(getGame).mockResolvedValueOnce(
			parseResponse(
				'<data><u id="7" lvl="67" en="50" end="1" endi="1" s1="0" s2="0" s3="0" s4="0" item1="0" item2="0" item3="0"/><fight hp="9" mhp="10" dmg="1" myhp="5" myr="10" eid="69" fid="78" res="2"/></data>',
			),
		);
		expect((await refreshPlayer(bot, 1))?.level).toBe(67);
		expect(getInvitesContext()?.current?.battle.fightId).toBe(78);
	});

	it('бой, начатый в приложении, пока шёл запрос, прежним ответом не стирается', async () => {
		let release: (value: unknown) => void = () => undefined;
		vi.mocked(getGame).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const pending = refreshPlayer(bot, 1);
		showBattle({ battle, fighter, me });
		release(parseResponse('<data><u id="7" lvl="67" en="50" end="1" endi="1" s1="0" s2="0" s3="0" s4="0" item1="0" item2="0" item3="0"/></data>'));
		await pending;
		expect(getInvitesContext()?.current?.battle.fightId).toBe(5);
	});
});

describe('createBattle', () => {
	const npcs = new Map([[69, { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 }]]);
	const joined = '<data><fight hp="9000" mhp="9000" dmg="10" myhp="100000" myr="10" eid="69" fid="600" res="2"/></data>';
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		selectProfile(1);
		setBattleSession(null);
	});

	it('нет данных о боссе — бой не создаётся', async () => {
		setInvitesContext({ bot, npcs: new Map(), players: null });
		expect(await createBattle(69, 5)).toEqual({ ok: false, message: 'Нет данных о боссе, обновите страницу приглашений' });
	});

	it('пока идёт прежний бой, новый не создаётся', async () => {
		setInvitesContext({ bot, npcs, players: null, current: { battle, fighter, me } });
		expect(await createBattle(69, 5)).toEqual({ ok: false, message: 'Вы уже в бою: сначала закончите его' });
		expect(getGame).not.toHaveBeenCalled();
	});

	it('созданный бой отдаётся окну боя, а в памяти не хранится', async () => {
		setInvitesContext({ bot, npcs, players: null });
		vi.mocked(getGame)
			.mockResolvedValueOnce(parseResponse('<data><u id="7" name="Я" aid="8" lvl="67" en="50" dmgi="1000" s1="0" s2="0" s3="0" s4="0" item1="0" item2="0" item3="0"/></data>'))
			.mockResolvedValueOnce(parseResponse('<data><u id="69" hp="9000" mhp="9000" avail="3" nrgn="0"/></data>'))
			.mockResolvedValueOnce(parseResponse(joined));
		expect(await createBattle(69, 5)).toMatchObject({ ok: true, battle: { fightId: 600 } });
		expect(getBattleSession()).toBeNull();
	});
});

describe('createBattle: защита от двойного входа', () => {
	const npcs = new Map([[69, { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 }]]);
	beforeEach(() => {
		vi.mocked(getGame).mockReset();
		selectProfile(1);
		setBattleSession(null);
	});

	it('пока вход в бой не закончился, второй не стартует и запросов не шлёт; после окончания вход снова возможен', async () => {
		setInvitesContext({ bot, npcs, players: null });
		let release!: (value: unknown) => void;
		vi.mocked(getGame).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
		const first = createBattle(69, 5);
		expect(await createBattle(69, 5)).toEqual({ ok: false, message: 'Вход в бой уже идёт' });
		// Первый ещё ждёт ответа игры: второй запрос профиля не ушёл
		expect(getGame).toHaveBeenCalledTimes(1);
		release({});
		await first;
		vi.mocked(getGame).mockResolvedValueOnce(null);
		expect(await createBattle(69, 5)).toMatchObject({ ok: false, message: 'Не удалось получить данные персонажа' });
	});
});

describe('showBattle', () => {
	beforeEach(() => {
		selectProfile(1);
		closeModal();
		setBattleSession(null);
		setInvitesContext({ bot, npcs: new Map(), players: null });
	});

	it('бой живёт, пока открыто окно боя или список участников; после закрытия остаётся бой страницы из игры', () => {
		showBattle({ battle, fighter, me });
		expect(getBattleSession()?.battle.fightId).toBe(5);
		expect(getInvitesContext()?.current?.battle.fightId).toBe(5);
		openModal('participants', {}, 'participants');
		expect(getBattleSession()).not.toBeNull();
		closeModal();
		expect(getBattleSession()).toBeNull();
		expect(getInvitesContext()?.current?.battle.fightId).toBe(5);
	});
});

describe('runRound', () => {
	it('запросы раундов идут строго по очереди, нажатие во время обновления ждёт, а не пропадает', async () => {
		const order: string[] = [];
		const slow = runRound(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
			order.push('обновление');
		});
		expect(roundBusy()).toBe(true);
		const hit = runRound(async () => {
			order.push('удар');
			return 7;
		});
		expect(await hit).toBe(7);
		await slow;
		expect(order).toEqual(['обновление', 'удар']);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(roundBusy()).toBe(false);
	});

	it('сбой одного запроса не останавливает очередь', async () => {
		await expect(runRound(async () => Promise.reject(new Error('сеть')))).rejects.toThrow('сеть');
		expect(await runRound(async () => 1)).toBe(1);
	});
});
