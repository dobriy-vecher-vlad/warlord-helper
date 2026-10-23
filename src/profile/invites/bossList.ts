import type { Npc, Player } from './accept';

/** Группа боссов для выбора и босс в ней (`id` — id босса игры). */
export interface BossGroupLike<T extends { id: number }> {
	title: string;
	items: T[];
}

/** Район карты: нужный уровень и босс, которого надо убить, чтобы район открылся (id босса игры). */
export interface RegionAccess {
	level: number;
	requires: number | null;
}

export interface BossListData {
	/** Боссы игры из профиля: тип боя (с кем можно начать бой) и нужный уровень самого босса */
	npcs: ReadonlyMap<number, Pick<Npc, 'type' | 'level'>>;
	/** Условия открытия района по его id; null — ещё не загружено */
	locations: ReadonlyMap<number, RegionAccess> | null;
	/** Район босса по его id; null — справочник ещё не загружен */
	regions: ReadonlyMap<number, number> | null;
	player: Pick<Player, 'level'> | null;
	/** Сколько раз персонаж убил каждого босса; null — неизвестно, тогда условие «убить босса» не проверяется */
	kills: ReadonlyMap<number, number> | null;
	/** Название босса по id (для подсказки, кого надо убить) */
	names?: ReadonlyMap<number, string>;
}

/** Босс списка и причина, по которой начать с ним бой пока нельзя (null — можно). */
export type Lockable<T> = T & { lock: string | null };

/**
 * Боссы для выбора, у которых можно начать свой бой: тип боя 1 (общие и одиночные). Внутри группы по уровню локации, а не босса
 * (у разработчиков уровень босса не сходится с локацией), при равном уровне — по номеру района (так они идут по карте), при равном
 * районе — как в исходном списке; id босса порядок не задаёт (у боссов он не совпадает с порядком локаций). Закрытые боссы остаются в списке с причиной: нужный уровень района
 * выше уровня персонажа, не убит босс, без которого район не открывается, или не хватает уровня самого босса. Пока данные
 * локаций, справочник или персонаж не загружены, порядок исходный и всё открыто. Пустые группы пропускаются.
 */
export function selectBosses<T extends { id: number }>(groups: readonly BossGroupLike<T>[], data: BossListData): BossGroupLike<Lockable<T>>[] {
	const { npcs, locations, regions, player, kills, names } = data;
	const ready = !!locations && !!regions;
	const access = (entry: T) => locations?.get(regions?.get(entry.id) ?? 0);
	const level = (entry: T) => access(entry)?.level ?? 0;
	const region = (entry: T) => regions?.get(entry.id) ?? 0;
	const lock = (entry: T): string | null => {
		const region = access(entry);
		if (!ready || !player) return null;
		if (region && region.level > player.level) return `Нужен ${region.level} уровень`;
		if (region?.requires != null && kills && (kills.get(region.requires) ?? 0) === 0) return `Сначала убейте босса «${names?.get(region.requires) ?? region.requires}»`;
		const own = npcs.get(entry.id)?.level ?? 0;
		return own > player.level ? `Нужен ${own} уровень` : null;
	};
	return groups
		.map((group) => {
			const items = group.items.filter((entry) => npcs.get(entry.id)?.type === 1).map((entry) => ({ ...entry, lock: lock(entry) }));
			return { ...group, items: ready ? items.sort((a, b) => level(a) - level(b) || region(a) - region(b)) : items };
		})
		.filter((group) => group.items.length > 0);
}
