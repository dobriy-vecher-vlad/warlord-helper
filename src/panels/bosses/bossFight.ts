/** Характеристики персонажа и припасы, введённые в калькуляторе боссов. */
export interface FightInput {
	health: number;
	damage: number;
	invisible: number;
	healer: number;
	potions: number;
	lightning: number;
	fire: number;
}

/**
 * Бой с боссом (формула старого калькулятора). Свитки огня тратятся первыми, затем свитки молнии;
 * невидимый удар срабатывает раз в 9 ударов. `discount` — ослабление босса в процентах.
 */
export function calculateBossFight(boss: { hp: number; dmg: number }, discount: number, input: FightInput) {
	const bossDamage = boss.dmg - (boss.dmg / 100) * discount;
	const bossHealth = boss.hp - (boss.hp / 100) * discount;
	const lightningHit = Math.floor(input.damage * 1.5);
	const fireHit = Math.floor(input.damage * 3);
	const potionsHealth = input.potions * (input.healer * 3 + 250);
	const hits = Math.ceil((input.health + potionsHealth) / bossDamage) || 1;
	const spellHits = Math.min(input.lightning + input.fire, hits);
	const fireHits = Math.min(input.fire, spellHits);
	const fireDamage = fireHits * fireHit;
	const lightningDamage = Math.max(spellHits - fireHits, 0) * lightningHit;
	const clearDamage = input.damage * (hits - spellHits);
	const invisibleHit = input.invisible === 0 ? 0 : input.invisible * 7 + input.damage;
	const invisibleDamage = invisibleHit * Math.floor((hits + 9) / 9);
	const totalDamage = clearDamage + invisibleDamage + lightningDamage + fireDamage;
	return { bossHealth, bossDamage, clearDamage, totalDamage, leftHP: Math.max(bossHealth - totalDamage, 0), totalHit: hits };
}
