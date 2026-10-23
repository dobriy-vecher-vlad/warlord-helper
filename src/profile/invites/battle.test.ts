import { describe, expect, it } from 'vitest';
import { parseResponse } from '../../api/parse';
import { attackKey, canKillAlone, parseBattle, parseFighter, roundsToKill, simulate, solveKill, survivableRounds, type Battle, type Fighter, type Setup } from './battle';

const battle = (overrides: Partial<Battle> = {}): Battle => ({
	fightId: 1,
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
	...overrides,
});
const me = (overrides: Partial<Fighter> = {}): Fighter => ({ dmg: 1000, skills: { 1: 0, 2: 0, 3: 0, 4: 0 }, lightning: 0, fire: 0, potions: 0, ...overrides });
const off: Setup = { skill: 0, fire: 0, lightning: 0, potions: 0 };

describe('parseBattle', () => {
	it('участники из профиля: чужие узлы l (лиги арены) не считаются, имя «Array» от сервера отбрасывается', () => {
		const data = parseResponse(
			'<data><fight time="31" mhp="100" hp="60" dmg="5" myhp="40" myr="7" eid="69" fid="9" res="2"></fight><l id="7" n="Array" dd="10"/><l id="8" n="Ян" dd="30"/><l id="1" n="Лига Новичков" price3="10" rp="0"/><l id="2" n="Лига Воинов I" price3="30" rp="200"/></data>',
		);
		expect(parseBattle(data)?.participants).toEqual([
			{ id: 7, name: '', avatar: null, damage: 10 },
			{ id: 8, name: 'Ян', avatar: null, damage: 30 },
		]);
	});

	it('читает бой из профиля: участники внутри fight', () => {
		const data = parseResponse(
			'<data><fight time="31" mhp="100" hp="60" dmg="5" myhp="40" myr="7" eid="69" fid="9" res="2"><u id="69"/><l id="1" n="Ян" dd="10"/><l id="2" dd="30"/></fight></data>',
		);
		expect(parseBattle(data)).toEqual({
			fightId: 9,
			npc: 69,
			hp: 60,
			maxHp: 100,
			bossDmg: 5,
			myHp: 40,
			rage: 7,
			elapsed: 31,
			receivedAt: expect.any(Number),
			won: false,
			lost: false,
			participants: [
				{ id: 1, name: 'Ян', avatar: null, damage: 10 },
				{ id: 2, name: '', avatar: null, damage: 30 },
			],
		});
	});

	it('участники из ответа раунда лежат рядом с fight; победа — res 3 или здоровье не выше нуля', () => {
		const data = parseResponse('<data><l id="1" n="Ян" ava="8" dd="50"/><fight hp="-5" mhp="100" dmg="5" myhp="40" myr="0" eid="69" fid="9" res="3"/></data>');
		const result = parseBattle(data);
		expect(result?.won).toBe(true);
		expect(result?.participants).toEqual([{ id: 1, name: 'Ян', avatar: 8, damage: 50 }]);
	});

	it('персонаж погиб, а босс жив — бой для него окончен', () => {
		const data = parseResponse('<data><fight hp="50" mhp="100" dmg="5" myhp="0" myr="0" eid="69" fid="9" res="2"/></data>');
		expect(parseBattle(data)).toMatchObject({ won: false, lost: true });
	});

	it('без боя в профиле приходит fight с eid = 0', () => {
		expect(parseBattle(parseResponse('<data><fight eid="0"/></data>'))).toBeNull();
		expect(parseBattle(null)).toBeNull();
		expect(parseBattle('текст')).toBeNull();
	});
});

describe('parseFighter', () => {
	it('свитки молнии и огня и зелья берутся из item1, item3 и item2', () => {
		const fighter = parseFighter({ _dmgi: '100', _s1: '1', _s2: '2', _s3: '3', _s4: '4', _item1: '5', _item2: '6', _item3: '7' });
		expect(fighter).toEqual({ dmg: 100, skills: { 1: 1, 2: 2, 3: 3, 4: 4 }, lightning: 5, potions: 6, fire: 7 });
	});
});

describe('simulate', () => {
	it('обычные удары: урон, ответные удары и ярость', () => {
		const plan = simulate(battle(), me(), off, 5);
		expect(plan).toMatchObject({ rounds: 5, hand: 5, dealt: 5000, taken: 500, bossHp: 995_000, myHp: 9500, skillHits: 0, killed: false, dies: false });
		expect(attackKey(plan)).toEqual({ s0: 5, c1: 0, c2: 0, c3: 0, r: 5, dd: 5000, dg: 500 });
	});

	it('Невидимый удар: ярость 10 и 27 ударов дают 4 применения, босс на них не отвечает', () => {
		const plan = simulate(battle(), me({ skills: { 1: 0, 2: 0, 3: 10, 4: 0 } }), { ...off, skill: 3 }, 27);
		expect(plan.skillHits).toBe(4);
		expect(plan.taken).toBe(27 * 100);
		expect(plan.dealt).toBe(27 * 1000 + 4 * (1000 + 70));
		expect(attackKey(plan)).toMatchObject({ s0: 27, s3: 4, r: 31 });
	});

	it('Свирепый удар отвечает босс, Блок щитом снижает его ответ', () => {
		const fierce = simulate(battle(), me({ skills: { 1: 2, 2: 0, 3: 0, 4: 0 } }), { ...off, skill: 1 }, 1);
		expect(fierce).toMatchObject({ skillHits: 1, dealt: 1010 + 1000, taken: 200 });
		const shield = simulate(battle(), me({ skills: { 1: 0, 2: 30, 3: 0, 4: 0 } }), { ...off, skill: 2 }, 1);
		expect(shield).toMatchObject({ skillHits: 1, dealt: 2000, taken: 70 + 100 });
	});

	it('навык не применяется, если не хватает ярости или он не изучен', () => {
		expect(simulate(battle({ rage: 0 }), me({ skills: { 1: 0, 2: 0, 3: 5, 4: 0 } }), { ...off, skill: 3 }, 8).skillHits).toBe(0);
		expect(simulate(battle(), me(), { ...off, skill: 3 }, 3).skillHits).toBe(0);
	});

	it('свитки: сначала огонь, затем молния, затем рука; потолок и запас ограничивают расход', () => {
		const plan = simulate(battle(), me({ fire: 10, lightning: 3 }), { skill: 0, fire: 2, lightning: 5, potions: 0 }, 8);
		expect(plan).toMatchObject({ fire: 2, lightning: 3, hand: 3, dealt: 2 * 3000 + 3 * 1500 + 3 * 1000 });
		expect(attackKey(plan)).toMatchObject({ s0: 3, c1: 3, c3: 2, r: 8 });
	});

	it('удар навыком может добить босса: раунд с обычным ударом не считается', () => {
		const plan = simulate(battle({ hp: 1500 }), me({ skills: { 1: 0, 2: 0, 3: 100, 4: 0 } }), { ...off, skill: 3 }, 10);
		expect(plan).toMatchObject({ killed: true, rounds: 0, skillHits: 1, taken: 0 });
	});

	it('зелья тратятся только если без них погибнуть, не больше предела; лечение растёт с навыком', () => {
		const state = battle({ myHp: 250, bossDmg: 100 });
		const fighter = me({ potions: 5 });
		expect(simulate(state, fighter, { ...off, potions: 5 }, 2)).toMatchObject({ potions: 0, dies: false });
		const plan = simulate(state, fighter, { ...off, potions: 5 }, 10);
		expect(plan).toMatchObject({ potions: 4, healed: 1000, dies: false });
		expect(simulate(state, fighter, { ...off, potions: 1 }, 10)).toMatchObject({ potions: 1, dies: true });
		expect(simulate(state, { ...fighter, skills: { 1: 0, 2: 0, 3: 0, 4: 100 } }, { ...off, potions: 5 }, 10).potions).toBe(2);
		expect(attackKey(plan).c2).toBe(4);
	});

	it('нулевой урон не зацикливает расчёт', () => {
		expect(roundsToKill(battle(), me({ dmg: 0 }), off)).toBeLessThanOrEqual(200_000);
	});
});

describe('roundsToKill', () => {
	it('считает удары до гибели босса', () => {
		expect(roundsToKill(battle({ hp: 5500 }), me(), off)).toBe(6);
	});
});

describe('survivableRounds', () => {
	it('столько ударов, сколько выдержит персонаж, но не больше нужного для убийства', () => {
		// 10 000 здоровья, босс бьёт на 100: 99 ударов оставляют 100 здоровья, сотый убивает
		expect(survivableRounds(battle({ hp: 1_000_000, myHp: 10_000, bossDmg: 100 }), me(), off)).toBe(99);
		// босс умирает раньше, чем гибнет персонаж
		expect(survivableRounds(battle({ hp: 3000, myHp: 10_000, bossDmg: 100 }), me(), off)).toBe(3);
	});

	it('зелья продлевают бой: с ними ударов больше', () => {
		const state = battle({ hp: 1_000_000, myHp: 10_000, bossDmg: 100 });
		const without = survivableRounds(state, me({ potions: 0 }), off);
		const withPotions = survivableRounds(state, me({ potions: 5 }), { ...off, potions: 5 });
		expect(withPotions).toBeGreaterThan(without);
	});

	it('персонаж не переживёт и один удар — 0', () => {
		expect(survivableRounds(battle({ hp: 1_000_000, myHp: 100, bossDmg: 100 }), me({ potions: 0 }), off)).toBe(0);
		expect(survivableRounds(battle({ hp: 1_000_000, myHp: 0, bossDmg: 100 }), me({ potions: 0 }), off)).toBe(0);
	});
});

describe('solveKill', () => {
	it('хватает рук — свитки не включаются, берётся навык с наименьшим полученным уроном', () => {
		const result = solveKill(battle({ hp: 5000 }), me({ skills: { 1: 1, 2: 1, 3: 1, 4: 0 }, fire: 5, potions: 2 }));
		expect(result.feasible).toBe(true);
		expect(result.setup).toMatchObject({ fire: 0, lightning: 0 });
		expect(result.plan.killed).toBe(true);
		const other = [0, 1, 2, 3].map((skill) => simulate(battle({ hp: 5000 }), me({ skills: { 1: 1, 2: 1, 3: 1, 4: 0 } }), { ...off, skill: skill as 0 | 1 | 2 | 3 }, 100).taken);
		expect(result.plan.taken).toBe(Math.min(...other));
	});

	it('не хватает здоровья — сначала зелья, затем свитки огня и молнии в наименьшем числе', () => {
		const state = battle({ hp: 100_000, myHp: 5000, bossDmg: 100 });
		const withPotions = solveKill(state, me({ potions: 30 }));
		expect(withPotions.feasible).toBe(true);
		expect(withPotions.plan.potions).toBeGreaterThan(0);
		expect(withPotions.setup.fire + withPotions.setup.lightning).toBe(0);

		const withFire = solveKill(state, me({ fire: 100 }));
		expect(withFire.feasible).toBe(true);
		expect(withFire.setup.fire).toBeGreaterThan(0);
		expect(withFire.setup.fire).toBeLessThan(100);
		expect(withFire.plan.dies).toBe(false);
		const fewer = simulate(state, me({ fire: 100 }), { ...withFire.setup, fire: withFire.setup.fire - 1 }, 200_000);
		expect(fewer.dies).toBe(true);
	});

	it('убить не удаётся — возвращается вариант с полным запасом и feasible: false', () => {
		const result = solveKill(battle({ hp: 10_000_000, myHp: 500 }), me({ fire: 2, lightning: 2, potions: 1 }));
		expect(result.feasible).toBe(false);
		expect(result.setup).toMatchObject({ fire: 2, lightning: 2, potions: 1 });
	});
});

describe('canKillAlone', () => {
	it('считает с навыками, но без свитков и зелий', () => {
		const strong = me({ skills: { 1: 0, 2: 0, 3: 10, 4: 0 }, fire: 1000, potions: 1000 });
		expect(canKillAlone({ hp: 5000, dmg: 100 }, strong, 10_000)).toBe(true);
		// здоровья не хватает, а зелья и свитки есть, но в расчёт не идут
		expect(canKillAlone({ hp: 1_000_000, dmg: 100 }, strong, 10_000)).toBe(false);
	});

	it('навык решает исход: босс отвечает слабее, когда бьёт Невидимый удар', () => {
		const withSkill = me({ skills: { 1: 0, 2: 0, 3: 1000, 4: 0 } });
		const without = me();
		const boss = { hp: 120_000, dmg: 100 };
		expect(canKillAlone(boss, without, 10_000)).toBe(false);
		expect(canKillAlone(boss, withSkill, 10_000)).toBe(true);
	});
});
