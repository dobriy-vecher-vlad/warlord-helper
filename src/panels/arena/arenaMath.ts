import dataArena from '../../data/arena.json';

/** Кубков за победный бой. */
export const CUPS_PER_WIN = 19;

/** Сколько побед нужно, чтобы дойти от одного числа кубков до другого (до цели ниже текущего — ноль). */
export const winsBetween = (from: number, to: number) => Math.max(0, Math.ceil((to - from) / CUPS_PER_WIN));

/** Стоимость боёв от одного числа кубков до другого: каждый бой +19 кубков, цена — по лиге на момент боя. */
export function fightPrice(from: number, to: number) {
	const leagues = dataArena.league;
	let total = 0;
	let cups = from;
	for (let x = 0; x < winsBetween(from, to); x++) {
		const league = leagues.findIndex((item, index) => (index === leagues.length - 1 ? cups >= item.from : cups >= item.from && cups < item.to));
		if (league !== -1) {
			total += leagues[league]!.price;
			cups += CUPS_PER_WIN;
		}
	}
	return total;
}
