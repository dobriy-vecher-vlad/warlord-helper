import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FavoriteButton } from '../../components/wiki/FavoriteButton';
import { ATTEMPTS_FROM, numberForm } from '../../lib/format';
import { PickPanel, type GroupAction } from '../../components/wiki/PickPanel';
import { SoloSlot } from '../../modals/profile/BattleParts';
import type { CreateModalData } from '../../modals/profile/CreateModal';
import type { FightInfo } from '../../profile/invites/accept';
import { AttemptsQueue } from '../../profile/invites/attempts';
import { selectBosses, type RegionAccess } from '../../profile/invites/bossList';
import { canKillAlone } from '../../profile/invites/battle';
import { useInvitesContext } from '../../profile/invites/battleStore';
import { useBosses } from '../../profile/invites/bosses';
import { clearRecent, loadBossLists, reorderFavorites, toggleFavorite, useBossLists } from '../../profile/invites/favorites';
import { openModal, useAnyModal } from '../../store/modal';
import { openPanel } from '../../store/nav';
import { GAME_BOSS_GROUPS, type BossEntry } from '../bosses/bossCalcData';
import { sectionBase } from '../section';

const FAVORITES = 'Избранные';
const RECENT = 'Недавние';

const base = sectionBase('profile', 'Мой профиль');

const bossName = ({ boss }: BossEntry) => boss.name;

/**
 * Уровни районов: по ним боссы внутри группы идут в порядке карты. Данные районов тянут за собой справочник боссов, поэтому
 * грузятся отдельным файлом, пока список уже показан в исходном порядке.
 */
function useRegionAccess() {
	const [locations, setLocations] = useState<ReadonlyMap<number, RegionAccess> | null>(null);
	useEffect(() => {
		let alive = true;
		void import('../../modals/descriptions/map').then((map) => {
			if (alive) setLocations(new Map(map.LOCATIONS.map((location) => [location.id, { level: typeof location.lvl === 'number' ? location.lvl : 0 }])));
		});
		return () => {
			alive = false;
		};
	}, []);
	return locations;
}

/** Ближайший родитель с прокруткой (страница, если своей прокрутки нет). */
function scrollParent(node: HTMLElement): HTMLElement {
	for (let parent = node.parentElement; parent; parent = parent.parentElement) {
		const { overflowY } = getComputedStyle(parent);
		if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) return parent;
	}
	return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** Звезда, за которой следим при изменении списка: её место на экране до нажатия. */
interface Anchor {
	node: HTMLElement;
	/** Следующая звезда: на неё переходим, если нажатая строка из списка исчезла (убрали из «Избранных») */
	next: HTMLElement | null;
	top: number;
	nextTop: number;
}

/**
 * Попытки на боссов: спрашиваются только для строк, попавших на экран, по одному боссу в секунду. Пока поверх страницы открыто окно
 * или вкладка скрыта, запросы не идут (очередь игры общая, а страница под окном никому не видна); когда фокус вернулся,
 * очередь продолжается, а устаревшие значения спрашиваются заново.
 */
function useAttempts() {
	const context = useInvitesContext();
	// Очередь зависит от профиля и справочника боссов, а не от всего контекста: он заменяется при каждом обновлении профиля
	const bot = context?.bot;
	const npcs = context?.npcs;
	const [attempts, setAttempts] = useState<ReadonlyMap<number, FightInfo | null>>(new Map());
	// Один босс может быть на экране в нескольких строках (избранное, последние, общий список): запрос отменяется, когда ушла последняя
	const shown = useRef(new Map<number, number>());
	const queue = useRef<AttemptsQueue | null>(null);
	const modalOpen = useAnyModal();
	const covered = useRef(modalOpen);
	const sync = () => {
		if (document.hidden || covered.current) queue.current?.pause();
		else queue.current?.resume();
	};
	useEffect(() => {
		covered.current = modalOpen;
		sync();
	}, [modalOpen]);
	useEffect(() => {
		if (!bot || !npcs) return;
		const instance = new AttemptsQueue(bot, npcs, (id, info) => setAttempts((current) => new Map(current).set(id, info)));
		queue.current = instance;
		sync();
		// Строки, уже бывшие на экране, заново не появятся: новая очередь (другой профиль или справочник) спрашивает о них сама.
		// Сначала sync: под открытым окном очередь должна уже стоять на паузе
		for (const id of shown.current.keys()) instance.request(id);
		document.addEventListener('visibilitychange', sync);
		return () => {
			document.removeEventListener('visibilitychange', sync);
			instance.stop();
			queue.current = null;
		};
	}, [bot, npcs]);
	const request = useCallback((id: number) => {
		shown.current.set(id, (shown.current.get(id) ?? 0) + 1);
		queue.current?.request(id);
	}, []);
	const cancel = useCallback((id: number) => {
		const left = (shown.current.get(id) ?? 1) - 1;
		if (left > 0) return void shown.current.set(id, left);
		shown.current.delete(id);
		queue.current?.cancel(id);
	}, []);
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
		if (!context) openPanel('11', { force: true });
	}, [context]);

	const regions = useMemo(() => (bosses ? new Map([...bosses.values()].map((boss) => [boss.id, boss.region])) : null), [bosses]);
	const bot = context?.bot;
	useEffect(() => {
		if (bot) void loadBossLists(bot);
	}, [bot]);
	const lists = useBossLists(bot);
	// Звезда добавляет или убирает строки выше: страница сдвигается на их высоту, поэтому место нажатой строки на экране сохраняется
	const anchor = useRef<Anchor | null>(null);
	const toggle = (button: HTMLElement, id: number) => {
		if (!bot) return;
		const stars = [...document.querySelectorAll<HTMLElement>('[data-star]')];
		const next = stars[stars.indexOf(button) + 1] ?? null;
		anchor.current = { node: button, next, top: button.getBoundingClientRect().top, nextTop: next?.getBoundingClientRect().top ?? 0 };
		void toggleFavorite(bot, id);
	};
	useLayoutEffect(() => {
		const saved = anchor.current;
		if (!saved) return;
		anchor.current = null;
		const [node, before] = saved.node.isConnected ? [saved.node, saved.top] : [saved.next, saved.nextTop];
		if (!node?.isConnected) return;
		const shift = node.getBoundingClientRect().top - before;
		if (shift) scrollParent(node).scrollTop += shift;
	}, [lists]);
	// Избранные и последние идут двумя группами поверх обычных; закрытые боссы остаются в них серыми, как в общем списке
	const npcs = context?.npcs;
	const groups = useMemo(() => {
		const all = selectBosses(GAME_BOSS_GROUPS, { npcs: npcs ?? new Map(), locations, regions, player });
		const byId = new Map(all.flatMap((group) => group.items).map((entry) => [entry.id, entry]));
		const pick = (title: string, list: readonly number[]) => ({ title, items: list.flatMap((id) => byId.get(id) ?? []) });
		return [pick(FAVORITES, lists.favorites), pick(RECENT, lists.recent), ...all];
	}, [npcs, locations, regions, player, lists]);
	// Режим изменения порядка избранных; без избранных (или с одним) он не нужен
	const [editing, setEditing] = useState(false);
	const reordering = editing && lists.favorites.length > 1;
	// Избранных осталось меньше двух: режим выключается, чтобы не включиться сам, когда добавят новых
	if (editing && lists.favorites.length < 2) setEditing(false);
	const favoriteIds = groups[0]?.title === FAVORITES ? groups[0].items.map((entry) => entry.id) : [];
	const groupActions = (title: string, searching: boolean): GroupAction[] => {
		const actions: GroupAction[] = [];
		if (title === FAVORITES && !searching) {
			// В режиме изменения порядка «Убить» не показывается
			if (!reordering) actions.push({ label: 'Убить', onClick: () => openModal('killAll') });
			if (lists.favorites.length > 1) actions.push({ label: reordering ? 'Готово' : 'Изменить', onClick: () => setEditing(!reordering) });
		}
		if (title === RECENT && bot) actions.push({ label: 'Очистить', onClick: () => void clearRecent(bot) });
		return actions;
	};
	const reorder =
		reordering && bot
			? {
					group: FAVORITES,
					onReorder: (from: number, to: number) => {
						const order = [...favoriteIds];
						order.splice(to, 0, ...order.splice(from, 1));
						void reorderFavorites(bot, order);
					},
				}
			: null;
	const { attempts, request, cancel } = useAttempts();
	// Метки SOLO у части строк: у остальных на их месте пустое поле, чтобы правый край не гулял
	const solo = (entry: { id: number; boss: Parameters<typeof canKillAlone>[0]; lock: string | null }) =>
		!entry.lock && !!player && canKillAlone(entry.boss, player.fighter, player.maxHp);
	// Страница перерисовывается при каждом ответе о попытках (раз в секунду): расчёт по всем боссам делается только при смене списка или персонажа
	const anySolo = useMemo(() => groups.some((group) => group.items.some(solo)), [groups, player]); // eslint-disable-line react-hooks/exhaustive-deps

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
				const favorite = lists.favorites.includes(entry.id);
				return {
					before: bot && <FavoriteButton active={favorite} label={favorite ? 'Убрать из избранного' : 'В избранное'} onToggle={(button) => toggle(button, entry.id)} />,
					disabled: entry.lock !== null,
					title: boss.name,
					subtitle: entry.lock ?? boss.description,
					image: boss.icon,
					count: info && tries ? `${info.left} из ${tries}` : undefined,
					countLabel: info && tries ? numberForm(tries, ATTEMPTS_FROM) : undefined,
					badge: entry.lock ? undefined : <SoloSlot solo={solo(entry)} reserve={anySolo} />,
				};
			}}
			itemKey={(entry) => entry.id}
			groupActions={groupActions}
			reorder={reorder}
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
