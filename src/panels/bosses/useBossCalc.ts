import { useMemo } from 'react';
import { useBossId, useCustomBosses } from '../../store/bossCalc';
import { GAME_BOSSES, GAME_BOSS_GROUPS, type BossGroup, type CalcBoss } from './bossCalcData';

/** Выбранный босс: босс игры по id или свой противник (отрицательный номер); если такого нет — первый босс игры. */
export function useSelectedBoss(): CalcBoss {
	const id = useBossId();
	const custom = useCustomBosses();
	return (id < 0 ? custom[-id - 1] : GAME_BOSSES.find((boss) => boss.id === id)) ?? GAME_BOSSES[0]!;
}

/** Группы для выбора: группа «Свои боссы» появляется, когда создан хотя бы один свой противник. */
export function useBossGroups(): readonly BossGroup[] {
	const custom = useCustomBosses();
	return useMemo(() => {
		if (!custom.length) return GAME_BOSS_GROUPS;
		return [...GAME_BOSS_GROUPS, { title: 'Свои боссы', items: custom.map((boss, x) => ({ id: -(x + 1), boss })) }];
	}, [custom]);
}
