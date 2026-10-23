import { useEffect, useRef, useState } from 'react';
import { PRIORITY } from '../../api/http';
import { fetchBoss, type FightInfo, type Player } from '../../profile/invites/accept';
import { getInvitesContext, refreshPlayer } from '../../profile/invites/battleStore';

/** Как часто обновляются попытки и состояние боя, пока окно открыто. */
const REFRESH_MS = 5000;

/** Загруженное для `key`: при смене `key` прежние значения не показываются, пока не придут новые. */
interface Loaded {
	key: string | number;
	info: FightInfo | null;
	/** Когда попытка восстановится (мс) */
	deadline: number | null;
}

/**
 * Состояние боя или босса и персонаж, пока окно открыто. `load` вызывается при открытии и затем каждые 5 секунд;
 * персонаж с энергией берётся один раз при открытии (это весь профиль, он тяжёлый). `key` — что показывает окно: при его
 * смене всё загружается заново. `info`: undefined — загрузка, null — данных нет (для приглашения — оно устарело).
 * `wait` — секунд до новой попытки (живой таймер) или null.
 */
export function useFightStats(open: boolean, key: string | number | undefined, load: () => Promise<FightInfo | null>) {
	const [loaded, setLoaded] = useState<Loaded | null>(null);
	const [player, setPlayer] = useState<{ key: string | number; value: Player | null } | null>(null);
	const [now, setNow] = useState(() => Date.now());
	// Загрузчик меняется при каждом рендере окна, а опрос должен идти, пока не сменился `key`
	const loader = useRef(load);
	useEffect(() => {
		loader.current = load;
	});

	useEffect(() => {
		if (!open || key === undefined) return;
		let alive = true;
		const context = getInvitesContext();
		if (context) void refreshPlayer(context.bot, PRIORITY.window).then((value) => alive && setPlayer({ key, value }));
		// В скрытой вкладке запросы не идут; при возвращении обновляется сразу
		const refresh = () => {
			if (document.hidden) return;
			void loader.current().then((info) => {
				if (alive) setLoaded(() => ({ key, info, deadline: info && info.next > 0 ? Date.now() + info.next * 1000 : null }));
			});
		};
		refresh();
		const timer = window.setInterval(refresh, REFRESH_MS);
		document.addEventListener('visibilitychange', refresh);
		return () => {
			alive = false;
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', refresh);
		};
	}, [open, key]);

	const current = loaded && loaded.key === key ? loaded : null;
	const deadline = current?.deadline ?? null;

	// Живой таймер до новой попытки
	useEffect(() => {
		if (!open || deadline === null) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [open, deadline]);

	const wait = deadline === null ? null : Math.max(0, Math.round((deadline - now) / 1000));
	return {
		info: current ? current.info : undefined,
		player: player && player.key === key ? player.value : null,
		wait,
	};
}

/** Попытки на босса без привязки к бою (создание боя, итоги). */
export function useBossStats(open: boolean, bossId: number | undefined) {
	return useFightStats(open, bossId, async () => {
		const context = getInvitesContext();
		const npc = bossId === undefined ? undefined : context?.npcs.get(bossId);
		return context && npc ? fetchBoss(context.bot, npc, PRIORITY.window) : null;
	});
}
