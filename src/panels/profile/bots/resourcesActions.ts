import type { Attrs, GameResponse, GuildResponse, ProfileResponse } from '../../../api/gameTypes';
import { getData } from '../../../api/http';
import { getTime } from '../../../lib/format';
import { asArray } from '../../../profile/bots/common';
import { md5 } from '../../../profile/bots/hash';
import { joinRewards, parseReward, type RawReward } from '../../../profile/bots/reward';
import { BUILD_NAMES, CHEST_NAMES, CHEST_TIME, PET_NAMES, RESOURCES, WAR_PLACES, type BotProfile, type CardKey, type Times, type War } from './resourcesData';

/** Ссылки на ежедневную энергию запоминаются, пока открыта страница */
let energyLinks: { from: number; id: number }[] | null = null;

/** Забыть сохранённые ссылки на энергию (страница закрыта). */
export const resetEnergyLinks = () => {
	energyLinks = null;
};

/** Состояние бота, которое действия читают и меняют: разовые настройки, список наборов, счётчики и подсказки карточек. */
export interface ResourceState {
	/** «Собирать со всех» дань гильдии */
	guildReward: boolean;
	/** Первый и последний набег, с которых собирается награда */
	wars: { start: number | null; end: number | null };
	profiles: BotProfile[];
	counts: Record<string, number>;
	times: Times;
	hints: Partial<Record<CardKey, string | null>>;
}

/** Всё, что нужно действию: запрос к игре, данные профиля, состояние карточек и лог. */
export interface ResourceContext {
	game: (body: Record<string, string | number>) => Promise<GameResponse>;
	dataProfile: ProfileResponse;
	user: Attrs;
	builds: Attrs[];
	chests: Attrs[];
	times: Times;
	hints: ResourceState['hints'];
	state: ResourceState;
	profile: BotProfile;
	server: number;
	/** Действие запущено отдельно (не частью «Собрать всё»): сообщает и о том, что собирать нечего */
	needReload: boolean;
	logText: (text: string, color?: 'red' | 'green' | 'blue') => void;
	logMessage: (avatar: string, title: string, body: string | ReturnType<typeof parseReward>) => void;
}

/** Обыск зданий на карте: награда с каждого здания. */
async function collectMap(ctx: ResourceContext) {
	const { game, builds, needReload, logText, logMessage } = ctx;
	const rewards: RawReward[] = [];
	for (const build of builds) {
		const data = await game({ i: 23, t1: build._r!, t2: build._rn! });
		if (data?.j && data?.r) rewards.push(data.r);
	}
	if (rewards.length) logMessage('bot/resources/9_1.png', 'Обыск зданий', parseReward(joinRewards(rewards)));
	else if (needReload) logText('Лимит обыска зданий');
}

/** Улучшение построек на карте, которые можно улучшить. */
async function upgradeMap(ctx: ResourceContext) {
	const { game, builds, needReload, logText, logMessage } = ctx;
	let count = 0;
	for (const build of builds) {
		const data = await game({ i: 24, t1: build._r!, t2: build._rn!, g_sig: md5(`${build._r}ja6`) });
		if (Number(data?.j?._ok) === 1) {
			count++;
			logMessage(`bot/resources/${build._r}_${build._rn}.png`, BUILD_NAMES[Number(data.j._id) - 1] ?? '', `Получен ${Number(data.j._lvl)} уровень`);
		}
	}
	if (count === 0 && needReload) logText('Нет доступных зданий для улучшения');
}

/** Награда с открытого сундука. */
async function collectChest(ctx: ResourceContext) {
	const { game, chests, times, hints, needReload, logText, logMessage } = ctx;
	if (chests.length) {
		const chest = chests.find((item) => Number(item._o) === 1);
		if (chest) {
			const data = await game({ i: 102, t: chest._id! });
			if (data?.r) logMessage(`bot/resources/1_${chest._ci}.png`, CHEST_NAMES[Number(chest._ci)] ?? '', parseReward(data.r));
			else if (needReload) logText('Сундук ещё взламывается');
		} else if (needReload) logText('Нет доступных сундуков для открытия');
	} else {
		times.chest = null;
		hints.chest = 'Нет доступных сундуков';
	}
}

/** Взлом сундука: днём сначала быстрые, ночью долгие. */
async function openChest(ctx: ResourceContext) {
	const { game, chests, times, hints, needReload, logText, logMessage } = ctx;
	if (chests.length) {
		const closed = chests.filter((item) => Number(item._o) === 0);
		const day = new Date().getHours() > 7 && new Date().getHours() < 21;
		const chest = [...closed].sort((a, b) =>
			day ? ((CHEST_TIME[Number(a._ci)] ?? 0) < (CHEST_TIME[Number(b._ci)] ?? 0) ? -1 : 1) : (CHEST_TIME[Number(a._ci)] ?? 0) > (CHEST_TIME[Number(b._ci)] ?? 0) ? -1 : 1,
		)[0];
		if (chest) {
			const data = await game({ i: 100, t: chest._id! });
			if (data?.ch) logMessage(`bot/resources/1_${chest._ci}.png`, CHEST_NAMES[Number(chest._ci)] ?? '', `Откроется через ${getTime(data.ch._ot)}`);
			else if (needReload) logText('Нет доступных мест для взлома');
		} else if (needReload) logText('Нет доступных сундуков для взлома');
	} else {
		times.chest = null;
		hints.chest = 'Нет доступных сундуков';
	}
}

/** Награда с питомца, вернувшегося с поиска. */
async function collectPet(ctx: ResourceContext) {
	const { game, user, needReload, logText, logMessage } = ctx;
	const data = await game({ i: 136, t: user._pet! });
	if (data?.r) logMessage(`bot/resources/4_${user._pet}.png`, PET_NAMES[Number(user._pet)] ?? '', parseReward(data.r));
	else if (needReload) logText('Питомец ещё в пути');
}

/** Отправка питомца на поиск. */
async function sendPet(ctx: ResourceContext) {
	const { dataProfile, game, user, needReload, logText, logMessage } = ctx;
	const data = await game({ i: 135, t: user._pet! });
	if (data?.petloot) logMessage(`bot/resources/4_${user._pet}.png`, PET_NAMES[Number(user._pet)] ?? '', `Прибудет через ${getTime(data.petloot._end_time)}`);
	else if (Number(asArray<Attrs>(dataProfile?.pets?.p).find((pet) => Number(pet._id) === Number(user._pet))?._lp) > Number(user._pf1)) {
		if (needReload) logText('На отправку питомца не хватает еды');
	} else if (needReload) logText('Питомец ещё не прибыл');
}

/** Бесплатная попытка в лотерее. */
async function collectLottery(ctx: ResourceContext) {
	const { game, times, needReload, logText, logMessage } = ctx;
	let reward = null;
	if ((times.lottery ?? 0) <= 0) {
		const data = await game({ i: 28, t1: 5, t2: 1, t3: 0 });
		reward = asArray<Attrs>(data?.r).find((item) => item?._id === undefined);
	}
	if (reward) logMessage('bot/resources/3.png', 'Лотерея', parseReward(reward));
	else if (needReload) logText('Нет бесплатных попыток лотереи');
}

/** Обыск зданий гильдии. */
async function collectGuildBuild(ctx: ResourceContext) {
	const { game, needReload, logText, logMessage } = ctx;
	let count = 0;
	for (const build of [5, 6]) {
		const data = await game({ i: 112, t: build });
		if (data?.r) {
			count++;
			logMessage('bot/resources/1.png', 'Здание гильдии', parseReward(data.r));
		}
	}
	if (count === 0 && needReload) logText('Нет доступных зданий для обыска');
}

/** Дань гильдии за захваченные районы. */
async function collectGuildReward(ctx: ResourceContext) {
	const { game, times, hints, needReload, logText, logMessage } = ctx;
	const data = await game({ i: 155 });
	if (['Необходимо состоять в Гильдии.', 'Ваша гильдия не имеет захваченных территорий.', 'Вы уже забрали свою долю на сегодня.'].includes(data?.msg)) {
		times.guildReward = null;
		hints.guildReward = data.msg.replace(/\./gm, '');
		if (needReload) logText(data.msg.replace(/\./gm, ''));
	} else {
		logMessage('bot/resources/2.png', 'Дань гильдии', parseReward(data?.r));
		times.guildReward = null;
		hints.guildReward = 'Вы уже забрали свою долю на сегодня';
	}
}

/** Награды за побеждённых врагов в набегах гильдии. */
async function collectGuildWars(ctx: ResourceContext) {
	const { game, times, state, needReload, logText, logMessage } = ctx;
	let count = 0;
	if (state.wars.start && state.wars.end) {
		times.guildWars = [];
		for (let war = state.wars.start; war <= state.wars.end; war++) times.guildWars.push({ id: war, name: `Набег #${war}`, date: null });
	}
	for (const war of (times.guildWars || []) as War[]) {
		const data = await game({ i: 106, t: war.id });
		const place = () => `bot/resources/6_${WAR_PLACES.indexOf((war.name ?? '').toLowerCase().replace(/ /gm, ''))}.png`;
		if (data?.cwar?.u) {
			const name = (war.name = data.cwar._en || `Набег #${war.id}`);
			const reward = asArray<Attrs & { r?: RawReward }>(data.cwar.u).find((member) => Object.prototype.hasOwnProperty.call(member, 'r'));
			if (reward?.r && Number(reward._rtn) === 0) {
				const result = await game({ i: 125, t: war.id });
				if (result?.r) {
					count++;
					logMessage(place(), war.date ? `${name} ${war.date}` : name, parseReward(result.r));
				} else if (result && !war.date) {
					logMessage(place(), name, `Обнаружен набег #${war.id} с неизвестным состоянием`);
				}
			} else if (reward && !war.date) {
				logMessage(place(), name, `Обнаружен набег #${war.id} с собранной наградой`);
			}
		} else if (data?.cwar) {
			if (!war.date) logMessage(place(), war.name ?? `Набег #${war.id}`, `Обнаружен набег #${war.id} без вашего участия`);
		} else {
			logText(`Набег #${war.id} не найден`);
		}
	}
	if (count === 0 && needReload) logText('Нет доступных набегов для сбора');
}

/** Ежедневная энергия по известным ссылкам. */
async function collectEnergy(ctx: ResourceContext) {
	const { game, server, needReload, logText, logMessage } = ctx;
	if (!energyLinks) {
		const links = await getData(`https://warlord.website.yandexcloud.net/data/energy/${['ermun', 'antares'][server - 1]}.json`);
		if (Array.isArray(links)) energyLinks = links;
	}
	if (energyLinks) {
		const rewards: RawReward[] = [];
		for (const energy of [...energyLinks]) {
			let data = await game({ i: 87, rid: energy.from, lid: energy.id });
			if (Array.isArray(data) && !(data as { msg?: string }).msg) data = await game({ i: 86, t1: energy.from, lid: energy.id });
			if (data?.r) rewards.push(data.r);
		}
		if (rewards.length) logMessage('bot/resources/0.png', 'Ежедневная энергия', parseReward(joinRewards(rewards)));
		else if (needReload) logText('Все известные ссылки уже собраны');
	} else if (needReload) logText('Ошибка при получении списка энергии');
}

/** Ежедневная награда за вход. */
async function collectDaily(ctx: ResourceContext) {
	const { game, times, hints, needReload, logText, logMessage } = ctx;
	const data = await game({ i: 20 });
	if (Number(data?.res?._val) === 1) logMessage('bot/resources/7.png', 'Ежедневная награда', 'Ежедневная награда собрана');
	else if (needReload) logText('Ежедневная награда уже собрана');
	times.daily = null;
	hints.daily = 'Ежедневная награда уже собрана';
}

/** Премиум сундук. */
async function collectVip(ctx: ResourceContext) {
	const { game, times, hints, needReload, logText, logMessage } = ctx;
	const data = await game({ i: 146, t: 1 });
	if (data?.r) logMessage('bot/resources/8.png', 'Ежедневная награда', parseReward(data.r));
	else if (needReload) logText('Премиум награда уже собрана');
	times.vip = null;
	hints.vip = 'Премиум награда уже собрана';
}

/** Обыск друзей (до 15 раз в день). */
async function collectSearch(ctx: ResourceContext) {
	const { game, times, hints, needReload, logText, logMessage } = ctx;
	const rewards: RawReward[] = [];
	for (let friend = 1; friend <= 15; friend++) {
		const data = await game({ i: 8, t: friend });
		if (data?.msg === 'На сегодня хватит! Можно продолжить завтра.') break;
		if (data?.r) rewards.push(data.r);
	}
	if (rewards.length) logMessage('bot/resources/9.png', 'Обыск друзей', parseReward(joinRewards(rewards)));
	else if (needReload) logText('Лимит обыска друзей');
	times.search = null;
	hints.search = 'Лимит обыска друзей';
}

/** Действия по режиму и виду («режим:вид»). `when` — дополнительное условие, при невыполнении действие пропускается. */
export const RESOURCE_ACTIONS: Record<string, { run: (ctx: ResourceContext) => Promise<void>; when?: (ctx: ResourceContext) => boolean }> = {
	'map:collect': { run: collectMap },
	'map:upgrade': { run: upgradeMap },
	'chest:collect': { run: collectChest },
	'chest:open': { run: openChest },
	'pet:collect': { run: collectPet, when: ({ user }) => Number(user._pet) !== 0 },
	'pet:send': { run: sendPet, when: ({ user }) => Number(user._pet) !== 0 },
	'lottery:collect': { run: collectLottery },
	'guildBuild:collect': { run: collectGuildBuild, when: ({ user }) => Number(user._clan_id) !== 0 },
	'guildReward:collect': { run: collectGuildReward, when: ({ user, state, profile }) => (profile.main || state.guildReward) && Number(user._clan_id) !== 0 },
	'guildWars:collect': { run: collectGuildWars, when: ({ user }) => Number(user._clan_id) !== 0 },
	'energy:collect': { run: collectEnergy },
	'daily:collect': { run: collectDaily },
	'vip:collect': { run: collectVip, when: ({ user }) => Number(user._va) !== 0 },
	'search:collect': { run: collectSearch },
};

/** Таймеры и подсказки карточек по ответам профиля и гильдии; возвращает здания карты и сундуки, из которых действия берут данные. */
export function applyProfile(state: ResourceState, dataProfile: ProfileResponse & { u: Attrs }, guild: GuildResponse | null) {
	const { times, hints } = state;
	const user = dataProfile.u;
	if (Number(user._va) === 0) {
		times.vip = null;
		hints.vip = 'Нет премиум статуса';
	}
	const builds = asArray<Attrs>(dataProfile.j);
	if (dataProfile.j) {
		times.map = builds.length ? `${builds.filter((build) => Number(build._t) <= 0).length} из ${builds.length}` : null;
		hints.map = null;
	} else {
		times.map = null;
		hints.map = 'Нет доступных зданий';
	}
	const chests = asArray<Attrs>(dataProfile?.chests?.ch);
	if (dataProfile?.chests?.ch) {
		times.chest = Number(chests.find((chest) => Number(chest._o) === 1)?._ot) || 'clear';
		hints.chest = null;
	} else {
		times.chest = null;
		hints.chest = 'Нет доступных сундуков';
	}
	times.lottery = Number(user._lott) || 0;
	if (Number(user._pet) === 0) {
		times.pet = null;
		hints.pet = 'Нет активного питомца';
	} else if (dataProfile?.mypets?.p) {
		times.pet = Number(asArray<Attrs>(dataProfile.mypets.p).find((pet) => Number(pet._is_loot) === 1)?._end_time) || 'clear';
		hints.pet = null;
		if (times.pet === 'clear' && Number(asArray<Attrs>(dataProfile?.pets?.p).find((pet) => Number(pet._id) === Number(user._pet))?._lp) > Number(user._pf1)) {
			times.pet = null;
			hints.pet = 'Не хватает еды';
		}
	} else {
		times.pet = null;
		hints.pet = 'Нет доступных питомцев';
	}
	if (guild?.bldngs?.b) {
		times.guildBuilds = Number(asArray<Attrs>(guild.bldngs.b).find((build) => Number(build._id) === 5)?._ptl) || 0;
		hints.guildBuilds = null;
	} else {
		times.guildBuilds = null;
		times.guildReward = null;
		hints.guildBuilds = 'Нет гильдии';
		hints.guildReward = 'Нет гильдии';
	}
	if (guild?.hist?.h) {
		times.guildWars = asArray<Attrs>(guild.hist.h)
			.filter((event) => (Number(event._t) === 18 || Number(event._t) === 20) && Number(event._v3) === 1)
			.map((war): War => ({ id: Number(war._v2), enemy: Number(war._v1), date: war._d ?? null }));
		state.wars.end = times.guildWars[0]?.id || null;
		hints.guildWars = null;
	} else {
		times.guildWars = null;
		hints.guildWars = 'Нет гильдии';
		state.wars = { start: null, end: null };
	}
	for (const key of RESOURCES) state.counts[key] = Number(user[`_${key}`]);
	state.counts.chest = chests.length;
	return { builds, chests };
}
