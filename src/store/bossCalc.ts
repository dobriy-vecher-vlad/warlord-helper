import type { CalcBoss } from '../panels/bosses/bossCalcData';
import { createStore, useStore } from './createStore';

/** Босс по умолчанию — Киор (id 60 в bosses.json). */
export const DEFAULT_BOSS_ID = 60;

/**
 * Выбор в калькуляторе боссов: босс и ослабление в процентах; выбираются на отдельных страницах. Босс игры задан своим
 * id из bosses.json, свой противник — отрицательным номером (−1 для первого). Свои противники живут, пока открыто
 * приложение (как в старом, где они добавлялись в общий список боссов). Данных боссов магазин не знает: он нужен окну создания.
 */
const calc = createStore<{ bossId: number; discount: number; custom: readonly CalcBoss[] }>({ bossId: DEFAULT_BOSS_ID, discount: 0, custom: [] });

export const useBossId = () => useStore(calc, (s) => s.bossId);
export const useBossDiscount = () => useStore(calc, (s) => s.discount);
export const useCustomBosses = () => useStore(calc, (s) => s.custom);
export const setBossId = (bossId: number) => calc.set({ bossId });
export const setBossDiscount = (discount: number) => calc.set({ discount });

/** Создать своего противника и выбрать его. Здоровье и атака не меньше единицы (так же ограничено поле ввода). */
export function createCustomBoss(hp: number, dmg: number) {
	const { custom } = calc.get();
	const boss: CalcBoss = {
		name: `Свой противник #${custom.length + 1}`,
		description: 'Новая угроза Эрмуна',
		hp: Math.max(1, hp || 0),
		dmg: Math.max(1, dmg || 0),
		background: 'bosses/backgrounds/19.png',
		image: 'bosses/images/0.png',
		icon: 'bosses/icons/0.png',
	};
	calc.set({ custom: [...custom, boss], bossId: -(custom.length + 1) });
}
