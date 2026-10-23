import type { Attrs, OneOrMany } from '../../api/gameTypes';
import { asArray } from '../bots/common';

/** Навык, который тратит ярость. Значения подтверждены ответами сервера (раздел 4.2а в docs/game-api.md). */
export interface Skill {
	/** Номер навыка: поле `s<номер>` в запросе боя и `_s<номер>` в профиле */
	id: 1 | 2 | 3;
	name: string;
	/** Сколько ярости тратит одно применение */
	cost: number;
	/** Урон навыка за единицу его уровня сверх обычного удара */
	damage: number;
	/** На сколько за единицу уровня навык ослабляет ответный удар босса */
	block: number;
	/** Босс не бьёт в ответ на удар навыком */
	free: boolean;
	description: string;
}

export const SKILLS: readonly Skill[] = [
	{ id: 1, name: 'Свирепый удар', cost: 3, damage: 5, block: 0, free: false, description: '+5 к урону за единицу навыка' },
	{ id: 2, name: 'Блок щитом', cost: 4, damage: 0, block: 1, free: false, description: '−1 к ответному урону за единицу навыка' },
	{ id: 3, name: 'Невидимый удар', cost: 9, damage: 7, block: 0, free: true, description: '+7 к урону за единицу навыка, босс не бьёт в ответ' },
];

/** Лечение одним зельем и за единицу навыка «Мастер целитель». */
const POTION_HEAL = 250;
const POTION_SKILL_HEAL = 3;
/** Ярость в начале боя и множители свитков к обычному удару. */
export const START_RAGE = 10;
const LIGHTNING_FACTOR = 1.5;
const FIRE_FACTOR = 3;
/** Время боя с боссом, секунд: всегда 2 часа, потом босс побеждает. */
export const BATTLE_SECONDS = 7200;
/** Больше ударов за один расчёт не считаем (защита от бесконечного цикла при нулевом уроне). */
const MAX_ROUNDS = 200_000;

/** Характеристики и запасы персонажа из профиля (`u`). */
export interface Fighter {
	/** Обычный удар */
	dmg: number;
	/** Уровни навыков 1–4 (4 — «Мастер целитель») */
	skills: Readonly<Record<1 | 2 | 3 | 4, number>>;
	lightning: number;
	fire: number;
	potions: number;
}

export function parseFighter(user: Attrs): Fighter {
	return {
		dmg: Number(user._dmgi) || 0,
		skills: { 1: Number(user._s1) || 0, 2: Number(user._s2) || 0, 3: Number(user._s3) || 0, 4: Number(user._s4) || 0 },
		lightning: Number(user._item1) || 0,
		fire: Number(user._item3) || 0,
		potions: Number(user._item2) || 0,
	};
}

/** Участник боя и его урон. */
export interface Participant {
	id: number;
	name: string;
	/** Номер аватара (`bot/arena/avatar_<n>.png`), если сервер его прислал */
	avatar: number | null;
	damage: number;
}

/** Состояние общего боя с боссом. */
export interface Battle {
	fightId: number;
	npc: number;
	hp: number;
	maxHp: number;
	/** Атака босса */
	bossDmg: number;
	myHp: number;
	rage: number;
	/** Секунд с начала боя */
	elapsed: number;
	/** Когда сервер прислал это состояние (мс): от него идёт живой таймер времени боя */
	receivedAt: number;
	/** Босс побеждён */
	won: boolean;
	/** Персонаж погиб, а босс жив: бой для него закончен */
	lost: boolean;
	participants: Participant[];
}

interface FightNode extends Attrs {
	l?: OneOrMany<Attrs>;
}

/**
 * Бой из ответа сервера: узел `fight` (в профиле, при входе в бой и в раундах), участники — узлы `l`
 * (внутри `fight` или рядом с ним). null — боя нет (в профиле без боя приходит `fight` с `eid` = 0).
 */
export function parseBattle(data: unknown): Battle | null {
	const root = data as { fight?: FightNode; l?: OneOrMany<Attrs> } | null;
	const fight = root && typeof root === 'object' ? root.fight : undefined;
	if (!fight || typeof fight !== 'object' || !Number(fight._fid) || !Number(fight._eid)) return null;
	const hp = Number(fight._hp);
	const won = Number(fight._res) === 3 || hp <= 0;
	// В профиле рядом с участниками лежат другие узлы `l` (лиги арены): у участника есть урон `dd`. Имя в профиле сервер присылает как «Array»
	const participants = [...asArray(fight.l), ...asArray(root?.l)]
		.filter((node) => node._dd !== undefined && Number(node._id) > 0)
		.map((node) => ({
			id: Number(node._id),
			name: node._n && node._n !== 'Array' ? node._n : '',
			avatar: node._ava ? Number(node._ava) : null,
			damage: Number(node._dd) || 0,
		}));
	return {
		fightId: Number(fight._fid),
		npc: Number(fight._eid),
		hp,
		maxHp: Number(fight._mhp),
		bossDmg: Number(fight._dmg),
		myHp: Number(fight._myhp),
		rage: Number(fight._myr),
		elapsed: Number(fight._time) || 0,
		receivedAt: Date.now(),
		won,
		lost: !won && Number(fight._myhp) <= 0,
		participants,
	};
}

/** Что включено в бою: навык (0 — без навыка) и пределы расхода свитков и зелий (0 — не использовать). */
export interface Setup {
	skill: 0 | 1 | 2 | 3;
	fire: number;
	lightning: number;
	potions: number;
}

/** Итог расчёта нескольких ударов. */
export interface Plan {
	/** Ударов (раундов с обычным ударом, свитками) */
	rounds: number;
	hand: number;
	fire: number;
	lightning: number;
	/** Ударов навыком */
	skillHits: number;
	skill: Setup['skill'];
	potions: number;
	/** Нанесено, получено и вылечено */
	dealt: number;
	taken: number;
	healed: number;
	/** Что останется у босса и у персонажа */
	bossHp: number;
	myHp: number;
	killed: boolean;
	/** Персонаж погибнет */
	dies: boolean;
}

const skillOf = (id: Setup['skill']) => SKILLS.find((skill) => skill.id === id);

/**
 * Расчёт `rounds` ударов. В каждом раунде, если выбран навык и хватает ярости, сначала бьёт навык, затем обычный удар:
 * свиток огня, если остались, иначе свиток молнии, иначе рука. Каждый обычный удар даёт 1 ярости. Зелья расходуются
 * только если без них персонаж погибнет. Босс бьёт в ответ после каждого удара, кроме удара «Невидимого удара».
 */
export function simulate(battle: Battle, me: Fighter, setup: Setup, rounds: number): Plan {
	const skill = skillOf(setup.skill);
	const level = skill ? me.skills[skill.id] : 0;
	let fireLeft = Math.min(setup.fire, me.fire);
	let lightningLeft = Math.min(setup.lightning, me.lightning);
	let hp = battle.hp;
	let rage = battle.rage;
	let done = 0;
	let hand = 0;
	let fire = 0;
	let lightning = 0;
	let skillHits = 0;
	let dealt = 0;
	let taken = 0;
	const strike = (damage: number) => {
		hp -= damage;
		dealt += damage;
	};
	while (done < rounds && hp > 0 && done < MAX_ROUNDS) {
		if (skill && level > 0 && rage >= skill.cost) {
			rage -= skill.cost;
			skillHits++;
			strike(me.dmg + level * skill.damage);
			if (!skill.free) taken += Math.max(0, battle.bossDmg - level * skill.block);
			if (hp <= 0) break;
		}
		if (fireLeft > 0) {
			fireLeft--;
			fire++;
			strike(me.dmg * FIRE_FACTOR);
		} else if (lightningLeft > 0) {
			lightningLeft--;
			lightning++;
			strike(Math.floor(me.dmg * LIGHTNING_FACTOR));
		} else {
			hand++;
			strike(me.dmg);
		}
		taken += battle.bossDmg;
		rage++;
		done++;
	}
	const heal = POTION_HEAL + POTION_SKILL_HEAL * me.skills[4];
	const deficit = taken - (battle.myHp - 1);
	const potions = deficit > 0 ? Math.min(Math.ceil(deficit / heal), setup.potions, me.potions) : 0;
	const healed = potions * heal;
	const myHp = battle.myHp - taken + healed;
	return { rounds: done, hand, fire, lightning, skillHits, skill: setup.skill, potions, dealt, taken, healed, bossHp: hp, myHp, killed: hp <= 0, dies: myHp <= 0 };
}

/** Сколько ударов нужно, чтобы добить босса при этих настройках. */
export const roundsToKill = (battle: Battle, me: Fighter, setup: Setup) => simulate(battle, me, setup, MAX_ROUNDS).rounds;

/**
 * Сколько ударов можно сделать, не погибнув (с включёнными зельями), но не больше, чем нужно, чтобы добить босса.
 * Гибель с числом ударов только растёт, поэтому ответ ищется делением пополам. 0 — не пережить даже один удар.
 * `killRounds` — сколько ударов убивает босса, если оно уже посчитано.
 */
export function survivableRounds(battle: Battle, me: Fighter, setup: Setup, killRounds = roundsToKill(battle, me, setup)): number {
	let low = 0;
	let high = killRounds;
	if (simulate(battle, me, setup, 0).dies) return 0;
	while (low < high) {
		const middle = (low + high + 1) >> 1;
		if (simulate(battle, me, setup, middle).dies) high = middle - 1;
		else low = middle;
	}
	return low;
}

/** Результат подбора настроек для убийства босса. */
export interface Solution {
	setup: Setup;
	plan: Plan;
	/** Босса можно убить, не погибнув */
	feasible: boolean;
}

const full = (me: Fighter, skill: Setup['skill'], fire: number, lightning: number): Setup => ({ skill, fire, lightning, potions: me.potions });

/** Наименьшее число из 0…max, при котором условие выполняется (условие растёт с числом); null — не выполняется и при max. */
function smallest(max: number, ok: (value: number) => boolean): number | null {
	if (!ok(max)) return null;
	let low = 0;
	let high = max;
	while (low < high) {
		const middle = (low + high) >> 1;
		if (ok(middle)) high = middle;
		else low = middle + 1;
	}
	return low;
}

/**
 * Подбор настроек, чтобы добить босса за один раз и выжить. Сначала навык (свободный «Невидимый удар» лучше прочих) и
 * зелья, если нужны; если не хватает, добавляются свитки огня, затем молнии, и берётся вариант с наименьшим их расходом.
 * Если не выжить и со всем запасом, возвращается вариант с полным запасом и `feasible: false`.
 */
export function solveKill(battle: Battle, me: Fighter): Solution {
	const skills: Setup['skill'][] = [...SKILLS.filter((skill) => me.skills[skill.id] > 0)]
		.sort((a, b) => Number(b.free) - Number(a.free) || b.damage - a.damage)
		.map((skill) => skill.id);
	const options: Setup['skill'][] = [...skills, 0];
	const attempt = (setup: Setup) => simulate(battle, me, setup, MAX_ROUNDS);
	const safe = (plan: Plan) => plan.killed && !plan.dies;

	// Без свитков: из подходящих берём тот, где меньше зелий, затем меньше полученного урона
	const bare = options
		.map((skill) => ({ setup: full(me, skill, 0, 0), plan: attempt(full(me, skill, 0, 0)) }))
		.filter((item) => safe(item.plan))
		.sort((a, b) => a.plan.potions - b.plan.potions || a.plan.taken - b.plan.taken || a.plan.rounds - b.plan.rounds)[0];
	if (bare) return { ...bare, feasible: true };

	// Со свитками: наименьший расход (огонь, затем молния), навык — любой из доступных
	let best: { setup: Setup; plan: Plan; spent: number } | null = null;
	for (const skill of options) {
		const fire = smallest(me.fire, (count) => safe(attempt(full(me, skill, count, 0))) || count === me.fire);
		const needFire = fire ?? me.fire;
		const lightning = safe(attempt(full(me, skill, needFire, 0))) ? 0 : smallest(me.lightning, (count) => safe(attempt(full(me, skill, needFire, count))));
		if (lightning === null) continue;
		const setup = full(me, skill, needFire, lightning);
		const plan = attempt(setup);
		const spent = plan.fire + plan.lightning;
		if (safe(plan) && (!best || spent < best.spent || (spent === best.spent && plan.potions < best.plan.potions))) best = { setup, plan, spent };
	}
	if (best) return { setup: best.setup, plan: best.plan, feasible: true };
	const all = full(me, options[0] ?? 0, me.fire, me.lightning);
	return { setup: all, plan: attempt(all), feasible: false };
}

/** Поля запроса `i: 12` для рассчитанных ударов (ключ боя; `s4` и `m0` — как у клиента). */
export function attackKey(plan: Plan): Record<string, number> {
	const skill = plan.skill ? { [`s${plan.skill}`]: plan.skillHits } : {};
	return { s0: plan.hand, ...skill, c1: plan.lightning, c2: plan.potions, c3: plan.fire, r: plan.rounds + plan.skillHits, dd: plan.dealt, dg: plan.taken };
}

/** Готовые ответы «убьёт в одиночку»: расчёт тяжёлый (перебор навыков), а метка рисуется в каждой строке списка при каждой перерисовке. */
const aloneCache = new Map<string, boolean>();

/**
 * Хватит ли персонажу сил убить босса в одиночку: расчёт с навыками, но без свитков и зелий. `hp` — сколько здоровья у босса
 * сейчас, `myHp` — здоровье персонажа, `rage` — его ярость (по умолчанию 10, как при входе в бой).
 */
export function canKillAlone(boss: { hp: number; dmg: number }, me: Fighter, myHp: number, rage = START_RAGE): boolean {
	const key = [boss.hp, boss.dmg, me.dmg, me.skills[1], me.skills[2], me.skills[3], myHp, rage].join(':');
	const cached = aloneCache.get(key);
	if (cached !== undefined) return cached;
	const state: Battle = { fightId: 0, npc: 0, hp: boss.hp, maxHp: boss.hp, bossDmg: boss.dmg, myHp, rage, elapsed: 0, receivedAt: 0, won: false, lost: false, participants: [] };
	const result = solveKill(state, { ...me, lightning: 0, fire: 0, potions: 0 }).feasible;
	if (aloneCache.size > 2000) aloneCache.clear();
	aloneCache.set(key, result);
	return result;
}
