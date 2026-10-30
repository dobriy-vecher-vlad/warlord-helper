import Bosses from '../../data/bosses.json';

export interface CalcBoss {
	name: string;
	description: string;
	hp: number;
	dmg: number;
	background: string;
	image: string;
	icon: string;
}

/** Босс списка вместе с номером, по которому он хранится в выборе (id босса игры или отрицательный номер своего). */
export interface BossEntry {
	id: number;
	boss: CalcBoss;
}

/** Боссы игры (bosses.json); свои противники живут в store/bossCalc. */
export const GAME_BOSSES: readonly (CalcBoss & { id: number })[] = Bosses;

/** Группа рейдовых боссов: их позвать на бой нельзя, рейдовые идут отдельно. */
export const RAID_BOSSES = 'Рейдовые боссы';

/** Боссы калькулятора по группам (id из bosses.json), как в старом приложении. */
const GROUPS: [string, number[]][] = [
	['Временные боссы', [291, 453, 462, 467, 468]],
	['Общие боссы', [67, 69, 290, 313, 337, 459, 341, 460, 390, 393, 458, 455]],
	[
		'Одиночные боссы',
		[1, 3, 27, 12, 11, 60, 61, 62, 63, 71, 64, 70, 65, 66, 68, 278, 279, 288, 289, 338, 339, 340, 357, 358, 391, 392, 456, 457, 461, 463, 464, 466, 470, 471, 472, 474, 473],
	],
	[RAID_BOSSES, [287, 284, 285, 286, 342, 454, 465, 469]],
];

const bossById = new Map(GAME_BOSSES.map((boss) => [boss.id, boss]));

export interface BossGroup {
	title: string;
	items: BossEntry[];
}

/** Группы боссов игры: считаются один раз. */
export const GAME_BOSS_GROUPS: readonly BossGroup[] = GROUPS.map(([title, ids]) => ({
	title,
	items: ids.map((id) => ({ id, boss: bossById.get(id)! })),
}));

/** Боссы, которых можно позвать в бой: временные, общие и одиночные (рейдовых боссов создать нельзя). Число на плитке «Боссы» в профиле и на кнопке «Создать». */
export const CREATABLE_BOSS_COUNT = GAME_BOSS_GROUPS.filter((group) => group.title !== RAID_BOSSES).reduce((sum, group) => sum + group.items.length, 0);

/** Ослабление боссов (события и бонусы). */
export const DISCOUNTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((value) => ({
	value,
	title: value ? `Слабее на ${value}%` : 'Стандартная сила',
	description: value ? `Здоровье и атака меньше на ${value}%` : 'Здоровье и атака без изменения',
}));
