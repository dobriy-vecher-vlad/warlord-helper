import { useEffect } from 'react';
import type { BattleResultData } from '../../modals/profile/BattleResultModal';
import { closeModal, openModal } from '../../store/modal';
import type { RewardLine } from '../bots/reward';
import { clearAttempts } from './attempts';
import { BATTLE_SECONDS } from './battle';
import {
	getBattleSession,
	markBattleFinished,
	patchInvitesContext,
	participantAvatar,
	participantName,
	playRound,
	requestInvitesRefresh,
	roundBusy,
	runRound,
	setBattleSession,
	useBattleSession,
	type RoundResult,
} from './battleStore';

/** Как часто открытое окно боя обновляет состояние, пока игрок не бьёт. */
export const REFRESH_MS = 5000;

/** Бой окончен: все окна боя закрываются, открывается окно итогов, страница приглашений обновляется. `timeout` — вышло время боя. */
export function finishBattle(lines: RewardLine[], timeout = false) {
	const session = getBattleSession();
	if (!session) return;
	const rows = session.battle.participants.map((participant) => ({
		id: participant.id,
		name: participantName(session, participant),
		avatar: participantAvatar(session, participant),
		damage: participant.damage,
	}));
	markBattleFinished(session.battle.fightId);
	patchInvitesContext({ current: null });
	setBattleSession(null);
	clearAttempts();
	requestInvitesRefresh();
	closeModal();
	openModal('battleResult', { npc: session.battle.npc, rows, meId: session.me.id, lines, timeout } satisfies BattleResultData, 'battleResult');
}

/**
 * Бой заканчивается победой над боссом (награда в ответе) или тем, что вышло время боя (всегда 2 часа): тогда босс побеждает.
 * Гибель персонажа бой не заканчивает: он общий, босса могут добить другие. true — бой закончился.
 */
export function endIfFinished(result: RoundResult) {
	if (!result.ok) return false;
	if (result.battle.won) finishBattle(result.lines);
	else if (result.battle.elapsed >= BATTLE_SECONDS) finishBattle([], true);
	else return false;
	return true;
}

/** Обновить текущий бой пустым раундом в общей очереди; закончившийся бой открывает итоги. Нет боя или сбой — ничего. */
export async function syncBattle() {
	if (!getBattleSession()) return;
	try {
		endIfFinished(await runRound(() => playRound()));
	} catch {
		// Нет связи: бой обновится при следующем опросе
	}
}

/**
 * Пока окно открыто и вкладка видна, бой обновляется пустым раундом раз в 5 секунд; при возвращении на вкладку — сразу.
 * Каждое окно боя (основное и список участников) подключает его само: обновляется то, что открыто.
 */
export function useBattleSync(open: boolean) {
	const fightId = useBattleSession()?.battle.fightId;
	useEffect(() => {
		if (!open || !fightId) return;
		const tick = () => {
			if (document.hidden || roundBusy()) return;
			void syncBattle();
		};
		// Сразу при открытии: профиль даёт участников без ников и аватарок, их присылает только раунд боя
		tick();
		const timer = window.setInterval(tick, REFRESH_MS);
		document.addEventListener('visibilitychange', tick);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', tick);
		};
	}, [open, fightId]);
}
