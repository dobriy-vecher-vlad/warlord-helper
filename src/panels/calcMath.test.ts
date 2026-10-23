import { describe, expect, it } from 'vitest';
import { fightPrice, winsBetween } from './arena/arenaMath';
import { calculateBossFight } from './bosses/bossFight';
import { guildCost } from './guild/guildMath';
import { enchantLevels } from './other/enchant';

describe('калькулятор арены', () => {
	it('считает победы по 19 кубков с округлением вверх', () => {
		expect(winsBetween(200, 200)).toBe(0);
		expect(winsBetween(200, 201)).toBe(1);
		expect(winsBetween(0, 190)).toBe(10);
	});

	it('цель ниже текущего числа кубков — ноль побед и ноль золота', () => {
		expect(winsBetween(500, 100)).toBe(0);
		expect(fightPrice(500, 100)).toBe(0);
	});

	it('цена растёт вместе с числом боёв', () => {
		expect(fightPrice(200, 400)).toBeGreaterThan(0);
		expect(fightPrice(200, 4000)).toBeGreaterThan(fightPrice(200, 400));
	});
});

describe('калькулятор гильдии', () => {
	it('считает затраты и пополнения казны', () => {
		expect(guildCost(1, 1)).toEqual({ topazCost: 75, amethystCost: 55, topazRefills: 1, amethystRefills: 1 });
		expect(guildCost(100, 100)).toMatchObject({ topazCost: 7500, topazRefills: 2, amethystCost: 5500, amethystRefills: 2 });
		expect(guildCost(0, 0)).toMatchObject({ topazRefills: 0, amethystRefills: 0 });
	});
});

describe('калькулятор улучшения', () => {
	it('даёт десять уровней заточки нарастающим итогом', () => {
		const levels = enchantLevels(100);
		expect(levels).toHaveLength(10);
		expect(levels[0]).toBe(110);
		expect(levels[1]).toBe(125);
		expect(levels).toEqual([...levels].sort((a, b) => a - b));
	});
});

describe('калькулятор боссов', () => {
	const input = { health: 1000, damage: 100, invisible: 0, healer: 0, potions: 0, lightning: 0, fire: 0 };

	it('без припасов считает чистый урон по числу ударов', () => {
		const result = calculateBossFight({ hp: 5000, dmg: 100 }, 0, input);
		expect(result.totalHit).toBe(10);
		expect(result.clearDamage).toBe(1000);
		expect(result.totalDamage).toBe(1000);
		expect(result.leftHP).toBe(4000);
	});

	it('остаток здоровья босса не бывает отрицательным', () => {
		expect(calculateBossFight({ hp: 100, dmg: 100 }, 0, input).leftHP).toBe(0);
	});

	it('даже при нулевом здоровье персонажа бьёт один раз', () => {
		expect(calculateBossFight({ hp: 5000, dmg: 100 }, 0, { ...input, health: 0 }).totalHit).toBe(1);
	});

	it('ослабление уменьшает здоровье и атаку босса', () => {
		const result = calculateBossFight({ hp: 1000, dmg: 200 }, 50, input);
		expect(result.bossHealth).toBe(500);
		expect(result.bossDamage).toBe(100);
	});

	it('свитки огня тратятся раньше свитков молнии', () => {
		const result = calculateBossFight({ hp: 100000, dmg: 100 }, 0, { ...input, fire: 1, lightning: 1 });
		expect(result.totalDamage).toBe(100 * 8 + 300 + 150);
	});
});
