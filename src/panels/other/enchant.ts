/** Прибавка к базе на каждом из десяти уровней заточки: 10–30% дважды, по пять уровней. */
const MULTIPLIERS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.1, 0.15, 0.2, 0.25, 0.3];

/** Урон или здоровье на уровнях заточки 1–10: прибавка от базы, нарастающим итогом. */
export function enchantLevels(base: number) {
	const levels: number[] = [];
	let total = base;
	for (const multiplier of MULTIPLIERS) {
		total = Math.ceil(total + base * multiplier);
		levels.push(total);
	}
	return levels;
}
