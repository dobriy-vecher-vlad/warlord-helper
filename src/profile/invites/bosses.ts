import { useEffect, useState } from 'react';
import type Bosses from '../../data/bosses.json';
import type { Boss } from '../../modals/descriptions/bosses';

/** Босс из справочника. */
export type InviteBoss = (typeof Bosses)[number];

type BossMap = ReadonlyMap<number, InviteBoss>;

/** Справочник один на всё приложение: файл читается один раз, словарь строится один раз, а не в каждом окне и странице. */
let bossMap: BossMap | null = null;
let bossLoading: Promise<BossMap> | null = null;
const loadBosses = () => (bossLoading ??= import('../../data/bosses.json').then((module) => (bossMap = new Map(module.default.map((boss) => [boss.id, boss])))));

/** Справочник боссов грузится отдельным файлом (он большой, нужен только страницам боёв и разделу «Боссы»); `enabled` — когда окну он не нужен (закрыто), не грузится. */
export function useBosses(enabled = true) {
	const [bosses, setBosses] = useState<BossMap | null>(bossMap);
	useEffect(() => {
		if (!enabled) return;
		let alive = true;
		void loadBosses().then((map) => alive && setBosses(map));
		return () => {
			alive = false;
		};
	}, [enabled]);
	return bosses;
}

/** Статья о боссе из википедии поверх открытого окна (раздел грузится при первом нажатии); «назад» возвращает к окну. */
export async function openBossWiki(boss: InviteBoss) {
	const [{ default: groups }, { BOSSES_DESCRIPTIONS }, { openDescription, registerDescriptions }] = await Promise.all([
		import('../../data/boss.json'),
		import('../../modals/descriptions/bosses'),
		import('../../modals/descriptions'),
	]);
	registerDescriptions(BOSSES_DESCRIPTIONS);
	const mob = groups.bosses.map((group) => (group.mobs as { id: number }[]).find((item) => item.id === boss.id)).find(Boolean);
	openDescription('bosses.boss', { items: [], ...boss, ...mob } as unknown as Boss);
}
