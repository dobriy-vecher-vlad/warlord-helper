import type { Attrs, RaidNode, Reward } from '../../../api/gameTypes';
import imageStones from '../../../assets/raids/stones.png';
import imageTurmalins from '../../../assets/raids/turmalins.png';
import imagePanda from '../../../assets/raids/panda.png';
import numberI from '../../../assets/raids/I.svg';
import numberII from '../../../assets/raids/II.svg';
import numberIII from '../../../assets/raids/III.svg';
import numberIV from '../../../assets/raids/IV.svg';
import { numberSpaces } from '../../../lib/format';
import { asArray } from '../../../profile/bots/common';
import { rewardItem } from '../../../profile/bots/reward';

/** Данные и разбор ответов рейдов: рейды, режимы, боссы, сундуки, настройки, энергия и награда. Без React. */

export const RAIDS = [
	{ id: 1, title: 'Подземелье форта', icon: 'bot/raids/6.png', image: imageTurmalins, reward: 'турмалины' },
	{ id: 2, title: 'Подвал часовни', icon: 'bot/raids/25.png', image: imageStones, reward: 'камни' },
	{ id: 3, title: 'Паучий лес', icon: 'bot/raids/28.png', image: imagePanda, reward: 'питомец' },
];

export const MODES = [
	{ id: 0, title: 'Лёгкий режим', image: numberI, color: '#7BC838' },
	{ id: 1, title: 'Обычный режим', image: numberII, color: '#557CFD' },
	{ id: 2, title: 'Героический режим', image: numberIII, color: '#B14296' },
	{ id: 3, title: 'Легендарный режим', image: numberIV, color: '#FFAC0F' },
];

/** Боссы рейдов по типу (1–6): название и картинка. */
export const BOSSES: [string, string][][] = [
	[
		['Страж Подземелья', 'bot/raids/6.png'],
		['Слепая Тварь', 'bot/raids/1.png'],
		['Инсектоид', 'bot/raids/5.png'],
		['Скорпион Падальщик', 'bot/raids/2.png'],
		['Кровавый Скорпион', 'bot/raids/3.png'],
		['Ледяной Скорпион', 'bot/raids/4.png'],
	],
	[
		['Жнец Душ', 'bot/raids/25.png'],
		['Последователь Культа', 'bot/raids/24.png'],
		['Адепт Культа', 'bot/raids/23.png'],
		['Скорпион Падальщик', 'bot/raids/2.png'],
		['Кровавый Скорпион', 'bot/raids/3.png'],
		['Ледяной Скорпион', 'bot/raids/4.png'],
	],
	[
		['Магический паук', 'bot/raids/28.png'],
		['Земляной паук', 'bot/raids/26.png'],
		['Ледяной паук', 'bot/raids/27.png'],
		['Ядовитый паук', 'bot/raids/29.png'],
		['Солдат Паук', 'bot/raids/37.png'],
	],
];

/** Сундуки рейда по уровню (1–5): название, картинка, подпись счётчика и энергия на открытие. */
export const CHESTS: [string, string, string][] = [
	['Старый сундук', 'bot/raids/92.png', 'Старые сундуки'],
	['Железный сундук', 'bot/raids/94.png', 'Железные сундуки'],
	['Сапфировый сундук', 'bot/raids/96.png', 'Сапфировые сундуки'],
	['Древний сундук', 'bot/raids/98.png', 'Древние сундуки'],
	['Эпический сундук', 'bot/raids/100.png', 'Эпические сундуки'],
];

/** Тип босса по id: 1 — главный, 2–6 — обычные. */
export const BOSS_TYPES: number[][] = [
	[304, 315, 380],
	[292, 301, 303, 310, 314, 317, 319, 325, 326, 328, 371, 376, 377, 384, 387],
	[298, 306, 307, 311, 316, 318, 320, 321, 323, 324, 372, 378, 379, 385, 388],
	[293, 294, 297, 299, 309, 329, 330, 332, 336, 373, 374, 381, 386, 389],
	[295, 302, 308, 312, 334, 375, 382, 383],
	[296, 300, 305, 327, 331, 333, 335],
];
export const bossType = (id: number) => BOSS_TYPES.findIndex((ids) => ids.includes(id)) + 1;

export interface Settings {
	barrels: boolean;
	chestsTier1: boolean;
	chestsTier2: boolean;
	chestsTier3: boolean;
	chestsTier4: boolean;
	chestsTier5: boolean;
	useScrollLightning: boolean;
	useScrollFire: boolean;
	selectedRaid: number | null;
	selectedMode: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
	barrels: true,
	chestsTier1: true,
	chestsTier2: true,
	chestsTier3: true,
	chestsTier4: true,
	chestsTier5: true,
	useScrollLightning: false,
	useScrollFire: false,
	selectedRaid: null,
	selectedMode: null,
};

export const tierOn = (settings: Settings, tier: number) => !!settings[`chestsTier${tier}` as keyof Settings];
export const anyTier = (settings: Settings) => [1, 2, 3, 4, 5].some((tier) => tierOn(settings, tier));

export interface Chest {
	point: number;
	type: number;
	status: number;
	en: number;
}
export interface Barrel {
	point: number;
	status: number;
}
export interface Boss {
	id: number;
	point: number;
	type: number;
	status: number;
}

export interface RaidData {
	chests: Chest[];
	barrels: Barrel[];
	bosses: Boss[];
	reward: Reward | undefined;
	energy: number;
	id: number;
	mode: number;
	/** Текущая точка; 0 — рейд не начат */
	point: number;
	hp: number;
	limit: number;
	player: Attrs;
}

/** Данные рейда из ответа сервера (updateInfo). */
export function readRaid(data: RaidData, raid: RaidNode) {
	data.chests = asArray<Attrs>(raid.rc).map((item) => ({
		point: Number(item._p),
		type: Number(item._t),
		status: Number(item._s),
		en: [0, 8, 14, 17, 18, Number(raid._mode) === 2 ? 25 : 20][Number(item._t)] ?? 0,
	}));
	data.barrels = asArray<Attrs>(raid.bp).map((item) => ({ point: Number(item._p), status: Number(item._s) }));
	data.bosses = asArray<Attrs>(raid.rb).map((item) => ({ id: Number(item._id), point: Number(item._p), type: bossType(Number(item._id)), status: Number(item._s) }));
	data.reward = raid.r;
	if (data.reward?.i) data.reward.i = asArray(data.reward.i);
	data.id = Number(raid._id);
	data.mode = Number(raid._mode);
	data.point = Number(raid._pos);
	data.hp = Number(raid._hp);
}

/** Энергия, которая нужна на оставшиеся сундуки, бочки и боссов. */
export function neededEnergy(data: RaidData, settings: Settings) {
	let energy = 0;
	for (const chest of data.chests) if (chest.status === 1 && tierOn(settings, chest.type)) energy += chest.en;
	if (settings.barrels) energy += data.barrels.filter((barrel) => barrel.status === 1).length * 3;
	for (const boss of data.bosses) if (boss.status === 0) energy += boss.type === 1 ? 6 : 1;
	return energy;
}

/** Награда рейда карточками: предметы, затем ресурсы. */
export function rewardCards(reward: Reward | undefined): { image: string; title: string; subtitle: string; item?: boolean }[] {
	const cards: { image: string; title: string; subtitle: string; item?: boolean }[] = [];
	for (const item of asArray(reward?.i)) {
		const line = rewardItem(item);
		if (line)
			cards.push({
				image: line.avatar,
				title: line.title === 'Новый фон' ? 'Новый фон' : line.message,
				subtitle: line.title === 'Новый фон' ? 'Окружение' : line.title,
				item: true,
			});
		else cards.push({ image: '', title: 'Ошибка', subtitle: 'Предмет не найден', item: true });
	}
	const resources: [`_${string}`, string, string, boolean][] = [
		['_exp', 'bot/raids/10.png', 'Опыт', true],
		['_m1', 'bot/raids/12.png', 'Серебро', true],
		['_m3', 'bot/raids/11.png', 'Золото', true],
		['_m6', 'bot/raids/21.png', 'Турмалины', false],
		['_pf1', 'bot/raids/20.png', 'Еда', false],
		['_i2', 'bot/raids/18.png', 'Целебные зелья', false],
		['_i1', 'bot/raids/17.png', 'Свитки молнии', false],
		['_i3', 'bot/raids/16.png', 'Свитки огня', false],
	];
	for (const [key, image, title, spaces] of resources) {
		const value = reward?.[key];
		if (Number(value ?? 0) !== 0) cards.push({ image, title, subtitle: `${spaces ? numberSpaces(value) : value} ед.` });
	}
	return cards;
}

/** Строка боя для подписи результата. */
export const fightKey = (fields: Record<string, string | number>) =>
	`<data><d ${Object.entries({ s0: 0, s1: 0, s2: 0, s3: 0, s4: 1, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, m0: 3, r: 0, dd: 0, dg: 0, ...fields })
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ')} /></data>`;

/** Параметры боя с боссом рейда: у босса и у персонажа. */
export interface FightInput {
	/** Здоровье и атака босса */
	hp: number;
	dmg: number;
	/** Здоровье и атака персонажа */
	myHp: number;
	myDmg: number;
	/** Уровень навыка (бьёт раз в 9 очков) */
	skill: number;
	/** Сколько свитков молнии и огня есть */
	lightning: number;
	fire: number;
	/** Тратить ли свитки молнии и огня */
	useLightning: boolean;
	useFire: boolean;
}

/** Итог расчёта боя: что осталось у сторон, сколько ударов каждого вида и сколько урона нанесено и получено. */
export interface FightResult extends FightInput {
	hits: number;
	handHits: number;
	lightningHits: number;
	fireHits: number;
	skillHits: number;
	taken: number;
	dealt: number;
	lightningDmg: number;
	fireDmg: number;
}

/**
 * Бой считается заранее, до отправки результата серверу: навык срабатывает каждые 9 очков, затем свиток молнии,
 * свиток огня (если включены и есть) или обычный удар. Бой идёт, пока живы оба. В итоге `hp` и `myHp` — остаток здоровья.
 */
export function simulateBossFight(input: FightInput): FightResult {
	let { hp, myHp, lightning, fire } = input;
	const { dmg, myDmg, skill } = input;
	const lightningDmg = Math.floor(myDmg * 1.5);
	const fireDmg = myDmg * 3;
	let hits = 0;
	let handHits = 0;
	let lightningHits = 0;
	let fireHits = 0;
	let skillHits = 0;
	let taken = 0;
	let dealt = 0;
	let points = 10;
	do {
		if (points >= 9) {
			points -= 9;
			hp -= myDmg + skill * 7;
			dealt += myDmg + skill * 7;
			skillHits++;
			if (hp <= 0) break;
		}
		if (input.useLightning && lightning !== 0) {
			hp -= lightningDmg;
			dealt += lightningDmg;
			lightning--;
			lightningHits++;
		} else if (input.useFire && fire !== 0) {
			hp -= fireDmg;
			dealt += fireDmg;
			fire--;
			fireHits++;
		} else {
			hp -= myDmg;
			dealt += myDmg;
			handHits++;
		}
		myHp -= dmg;
		taken += dmg;
		points++;
		hits++;
	} while (hp > 0 && myHp > 0);
	return { ...input, hp, myHp, lightning, fire, hits, handHits, lightningHits, fireHits, skillHits, taken, dealt, lightningDmg, fireDmg };
}

/** Строки отчёта о бое для режима разработчика. */
export function fightReport(fight: FightResult): string[] {
	return [
		`Атака босса: ${numberSpaces(fight.dmg)}`,
		`Здоровье босса: ${numberSpaces(fight.hp)}`,
		`Моя атака: ${numberSpaces(fight.myDmg)}`,
		`Моё здоровье: ${numberSpaces(fight.myHp)}`,
		`Свиток молнии: ${numberSpaces(fight.lightning)}`,
		`Свиток огня: ${numberSpaces(fight.fire)}`,
		`Свиток молнии урон: ${numberSpaces(fight.lightningDmg)}`,
		`Свиток огня урон: ${numberSpaces(fight.fireDmg)}`,
		`Количество ударов: ${numberSpaces(fight.hits)}`,
		`Количество ударов руки: ${numberSpaces(fight.handHits)}`,
		`Количество ударов молнии: ${numberSpaces(fight.lightningHits)}`,
		`Количество ударов огня: ${numberSpaces(fight.fireHits)}`,
		`Количество ударов навыка: ${numberSpaces(fight.skillHits)}`,
		`Урон полученный: ${numberSpaces(fight.taken)}`,
		`Урон нанесённый: ${numberSpaces(fight.dealt)}`,
	];
}
