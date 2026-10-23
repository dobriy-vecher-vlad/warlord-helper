import Bosses from '../data/bosses.json';
import dataMap from '../data/map.json';
import dataBosses from '../data/boss.json';
import dataArena from '../data/arena.json';
import dataCharacter from '../data/character.json';
import dataGuild from '../data/guild.json';
import { ARENA_SEASONS } from '../lib/data';
import { itemAt, type ItemRef } from '../lib/items';

/*
 * Откуда можно получить заточку для предмета. Лежит рядом с окном предмета: только ему нужны данные боссов, карты, арены,
 * персонажа и гильдии, и в общий код разделов они из-за этой функции не попадают.
 */

/** Добавить источник, если такого (без учёта регистра) ещё нет; первый пишется с заглавной буквы. */
function pushSource(sources: string[], lower: string, upper = lower) {
	const text = sources.length ? lower : upper;
	if (!sources.some((s) => s.toLowerCase() === text.toLowerCase())) sources.push(text);
}

/** Где можно получить заточку для предмета (по индексу каталога). Порядок источников — как в старом приложении. */
export function scrollSources(index: number): string[] {
	const item = itemAt(index);
	if (!item) return [];
	const sources: string[] = [];
	const has = (refs: readonly ItemRef[], needScroll = true) => refs.some((ref) => ref.id === index && (!needScroll || ref.scroll));

	for (const adventure of dataMap.adventures) {
		if (adventure.floors.some((floor) => has(floor.items as ItemRef[], false))) pushSource(sources, `приключение ${adventure.title}`, `Приключение ${adventure.title}`);
	}
	for (const raid of dataMap.raids) {
		if (raid.levels.some((level) => has(level.items as ItemRef[]))) pushSource(sources, `рейд ${raid.title}`, `Рейд ${raid.title}`);
	}
	if (ARENA_SEASONS.some((season) => season.month.some((month) => has(month.items as ItemRef[], false)))) {
		pushSource(sources, 'любое приключение', 'Любое приключение');
	}
	for (const group of dataBosses.bosses) {
		for (const boss of group.mobs) {
			if (has(boss.items as ItemRef[])) {
				const name = Bosses.find((b) => b.id === boss.id)?.name;
				pushSource(sources, `босс ${name}`, `Босс ${name}`);
			}
		}
	}
	for (const chest of dataArena.chest) {
		if (has(chest.items as ItemRef[])) pushSource(sources, chest.title);
	}
	for (const pet of dataCharacter.pets) {
		if (has(pet.items as ItemRef[])) pushSource(sources, `питомец ${pet.title}`, `Питомец ${pet.title}`);
	}
	if (dataGuild.items.some((reward) => reward.title === item.title)) pushSource(sources, 'кузница гильдии', 'Кузница гильдии');
	for (const boss of dataGuild.bosses) {
		if (has(boss.items as ItemRef[])) pushSource(sources, `босс ${boss.title}`, `Босс ${boss.title}`);
	}
	if (item.fragments.length) sources.push(sources.length ? 'коллекция' : 'Коллекция');
	return sources;
}
