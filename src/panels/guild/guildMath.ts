/** Золото за один топаз и серебро за один аметист. */
export const TOPAZ_PRICE = 75;
export const AMETHYST_PRICE = 55;
/** Сколько ресурса казна принимает за одно пополнение. */
export const TOPAZ_REFILL = 3750;
export const AMETHYST_REFILL = 2750;

/** Сколько ресурса уйдёт на топазы и аметисты и сколько раз пополнять казну. */
export function guildCost(topaz: number, amethyst: number) {
	const topazCost = topaz * TOPAZ_PRICE;
	const amethystCost = amethyst * AMETHYST_PRICE;
	return {
		topazCost,
		amethystCost,
		topazRefills: Math.ceil(topazCost / TOPAZ_REFILL),
		amethystRefills: Math.ceil(amethystCost / AMETHYST_REFILL),
	};
}
