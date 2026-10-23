import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PickPanel } from '../../components/wiki/PickPanel';
import { SoloSlot } from '../../modals/profile/BattleParts';
import type { CreateModalData } from '../../modals/profile/CreateModal';
import type { FightInfo } from '../../profile/invites/accept';
import { AttemptsQueue } from '../../profile/invites/attempts';
import { selectBosses, type RegionAccess } from '../../profile/invites/bossList';
import { canKillAlone } from '../../profile/invites/battle';
import { useInvitesContext } from '../../profile/invites/battleStore';
import { useBosses } from '../../profile/invites/bosses';
import { openModal } from '../../store/modal';
import { openPanel } from '../../store/nav';
import { GAME_BOSS_GROUPS, type BossEntry } from '../bosses/bossCalcData';
import { sectionBase } from '../section';

const base = sectionBase('profile', 'Мой профиль');

const bossName = ({ boss }: BossEntry) => boss.name;

/**
 * Условия открытия районов (уровень и босс, которого надо убить). Данные районов тянут за собой справочник боссов, поэтому
 * грузятся отдельным файлом, пока список уже показан в исходном порядке.
 */
function useRegionAccess() {
	const [locations, setLocations] = useState<ReadonlyMap<number, RegionAccess> | null>(null);
	useEffect(() => {
		let alive = true;
		void Promise.all([import('../../modals/descriptions/map'), import('../../data/bosses.json')]).then(([map, bosses]) => {
			if (!alive) return;
			setLocations(
				new Map(
					map.LOCATIONS.map((location) => [
						location.id,
						{
							level: typeof location.lvl === 'number' ? location.lvl : 0,
							// В районе записан номер босса в справочнике (не его id)
							requires: typeof location.boss === 'number' ? (bosses.default[location.boss]?.id ?? null) : null,
						},
					]),
				),
			);
		});
		return () => {
			alive = false;
		};
	}, []);
	return locations;
}

/** Попытки на боссов: спрашиваются только для строк, попавших на экран, по одному боссу в секунду. */
function useAttempts() {
	const context = useInvitesContext();
	// Очередь зависит от профиля и справочника боссов, а не от всего контекста: он заменяется при каждом обновлении профиля
	const bot = context?.bot;
	const npcs = context?.npcs;
	const [attempts, setAttempts] = useState<ReadonlyMap<number, FightInfo | null>>(new Map());
	const queue = useRef<AttemptsQueue | null>(null);
	useEffect(() => {
		if (!bot || !npcs) return;
		const instance = new AttemptsQueue(bot, npcs, (id, info) => setAttempts((current) => new Map(current).set(id, info)));
		queue.current = instance;
		// Вкладку открыли снова: пока она была скрыта, попытки могли измениться
		const onVisible = () => {
			if (!document.hidden) instance.refresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			instance.stop();
			queue.current = null;
		};
	}, [bot, npcs]);
	const request = useCallback((id: number) => queue.current?.request(id), []);
	const cancel = useCallback((id: number) => queue.current?.cancel(id), []);
	return { attempts, request, cancel };
}

/**
 * 12. Выбор босса для своего боя: боссы по группам, как в калькуляторе, с поиском. Показаны только те, с кем можно
 * начать бой (тип боя 1: общие и одиночные боссы); рейдовые, подземелья и боевые задания создаются в другом месте.
 * Внутри группы боссы идут по уровню локации (не босса: у боссов уровень указан криво, а локация задаёт, когда он доступен);
 * закрытые боссы (локация выше уровня персонажа, не убит босс, которого район требует, или не хватает уровня самого босса)
 * остаются в списке серыми с причиной и не нажимаются.
 * Справа: сколько осталось попыток и метка SOLO — босса можно убить в одиночку (расчёт с навыками, без свитков и зелий).
 */
export function CreateBossPanel({ id }: { id: string }) {
	const context = useInvitesContext();
	const bosses = useBosses();
	const locations = useRegionAccess();
	const player = context?.player ?? null;

	// Без данных страницы приглашений (прямая ссылка) выбирать нечего: возвращаем на страницу, она их загрузит
	useEffect(() => {
		if (!context) openPanel('11');
	}, [context]);

	const regions = useMemo(() => (bosses ? new Map([...bosses.values()].map((boss) => [boss.id, boss.region])) : null), [bosses]);
	const names = useMemo(() => (bosses ? new Map([...bosses.values()].map((boss) => [boss.id, boss.name])) : undefined), [bosses]);
	const groups = useMemo(
		() => selectBosses(GAME_BOSS_GROUPS, { npcs: context?.npcs ?? new Map(), locations, regions, player, kills: context?.kills ?? null, names }),
		[context, locations, regions, player, names],
	);
	const { attempts, request, cancel } = useAttempts();
	// Метки SOLO у части строк: у остальных на их месте пустое поле, чтобы правый край не гулял
	const solo = (entry: { id: number; boss: Parameters<typeof canKillAlone>[0]; lock: string | null }) =>
		!entry.lock && !!player && canKillAlone(entry.boss, player.fighter, player.maxHp);
	const anySolo = groups.some((group) => group.items.some(solo));

	return (
		<PickPanel
			head={base(id, 'Выбор босса', 29)}
			back="11"
			groups={groups}
			searchBy={bossName}
			empty={context ? 'Нет боссов' : 'Загрузка…'}
			view={(entry) => {
				const { boss } = entry;
				const info = entry.lock ? undefined : attempts.get(entry.id);
				const tries = bosses?.get(entry.id)?.tries;
				return {
					disabled: entry.lock !== null,
					title: boss.name,
					subtitle: entry.lock ?? boss.description,
					image: boss.icon,
					count: info && tries ? `${info.left} / ${tries}` : undefined,
					countLabel: info && tries ? 'попыток' : undefined,
					badge: entry.lock ? undefined : <SoloSlot solo={solo(entry)} reserve={anySolo} />,
				};
			}}
			isSelected={() => false}
			onVisible={(entry) => request(entry.id)}
			onHidden={(entry) => cancel(entry.id)}
			onPick={(entry) => {
				const boss = bosses?.get(entry.id);
				if (boss) openModal('create', { boss } satisfies CreateModalData);
			}}
		/>
	);
}
