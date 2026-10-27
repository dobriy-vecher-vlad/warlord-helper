import { describe, expect, it } from 'vitest';
import type { FightInfo, Npc, Player } from './accept';
import type { Fighter } from './battle';
import type { InviteBoss } from './bosses';
import { killPlan, killSetup, killStrikes, type KillPlanInput } from './killAll';

const fighter = (overrides: Partial<Fighter> = {}): Fighter => ({ dmg: 1000, skills: { 1: 0, 2: 0, 3: 0, 4: 0 }, lightning: 0, fire: 0, potions: 0, ...overrides });
const player = (overrides: Partial<Player> = {}): Player => ({ level: 50, energy: 100, maxRegion: 20, fighter: fighter(), maxHp: 100_000, ...overrides });
const boss = (id: number, energy: number, hp = 5000): InviteBoss => ({ id, name: `Босс ${id}`, hp, dmg: 100, energy }) as unknown as InviteBoss;
const npc = (id: number, overrides: Partial<Npc> = {}): Npc => ({ id, region: 5, place: 1, type: 1, level: 1, tries: 10, ...overrides });
const info = (left: number): FightInfo => ({ hp: 0, maxHp: 0, left, next: 0 });

const input = (overrides: Partial<KillPlanInput> = {}): KillPlanInput => ({
	favorites: [1, 2, 3],
	bosses: new Map([1, 2, 3].map((id) => [id, boss(id, 10)])),
	npcs: new Map([1, 2, 3].map((id) => [id, npc(id)])),
	player: player(),
	attempts: new Map([
		[1, info(4)],
		[2, info(3)],
		[3, info(2)],
	]),
	killed: new Map(),
	unlimited: false,
	...overrides,
});
const lefts = (entries: ReturnType<typeof killPlan>) => entries.map((entry) => [entry.boss.id, entry.left]);

describe('killPlan', () => {
	it('идёт по порядку избранного; энергия делится по порядку: следующему достаётся остаток', () => {
		// 100 энергии, по 10 за бой: первому 4 (все попытки), второму 3, третьему 2
		expect(lefts(killPlan(input()))).toEqual([
			[1, 4],
			[2, 3],
			[3, 2],
		]);
		expect(lefts(killPlan(input({ player: player({ energy: 55 }) })))).toEqual([
			[1, 4],
			[2, 1],
		]);
		expect(lefts(killPlan(input({ favorites: [3, 1, 2] })))[0]).toEqual([3, 2]);
	});

	it('босс, на которого не хватает энергии, не показывается; хватило снова — появляется', () => {
		expect(lefts(killPlan(input({ player: player({ energy: 9 }) })))).toEqual([]);
		expect(lefts(killPlan(input({ player: player({ energy: 10 }) })))).toEqual([[1, 1]]);
	});

	it('без попыток, без данных о них и закрытые районом или уровнем боссы не показываются', () => {
		const attempts = new Map<number, FightInfo | null>([
			[1, info(0)],
			[2, null],
			[3, info(2)],
		]);
		expect(lefts(killPlan(input({ attempts })))).toEqual([[3, 2]]);
		expect(lefts(killPlan(input({ npcs: new Map([1, 2, 3].map((id) => [id, npc(id, { region: id === 3 ? 20 : 5 })])) })))).toEqual([
			[1, 4],
			[2, 3],
		]);
		expect(lefts(killPlan(input({ npcs: new Map([1, 2, 3].map((id) => [id, npc(id, { level: id === 1 ? 60 : 1 })])) })))).toEqual([
			[2, 3],
			[3, 2],
		]);
	});

	it('босс, которого персонаж не убьёт один, не показывается; с Kill показываются все', () => {
		const strong = new Map([1, 2, 3].map((id) => [id, boss(id, 10, id === 2 ? 50_000_000 : 5000)]));
		expect(lefts(killPlan(input({ bosses: strong })))).toEqual([
			[1, 4],
			[3, 2],
		]);
		expect(lefts(killPlan(input({ bosses: strong, unlimited: true })))).toEqual([
			[1, 4],
			[2, 3],
			[3, 2],
		]);
	});

	it('убитый до лимита остаётся в списке с нулём, нетронутый нулевой — нет', () => {
		const entries = killPlan(input({ attempts: new Map([[1, info(0)]]), killed: new Map([[1, 4]]) }));
		expect(entries.map((entry) => [entry.boss.id, entry.killed, entry.left])).toEqual([[1, 4, 0]]);
	});
});

describe('удары за проход', () => {
	it('навык «Невидимый удар» берётся, если выучен; свитки и зелья не используются', () => {
		expect(killSetup(fighter({ skills: { 1: 5, 2: 5, 3: 0, 4: 0 }, fire: 9, potions: 9 }))).toEqual({ skill: 0, fire: 0, lightning: 0, potions: 0 });
		expect(killSetup(fighter({ skills: { 1: 5, 2: 5, 3: 2, 4: 0 }, fire: 9 })).skill).toBe(3);
	});

	it('план убивает босса одним набором ударов', () => {
		const battle = { fightId: 1, npc: 1, hp: 4500, maxHp: 4500, bossDmg: 10, myHp: 100_000, rage: 10, elapsed: 0, receivedAt: 0, won: false, lost: false, participants: [] };
		const plan = killStrikes(battle, fighter());
		expect(plan.killed).toBe(true);
		expect(plan.fire + plan.lightning + plan.potions).toBe(0);
	});
});
