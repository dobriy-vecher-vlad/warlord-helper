import { botAuth, loadBotProfile, type BotAuth } from '../bots/common';
import { getGame } from '../../api/game';
import type { ProfileResponse } from '../../api/gameTypes';
import { parseKills, parseNpcs, playerOf, type Npc } from './accept';
import { battleFromProfile, setInvitesContext } from './battleStore';
import { fetchInvites, sortInvites, visibleInvites, type Invite } from './invites';
import { loadPlayers, type PlayerIndex } from './players';

/** Как часто обновляется список, пока страница открыта и видна. */
export const POLL_MS = 60_000;

/** Список приглашений профиля `owner` (по нему страница отличает свои данные от данных прежнего профиля). */
export interface InvitesState {
	owner: string | null;
	/** null — первого списка ещё нет */
	invites: Invite[] | null;
	/** Когда список получен (мс) */
	updatedAt: number | null;
	/** Последний опрос не удался: показан предыдущий список */
	failed: boolean;
	players: PlayerIndex | null;
	/** Боссы игры (из профиля) */
	npcs: ReadonlyMap<number, Npc> | null;
}

export const emptyInvites = (owner: string | null): InvitesState => ({ owner, invites: null, updatedAt: null, failed: false, players: null, npcs: null });

/** То, что один раз готовится перед опросом. */
interface Context {
	bot: BotAuth;
	clanId: number;
	players: PlayerIndex;
	npcs: ReadonlyMap<number, Npc>;
}

export interface PollerEvents {
	state: (update: (current: InvitesState) => InvitesState) => void;
	loading: (value: boolean) => void;
}

/**
 * Опрос приглашений одного профиля. Раз в минуту (пока вкладка видна) опрашивается список активных игроков от имени профиля
 * пользователя; сбой не стирает последний список, повтор — через минуту. Нет ключа авторизации или он не подошёл —
 * открываются настройки профиля (как у ботов), опрос не начинается. Живёт вне React, поэтому и работает по таймерам:
 * хук `useInvites` только создаёт его на время открытой страницы.
 */
/** Данные профиля, которые нужны окнам и странице: персонаж, убийства боссов, бой, в котором он сейчас. */
function applyProfile(context: { bot: BotAuth; npcs: ReadonlyMap<number, Npc>; players: PlayerIndex | null }, profile: ProfileResponse) {
	setInvitesContext({
		bot: context.bot,
		npcs: context.npcs,
		players: context.players,
		player: playerOf(profile.u),
		kills: parseKills(profile),
		current: battleFromProfile(profile),
	});
}

export class InvitesPoller {
	private alive = false;
	private busy = false;
	/** Обновление просили, пока шёл опрос: после него нужен ещё один (иначе просьба терялась, например после конца боя) */
	private pending = false;
	private context: Context | null = null;
	private timer = 0;
	private waiting = false;

	constructor(
		private readonly owner: string | null,
		private readonly events: PollerEvents,
	) {}

	start() {
		this.alive = true;
		document.addEventListener('visibilitychange', this.onVisible);
		void this.poll();
	}

	stop() {
		this.alive = false;
		window.clearTimeout(this.timer);
		document.removeEventListener('visibilitychange', this.onVisible);
	}

	/** Вкладка снова видна: опрос, ждавший этого, возобновляется. */
	private onVisible = () => {
		if (!document.hidden && this.waiting) {
			this.waiting = false;
			void this.poll();
		}
	};

	private schedule() {
		if (document.hidden) {
			// Вкладка скрыта: опрос возобновится, когда она станет видимой
			this.waiting = true;
			return;
		}
		this.timer = window.setTimeout(() => void this.poll(), POLL_MS);
	}

	private async prepare(): Promise<Context | null> {
		const bot = botAuth();
		if (!bot) return null;
		// Нет ответа (сеть) не считается неверным ключом: страница не выбрасывается в настройки, опрос повторится через минуту
		const profile = await loadBotProfile(bot, (data) => data === null || !!data.u);
		if (!profile) return null;
		const npcs = parseNpcs(profile);
		// «Текущий бой» и персонаж известны сразу, не дожидаясь большого файла игроков
		applyProfile({ bot, npcs, players: null }, profile);
		const players = await loadPlayers(bot.server);
		if (!players) return null;
		const context: Context = { bot, clanId: Number(profile.u._clan_id) || 0, players, npcs };
		applyProfile(context, profile);
		return context;
	}

	/** Один опрос: профиль (персонаж, убийства, бой, в котором он сейчас) и список приглашений. Ручное обновление и конец боя запускают его же. */
	poll = async () => {
		if (!this.alive) return;
		if (this.busy) {
			this.pending = true;
			return;
		}
		this.busy = true;
		window.clearTimeout(this.timer);
		this.events.loading(true);
		try {
			// Профиль каждый раз свежий: бой, в котором персонаж, берётся из игры, а не из памяти (при первом опросе он уже загружен)
			const first = !this.context;
			if (first) {
				const prepared = await this.prepare();
				if (!this.alive) return;
				this.context = prepared;
			}
			const context = this.context;
			if (!context) {
				// Нет ключа/файла игроков: если ключа нет, настройки уже открыты; иначе повторим через минуту
				this.events.state((current) => ({ ...current, owner: this.owner, failed: true }));
				return;
			}
			if (!first) {
				// Сбой запроса профиля прежние данные не стирает: повторим через минуту
				const profile = await getGame(context.bot.server, {}, context.bot.auth);
				if (!this.alive) return;
				if (profile?.u) applyProfile(context, profile);
			}
			const found = await fetchInvites(context.bot.server, context.bot.auth, context.players.ids);
			if (!this.alive) return;
			this.events.state((current) =>
				found
					? { owner: this.owner, invites: sortInvites(visibleInvites(found, context.clanId)), updatedAt: Date.now(), failed: false, players: context.players, npcs: context.npcs }
					: { ...current, owner: this.owner, failed: true, players: context.players, npcs: context.npcs },
			);
		} catch {
			// Неожиданный сбой разбора или сети не оставляет страницу в загрузке: список помечается устаревшим, повтор по расписанию
			if (this.alive) this.events.state((current) => ({ ...current, owner: this.owner, failed: true }));
		} finally {
			this.busy = false;
			if (this.alive) {
				this.events.loading(false);
				if (this.pending) {
					this.pending = false;
					void this.poll();
				} else this.schedule();
			}
		}
	};
}
