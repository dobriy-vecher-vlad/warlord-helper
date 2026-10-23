import { getGame } from '../../api/game';
import { PRIORITY } from '../../api/http';
import type { Attrs, ProfileResponse } from '../../api/gameTypes';
import { wait } from '../../lib/async';
import { asArray, type BotAuth } from '../bots/common';
import { parseBattle, parseFighter, type Battle, type Fighter } from './battle';
import type { Invite } from './invites';

/** Босс из профиля: где он стоит на карте и сколько стоит бой. */
export interface Npc {
	id: number;
	/** Регион и номер места в нём (параметры `i: 10`) */
	region: number;
	place: number;
	/** Тип боя для `i: 11` */
	type: number;
	/** Нужный уровень игрока */
	level: number;
	/** Попыток всего */
	tries: number;
}

/** Все боссы игры из профиля (`npcs`): по ним принимаются приглашения. */
export function parseNpcs(profile: Pick<ProfileResponse, 'npcs'>): Map<number, Npc> {
	const npcs = new Map<number, Npc>();
	for (const { u } of asArray(profile.npcs?.npc)) {
		const id = Number(u?._id);
		if (!id) continue;
		npcs.set(id, {
			id,
			region: Number(u._rid),
			place: Number(u._rn),
			type: Number(u._type),
			level: Number(u._rq1),
			tries: Number(u._rlmt),
		});
	}
	return npcs;
}

/** Сколько раз персонаж убил каждого босса (`npcs.kill` профиля): по этому видно, какие локации ему открыты. */
export function parseKills(profile: Pick<ProfileResponse, 'npcs'>): Map<number, number> {
	const kills = new Map<number, number>();
	for (const node of asArray(profile.npcs?.kill)) {
		const id = Number(node._id);
		if (id) kills.set(id, Number(node._v) || 0);
	}
	return kills;
}

/** Состояние боя до входа в него (`i: 10`, ничего не меняет). */
export interface FightInfo {
	/** Сколько здоровья осталось у босса и сколько было */
	hp: number;
	maxHp: number;
	/** Сколько попыток осталось сегодня */
	left: number;
	/** Секунд до новой попытки */
	next: number;
}

const fightQuery = (invite: Invite, npc: Npc) => ({ i: 10, t1: npc.region, t2: npc.place, t3: invite.uid, t4: npc.id, t5: npc.type, fid: invite.fightId });

/** Персонаж игрока: энергия, боевые характеристики и здоровье в начале боя. */
export interface Player {
	/** Уровень персонажа */
	level: number;
	energy: number;
	fighter: Fighter;
	/** Здоровье в начале боя: (выносливость + выносливость от предметов) × 15 */
	maxHp: number;
}

/** Персонаж из узла `u` профиля. */
export const playerOf = (user: Attrs): Player => ({
	level: Number(user._lvl) || 0,
	energy: Number(user._en),
	fighter: parseFighter(user),
	maxHp: (Number(user._end) + Number(user._endi)) * 15,
});

/**
 * Данные боя по приглашению. null — приглашение устарело: когда бой уже закончился, сервер на тот же запрос присылает
 * другой номер боя (новый, с полным здоровьем босса), а при входе по такому приглашению создал бы новый бой и списал попытку.
 */
export async function fetchFight(bot: BotAuth, invite: Invite, npc: Npc, priority: number = PRIORITY.background): Promise<FightInfo | null> {
	const info = await getGame(bot.server, fightQuery(invite, npc), bot.auth, 1, false, priority);
	if (!info?.fight || !info.u || Number(info.fight._id) !== invite.fightId) return null;
	return { hp: Number(info.u._hp), maxHp: Number(info.u._mhp), left: Number(info.u._avail), next: Number(info.u._nrgn) || 0 };
}

/** Персонаж игрока: нужен окну боя для списка участников. */
export interface Me {
	id: number;
	name: string;
	/** Номер аватара (`_aid`) */
	avatar: number;
}

export type EnterResult = { ok: true; battle: Battle; fighter: Fighter; me: Me } | { ok: false; message: string };

const fail = (message: string): EnterResult => ({ ok: false, message });

/** Босс без привязки к бою: сколько попыток осталось и когда восстановится новая (`i: 10` с пустым `fid`). */
export async function fetchBoss(bot: BotAuth, npc: Npc, priority: number = PRIORITY.background): Promise<FightInfo | null> {
	const info = await getGame(bot.server, { i: 10, t1: npc.region, t2: npc.place, t3: 0, t4: npc.id, t5: npc.type, fid: 0 }, bot.auth, 1, false, priority);
	if (!info?.u) return null;
	return { hp: Number(info.u._hp), maxHp: Number(info.u._mhp), left: Number(info.u._avail), next: Number(info.u._nrgn) || 0 };
}

/** Проверки персонажа и вход в бой запросом `i: 11`; `check` — проверка самого боя до входа (текст отказа или null). */
async function start(bot: BotAuth, npc: Npc, cost: number, check: () => Promise<string | null>, body: Record<string, number>): Promise<EnterResult> {
	const player: Attrs | undefined = (await getGame(bot.server, {}, bot.auth, 1, false, PRIORITY.action))?.u;
	if (!player) return fail('Не удалось получить данные персонажа');
	if (Number(player._lvl) < npc.level) return fail(`Нужен ${npc.level} уровень`);
	if (Number(player._en) < cost) return fail('Не хватает энергии');

	const refusal = await check();
	if (refusal) return fail(refusal);

	let game = await getGame(bot.server, body, bot.auth, 1, false, PRIORITY.action);
	if (!game?.fight) {
		await wait(3000);
		game = await getGame(bot.server, body, bot.auth, 1, false, PRIORITY.action);
	}
	const battle = parseBattle(game);
	if (!battle) return fail('Не удалось войти в бой');
	return { ok: true, battle, fighter: parseFighter(player), me: { id: Number(player._id), name: player._name ?? '', avatar: Number(player._aid) || 0 } };
}

/**
 * Принять приглашение, как клиент игры: проверка (`i: 10`) и вход в бой (`i: 11`). Бой общий, здоровье босса может быть
 * уже снижено чужим уроном. Энергия `cost` (из справочника боссов) и попытка списываются при входе; сами удары
 * делаются в окне боя. Устаревшее приглашение в бой не ведёт.
 */
export function enterFight(bot: BotAuth, invite: Invite, npc: Npc, cost: number): Promise<EnterResult> {
	const check = async () => {
		const info = await fetchFight(bot, invite, npc, PRIORITY.action);
		if (!info) return 'Приглашение устарело: бой уже закончился';
		if (info.hp <= 0) return 'Босс уже побеждён';
		return info.left <= 0 ? 'Попытки на сегодня закончились' : null;
	};
	return start(bot, npc, cost, check, { i: 11, t: npc.id, t2: npc.type, t3: 0, t4: invite.uid, t5: 0, fid: invite.fightId });
}

/** Создать свой бой с боссом (так клиент начинает бой без приглашения: `i: 11` без `fid` и приглашающего). Списывает энергию и попытку. */
export function createFight(bot: BotAuth, npc: Npc, cost: number): Promise<EnterResult> {
	const check = async () => {
		const info = await fetchBoss(bot, npc, PRIORITY.action);
		if (!info) return 'Не удалось получить данные босса';
		return info.left <= 0 ? 'Попытки на сегодня закончились' : null;
	};
	return start(bot, npc, cost, check, { i: 11, t: npc.id, t2: npc.type, t3: 0, t4: 0, t5: 0, fid: 0 });
}

/** Позвать всех друзей на помощь в текущем бою (`i: 29`, клиент: «Позвать всех»). */
export async function callFriends(bot: BotAuth): Promise<boolean> {
	const response = await getGame(bot.server, { i: 29 }, bot.auth, 1, false, PRIORITY.action);
	return Number(response?.a?._res) === 1;
}
