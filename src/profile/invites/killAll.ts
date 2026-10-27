import { getGame } from '../../api/game';
import { PRIORITY } from '../../api/http';
import { fightKey } from '../../panels/profile/bots/raidData';
import { fightHash } from '../bots/hash';
import type { BotAuth } from '../bots/common';
import type { RawReward } from '../bots/reward';
import type { FightInfo, Npc, Player } from './accept';
import { SOLO_SKILL, attackKey, canKillAlone, parseBattle, roundsToKill, simulate, type Battle, type Fighter, type Plan, type Setup } from './battle';
import { bossLock } from './bossList';
import type { InviteBoss } from './bosses';

/** Босс в списке «убить всех»: сколько убито в этом проходе и сколько ещё можно убить сейчас. */
export interface KillEntry {
	boss: InviteBoss;
	npc: Npc;
	killed: number;
	/** Сколько раз босса можно убить прямо сейчас (попытки и энергия); 0 — убит до лимита */
	left: number;
}

export interface KillPlanInput {
	/** Избранные боссы по порядку: именно их бьёт проход */
	favorites: readonly number[];
	bosses: ReadonlyMap<number, InviteBoss>;
	npcs: ReadonlyMap<number, Npc>;
	player: Player;
	/** Попытки боссов; нет записи или null — данных нет, босс не попадает в список */
	attempts: ReadonlyMap<number, FightInfo | null>;
	/** Убито в этом проходе (id босса → сколько) */
	killed: ReadonlyMap<number, number>;
	/** Доступен Kill (белый список): убивает любого босса, одиночную проверку не проходить */
	unlimited: boolean;
}

/**
 * Список прохода: избранные боссы, с которыми можно начать бой (тип 1, район открыт, хватает уровня), которых персонаж убьёт один
 * (с Kill — любых) и на которых хватает энергии и есть попытки. Энергия делится по порядку списка: босс ставится в очередь за счёт
 * того, что остаётся после предыдущих. Босс, убитый в этом проходе до лимита, остаётся в списке (`left` = 0), прочие нулевые не показываются.
 */
export function killPlan({ favorites, bosses, npcs, player, attempts, killed, unlimited }: KillPlanInput): KillEntry[] {
	const entries: KillEntry[] = [];
	let energy = player.energy;
	for (const id of favorites) {
		const boss = bosses.get(id);
		const npc = npcs.get(id);
		if (!boss || !npc || npc.type !== 1 || bossLock(npc, player)) continue;
		const done = killed.get(id) ?? 0;
		const tries = attempts.get(id)?.left ?? 0;
		const alone = unlimited || canKillAlone(boss, player.fighter, player.maxHp);
		const byEnergy = boss.energy > 0 ? Math.floor(energy / boss.energy) : tries;
		const left = alone ? Math.max(0, Math.min(tries, byEnergy)) : 0;
		energy -= left * boss.energy;
		if (left > 0 || done > 0) entries.push({ boss, npc, killed: done, left });
	}
	return entries;
}

/** Бой за один проход: только бесплатное, «Невидимый удар» если выучен, без свитков и зелий. */
export function killSetup(fighter: Fighter): Setup {
	return { skill: fighter.skills[SOLO_SKILL] > 0 ? SOLO_SKILL : 0, fire: 0, lightning: 0, potions: 0 };
}

/** Удары, которыми босс в созданном бою добивается за один запрос. */
export function killStrikes(battle: Battle, fighter: Fighter): Plan {
	const setup = killSetup(fighter);
	return simulate(battle, fighter, setup, roundsToKill(battle, fighter, setup));
}

/** Удары по боссу (`i: 12`) без привязки к окну боя; победа приходит с наградой. null — сервер удары не принял. */
export async function strikeBoss(bot: BotAuth, plan: Plan): Promise<{ battle: Battle; reward: RawReward | null } | null> {
	const response = await getGame(bot.server, { i: 12, t: fightHash(fightKey(attackKey(plan))) }, bot.auth, 1, false, PRIORITY.action);
	const battle = parseBattle(response);
	if (!battle) return null;
	return { battle, reward: battle.won ? ((response as { r?: RawReward }).r ?? null) : null };
}
