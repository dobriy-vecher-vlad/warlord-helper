import type { Npc, Player } from './accept';

/** Группа боссов для выбора и босс в ней (`id` — id босса игры). */
export interface BossGroupLike<T extends { id: number }> {
	title: string;
	items: T[];
}

/** Район карты: нужный уровень (по нему боссы внутри группы идут по порядку карты). */
export interface RegionAccess {
	level: number;
}

export interface BossListData {
	/** Боссы игры из профиля: район, тип боя (с кем можно начать бой) и нужный уровень самого босса */
	npcs: ReadonlyMap<number, Pick<Npc, 'type' | 'level' | 'region'>>;
	/** Данные районов по id (для порядка); null — ещё не загружено */
	locations: ReadonlyMap<number, RegionAccess> | null;
	/** Район босса по его id (для порядка); null — справочник ещё не загружен */
	regions: ReadonlyMap<number, number> | null;
	player: Pick<Player, 'level' | 'maxRegion'> | null;
}

/** Босс списка и причина, по которой начать с ним бой пока нельзя (null — можно). */
export type Lockable<T> = T & { lock: string | null };

/** Причина, по которой с боссом нельзя начать бой (null — можно): район ещё не открыт (правило клиента игры: номер района меньше `locm`) или не хватает уровня. */
export function bossLock(npc: Pick<Npc, 'level' | 'region'> | undefined, player: Pick<Player, 'level' | 'maxRegion'> | null): string | null {
	if (!npc || !player) return null;
	// Данных о числе открытых районов нет (0): район не проверяется
	if (player.maxRegion > 0 && npc.region >= player.maxRegion) return 'Район не открыт: побывайте в нём на карте';
	return npc.level > player.level ? `Нужен ${npc.level} уровень` : null;
}

/**
 * Боссы для выбора, у которых можно начать свой бой: тип боя 1 (общие и одиночные). Внутри группы по уровню локации, а не босса
 * (у разработчиков уровень босса не сходится с локацией), при равном уровне — по номеру района (так они идут по карте), при равном
 * районе — как в исходном списке; id босса порядок не задаёт (у боссов он не совпадает с порядком локаций). Закрытые боссы остаются
 * в списке с причиной (`bossLock`). Пока данные локаций или справочник не загружены, порядок исходный. Пустые группы пропускаются.
 */
export function selectBosses<T extends { id: number }>(groups: readonly BossGroupLike<T>[], data: BossListData): BossGroupLike<Lockable<T>>[] {
	const { npcs, locations, regions, player } = data;
	const ready = !!locations && !!regions;
	const level = (entry: T) => locations?.get(regions?.get(entry.id) ?? 0)?.level ?? 0;
	const region = (entry: T) => regions?.get(entry.id) ?? 0;
	return groups
		.map((group) => {
			const items = group.items.filter((entry) => npcs.get(entry.id)?.type === 1).map((entry) => ({ ...entry, lock: bossLock(npcs.get(entry.id), player) }));
			return { ...group, items: ready ? items.sort((a, b) => level(a) - level(b) || region(a) - region(b)) : items };
		})
		.filter((group) => group.items.length > 0);
}
