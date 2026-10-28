import { describe, expect, it } from 'vitest';
import { neededEnergy, simulateBossFight, tierOn, type FightInput, type RaidData, type Settings } from './raidData';

const input: FightInput = { hp: 1000, dmg: 10, myHp: 10000, myDmg: 100, skill: 0, lightning: 0, fire: 0, useLightning: false, useFire: false };

describe('simulateBossFight', () => {
	it('навык бьёт на первом ударе, затем обычные удары, пока босс не умрёт', () => {
		const fight = simulateBossFight(input);
		expect(fight.hp).toBeLessThanOrEqual(0);
		expect(fight.skillHits).toBeGreaterThan(0);
		expect(fight.handHits).toBeGreaterThan(0);
		expect(fight.dealt).toBe(input.hp - fight.hp);
		expect(fight.taken).toBe(fight.hits * input.dmg);
	});

	it('персонаж, у которого здоровья меньше, чем нужно, не убивает босса', () => {
		const fight = simulateBossFight({ ...input, hp: 1e9, myHp: 25 });
		expect(fight.hp).toBeGreaterThan(0);
		expect(fight.myHp).toBeLessThanOrEqual(0);
	});

	it('свитки молнии тратятся, только если включены и есть', () => {
		const used = simulateBossFight({ ...input, lightning: 3, useLightning: true });
		expect(used.lightningHits).toBe(3);
		expect(used.lightning).toBe(0);
		const disabled = simulateBossFight({ ...input, lightning: 3, useLightning: false });
		expect(disabled.lightningHits).toBe(0);
		expect(disabled.lightning).toBe(3);
	});

	it('молния приоритетнее огня', () => {
		const fight = simulateBossFight({ ...input, hp: 5000, lightning: 1, fire: 1, useLightning: true, useFire: true });
		expect(fight.lightningHits).toBe(1);
		expect(fight.fireHits).toBe(1);
		expect(fight.lightningDmg).toBe(150);
		expect(fight.fireDmg).toBe(300);
	});
});

describe('simulateBossFight: защита от зависания', () => {
	it('нулевой урон у обеих сторон не зацикливает расчёт: бой считается неоконченным, оба живы', () => {
		const fight = simulateBossFight({ hp: 1000, dmg: 0, myHp: 500, myDmg: 0, skill: 0, lightning: 0, fire: 0, useLightning: false, useFire: false });
		expect(fight.hp).toBeGreaterThan(0);
		expect(fight.myHp).toBeGreaterThan(0);
	});
	it('данные без чисел (NaN) тоже завершаются', () => {
		const fight = simulateBossFight({ hp: NaN, dmg: NaN, myHp: NaN, myDmg: NaN, skill: NaN, lightning: 0, fire: 0, useLightning: false, useFire: false });
		expect(Number.isNaN(fight.hp)).toBe(true);
	});
});

describe('neededEnergy', () => {
	const settings: Settings = {
		barrels: true,
		chestsTier1: true,
		chestsTier2: false,
		chestsTier3: false,
		chestsTier4: false,
		chestsTier5: false,
		useScrollLightning: false,
		useScrollFire: false,
		selectedRaid: 1,
		selectedMode: 0,
	};
	const raid = (overrides: Partial<RaidData> = {}): RaidData => ({
		chests: [],
		barrels: [],
		bosses: [],
		reward: {},
		energy: 0,
		id: 1,
		mode: 0,
		point: 1,
		hp: 0,
		limit: 0,
		player: {},
		...overrides,
	});

	it('считает бочки, выбранные сундуки и боссов', () => {
		const data = raid({
			barrels: [
				{ point: 1, status: 1 },
				{ point: 2, status: 0 },
			],
			chests: [
				{ point: 3, type: 1, status: 1, en: 8 },
				{ point: 4, type: 2, status: 1, en: 14 },
			],
			bosses: [
				{ id: 304, point: 5, type: 1, status: 0 },
				{ id: 292, point: 6, type: 2, status: 0 },
				{ id: 293, point: 7, type: 2, status: 1 },
			],
		});
		// бочка 3 + сундук 1-го уровня 8 + главный босс 6 + обычный босс 1
		expect(neededEnergy(data, settings)).toBe(3 + 8 + 6 + 1);
	});

	it('без бочек и сундуков остаются только боссы', () => {
		const data = raid({ barrels: [{ point: 1, status: 1 }], chests: [{ point: 3, type: 1, status: 1, en: 8 }], bosses: [{ id: 292, point: 6, type: 2, status: 0 }] });
		expect(neededEnergy(data, { ...settings, barrels: false, chestsTier1: false })).toBe(1);
		expect(tierOn(settings, 1)).toBe(true);
		expect(tierOn(settings, 2)).toBe(false);
	});
});
