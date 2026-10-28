import { getGame } from '../../api/game';
import { PRIORITY } from '../../api/http';
import type { ProfileResponse } from '../../api/gameTypes';
import { notify } from '../../app/notify';
import { createStore, useStore } from '../../store/createStore';
import { getModalStack, openModal, subscribeModals } from '../../store/modal';
import { fightKey } from '../../panels/profile/bots/raidData';
import { type BotAuth } from '../bots/common';
import { fightHash } from '../bots/hash';
import { parseReward, type RewardLine } from '../bots/reward';
import type { Me } from './accept';
import { attackKey, parseBattle, parseFighter, type Battle, type Fighter, type Participant, type Plan } from './battle';
import type { PlayerIndex } from './players';
import { currentProfile, getSession, useSession, type SessionState } from '../session';
import { createFight, enterFight, fetchFight, playerOf, type EnterResult, type FightInfo, type Npc, type Player } from './accept';
import { clearAttempts } from './attempts';
import { rememberRecent } from './favorites';
import type { Invite } from './invites';

/** Текущий бой игрока: состояние боя, его запасы и всё, что нужно для запросов. */
export interface BattleSession {
	battle: Battle;
	fighter: Fighter;
	me: Me;
	bot: BotAuth;
	/** Имена участников, которые сервер присылал раньше (в части ответов имя пустое) */
	names: ReadonlyMap<number, string>;
	players: PlayerIndex | null;
	/** Номер открытия окна боя: у каждого открытия свой, поэтому лог и подсказки окна начинаются заново */
	opened: number;
}

let openedCount = 0;

/** Бои лежат по профилям: у каждого профиля свой бой, при смене профиля показывается бой выбранного. */
const store = createStore<{ sessions: Readonly<Record<string, BattleSession>> }>({ sessions: {} });

const ownerOf = (bot: BotAuth) => `${bot.server}:${bot.auth.login}`;

/** Ключ выбранного профиля: тот же сервер и логин, что получает бот (`botAuth`). */
function selectedOwner(state: SessionState) {
	const profile = currentProfile(state);
	return profile ? `${profile.server ?? 1}:${profile.login || profile.id || state.user?.id}` : null;
}

/** Выбранный профиль как ключ: меняется при переключении профиля. */
export const useSelectedOwner = () => useSession(selectedOwner);

export const getBattleSession = (): BattleSession | null => store.get().sessions[selectedOwner(getSession()) ?? ''] ?? null;

export function useBattleSession(): BattleSession | null {
	const sessions = useStore(store, (state) => state.sessions);
	const owner = useSession(selectedOwner);
	return sessions[owner ?? ''] ?? null;
}

/** Записать бой профиля, которому он принадлежит; null — убрать бой выбранного профиля. */
export function setBattleSession(session: BattleSession | null) {
	store.set((state) => {
		const sessions = { ...state.sessions };
		if (session) sessions[ownerOf(session.bot)] = session;
		else delete sessions[selectedOwner(getSession()) ?? ''];
		return { sessions };
	});
}

/** Начать бой: из приглашения (вход в бой) или из профиля (бой уже идёт). Участники сразу получают имена. */
export function startBattle(bot: BotAuth, battle: Battle, fighter: Fighter, me: Me, players: PlayerIndex | null) {
	const session: BattleSession = { battle, fighter, me, bot, names: new Map(), players, opened: ++openedCount };
	setBattleSession({ ...session, names: rememberNames(session.names, battle.participants) });
}

/**
 * Бои, которые закончились в этом сеансе. Профиль, запрошенный до конца боя, может прийти уже после него и всё ещё показывать
 * этот бой как идущий: такой бой заново текущим не становится.
 */
const finished = new Set<number>();

export const markBattleFinished = (fightId: number) => {
	if (fightId) finished.add(fightId);
};

/**
 * Бой из ответа профиля: null, если боя нет или он закончился в этом сеансе. Побеждённый босс, чью награду ещё не забрали, остаётся
 * текущим боем (игра так же считает персонажа «на боссе»): окно боя заберёт награду.
 */
export function battleFromProfile(profile: Pick<ProfileResponse, 'u'> & { fight?: unknown }): { battle: Battle; fighter: Fighter; me: Me } | null {
	const battle = parseBattle(profile);
	const user = profile.u;
	if (!battle || !user || finished.has(battle.fightId)) return null;
	return { battle, fighter: parseFighter(user), me: { id: Number(user._id), name: user._name ?? '', avatar: Number(user._aid) || 0 } };
}

function rememberNames(names: ReadonlyMap<number, string>, participants: readonly Participant[]) {
	const next = new Map(names);
	for (const participant of participants) if (participant.name) next.set(participant.id, participant.name);
	return next;
}

/** Имя участника: присланное сервером, запомненное, из списка игроков, иначе «Player<id>». */
export function participantName(session: BattleSession, participant: Participant) {
	if (participant.id === session.me.id && session.me.name) return session.me.name;
	return participant.name || session.names.get(participant.id) || session.players?.byId.get(participant.id)?.name || `Player${participant.id}`;
}

/** Аватар участника: присланный, из списка игроков, свой. */
export function participantAvatar(session: BattleSession, participant: Participant) {
	if (participant.id === session.me.id && session.me.avatar) return session.me.avatar;
	return participant.avatar ?? session.players?.byId.get(participant.id)?.avatar ?? null;
}

/** Результат раунда: новое состояние боя и, если босс побеждён, награда. */
export type RoundResult = { ok: true; battle: Battle; lines: RewardLine[] } | { ok: false; message: string };

const failed = (message: string): RoundResult => ({ ok: false, message });

/**
 * Раунд боя (`i: 12`). С планом — удары, без него — пустой раунд: сервер просто присылает текущее состояние боя
 * (так бой обновляется, пока игрок не бьёт; когда босса добьёт кто-то другой, в ответе приходит и награда).
 * Запас свитков и зелий уменьшается на израсходованное.
 */
export async function playRound(plan?: Plan): Promise<RoundResult> {
	const session = getBattleSession();
	if (!session) return failed('Боя нет');
	const response = await getGame(
		session.bot.server,
		{ i: 12, t: fightHash(fightKey(plan ? attackKey(plan) : {})) },
		session.bot.auth,
		1,
		false,
		plan ? PRIORITY.action : PRIORITY.window,
	);
	const battle = parseBattle(response);
	if (!battle) {
		const code = (response as { err?: { _v?: string } } | null)?.err?._v;
		return failed(code ? `Сервер не принял удары (ошибка ${code})` : 'Нет ответа сервера');
	}
	const fighter = plan
		? { ...session.fighter, lightning: session.fighter.lightning - plan.lightning, fire: session.fighter.fire - plan.fire, potions: session.fighter.potions - plan.potions }
		: session.fighter;
	const lines = battle.won ? parseReward((response as { r?: Parameters<typeof parseReward>[0] }).r) : [];
	// Окно закрыли, пока шёл запрос: бой в память не возвращается, страница получает только новое состояние (или конец боя)
	if (getBattleSession()?.opened !== session.opened) {
		if (battle.won) {
			markBattleFinished(battle.fightId);
			patchInvitesContext({ current: null });
			requestInvitesRefresh();
		} else patchCurrentBattle({ battle, fighter });
		return { ok: true, battle, lines };
	}
	setBattleSession({ ...session, battle, fighter, names: rememberNames(session.names, battle.participants) });
	patchCurrentBattle({ battle, fighter });
	return { ok: true, battle, lines };
}

/** Что страница приглашений знает о выбранном профиле: пригодится окнам создания боя и выбору босса. */
export interface InvitesContext {
	bot: BotAuth;
	npcs: ReadonlyMap<number, Npc>;
	players: PlayerIndex | null;
	/** Персонаж на момент открытия страницы: по нему считается метка SOLO в списках */
	player?: Player | null;
	/** Убийства боссов персонажа (id босса → сколько раз) */
	kills?: ReadonlyMap<number, number>;
	/** Бой, в котором персонаж сейчас, по данным игры (профиль при каждом опросе); null — боя нет */
	current?: CurrentBattle | null;
}

/** Бой персонажа по данным профиля: по нему страница показывает «Текущий бой», а окно боя открывается заново из профиля. */
export interface CurrentBattle {
	battle: Battle;
	fighter: Fighter;
	me: Me;
}

const contexts = createStore<{ byOwner: Readonly<Record<string, InvitesContext>> }>({ byOwner: {} });

export function setInvitesContext(context: InvitesContext) {
	contexts.set((state) => ({ byOwner: { ...state.byOwner, [ownerOf(context.bot)]: context } }));
}

/** Изменить контекст выбранного профиля: бой страницы обновляется без полной замены данных. */
export function patchInvitesContext(patch: Partial<InvitesContext>) {
	const owner = selectedOwner(getSession()) ?? '';
	contexts.set((state) => {
		const current = state.byOwner[owner];
		if (!current) return state;
		// Ничего не изменилось (например, боя по-прежнему нет): подписчики не перерисовываются
		if ((Object.keys(patch) as (keyof InvitesContext)[]).every((key) => current[key] === patch[key])) return state;
		return { byOwner: { ...state.byOwner, [owner]: { ...current, ...patch } } };
	});
}

function patchCurrentBattle(patch: Partial<CurrentBattle> | null) {
	const current = getInvitesContext()?.current;
	if (patch === null) patchInvitesContext({ current: null });
	else if (current) patchInvitesContext({ current: { ...current, ...patch } });
}

export const getInvitesContext = (): InvitesContext | null => contexts.get().byOwner[selectedOwner(getSession()) ?? ''] ?? null;
export const useInvitesContext = (): InvitesContext | null => {
	const byOwner = useStore(contexts, (state) => state.byOwner);
	const owner = useSelectedOwner();
	return byOwner[owner ?? ''] ?? null;
};

/** Принудительное обновление страницы приглашений (после победы и других событий): счётчик, за которым следит страница. */
const refresh = createStore<{ version: number }>({ version: 0 });
export const requestInvitesRefresh = () => refresh.set((state) => ({ version: state.version + 1 }));
export const useRefreshRequest = () => useStore(refresh, (state) => state.version);

/**
 * Раунды боя идут строго по очереди: удары, ручное и автоматическое обновление не накладываются друг на друга, а нажатие
 * во время обновления ждёт своей очереди, а не пропадает.
 */
let tail: Promise<unknown> = Promise.resolve();
let pending = 0;

/** В очереди или в пути есть запрос раунда. */
export const roundBusy = () => pending > 0;

export function runRound<T>(task: () => Promise<T>): Promise<T> {
	pending++;
	const run = tail.then(task);
	tail = run
		.then(
			() => undefined,
			() => undefined,
		)
		.then(() => {
			pending--;
		});
	return run;
}

/** Вход в бой идёт: пока он не закончился, второй не начинается (два входа подряд списали бы энергию и попытку дважды). */
let entering = false;

async function enterOnce(enter: () => Promise<EnterResult>): Promise<EnterResult> {
	if (entering) return { ok: false, message: 'Вход в бой уже идёт' };
	entering = true;
	try {
		return await enter();
	} finally {
		entering = false;
	}
}

/** Создать свой бой с боссом `npcId`. Один бой за раз: пока идёт прежний, новый не создаётся. Окно боя открывает `showBattle`. */
export async function createBattle(npcId: number, cost: number): Promise<EnterResult> {
	const context = getInvitesContext();
	const npc = context?.npcs.get(npcId);
	if (!context || !npc) return { ok: false, message: 'Нет данных о боссе, обновите страницу приглашений' };
	if (context.current) return { ok: false, message: 'Вы уже в бою: сначала закончите его' };
	const result = await enterOnce(() => createFight(context.bot, npc, cost));
	if (result.ok) {
		clearAttempts();
		void rememberRecent(context.bot, npcId);
	}
	return result;
}

/**
 * Персонаж из свежего профиля (для окон приглашения и создания боя): заодно обновляется «текущий бой» контекста, чтобы проверка
 * «Вы уже в бою» опиралась на данные игры, а не на то, что было при открытии страницы.
 */
export async function refreshPlayer(bot: BotAuth, priority: number): Promise<Player | null> {
	const before = getInvitesContext()?.current;
	const profile = await getGame(bot.server, {}, bot.auth, 1, false, priority);
	if (!profile?.u) return null;
	// Пока шёл запрос, бой могли начать или закончить в самом приложении: тогда прежний ответ его не перетирает
	if (getInvitesContext()?.current === before) patchInvitesContext({ current: battleFromProfile(profile) });
	return playerOf(profile.u);
}

/** Состояние боя по приглашению (`i: 10`); null — приглашение устарело или данных о боссе нет. */
export async function fetchInviteFight(invite: Invite): Promise<FightInfo | null> {
	const context = getInvitesContext();
	const npc = context?.npcs.get(invite.npc);
	return context && npc ? fetchFight(context.bot, invite, npc, PRIORITY.window) : null;
}

/** Принять приглашение: войти в бой. Окно боя открывает `showBattle`. */
export async function acceptInvite(invite: Invite, cost: number): Promise<EnterResult> {
	const context = getInvitesContext();
	const npc = context?.npcs.get(invite.npc);
	if (!context || !npc) return { ok: false, message: 'Нет данных о боссе, обновите список' };
	if (context.current) return { ok: false, message: 'Вы уже в бою: сначала закончите его' };
	const result = await enterOnce(() => enterFight(context.bot, invite, npc, cost));
	if (result.ok) {
		clearAttempts();
		void rememberRecent(context.bot, invite.npc);
	}
	return result;
}

/**
 * Открыть окно боя на данных игры: бой запоминается как текущий на странице и становится боем открытого окна. Бой живёт, пока
 * окно (или список участников) открыто: после закрытия остаются только данные профиля.
 */
export function showBattle(entered: CurrentBattle) {
	const context = getInvitesContext();
	if (!context) return;
	patchInvitesContext({ current: entered });
	openModal('battle', {}, 'battle');
	startBattle(context.bot, entered.battle, entered.fighter, entered.me, context.players);
}

/** Открыть бой, в котором персонаж сейчас: данные берутся из профиля, а не из памяти. Боя уже нет — страница обновляется. */
export async function openCurrentBattle() {
	const context = getInvitesContext();
	if (!context) return;
	const profile = await getGame(context.bot.server, {}, context.bot.auth, 1, false, PRIORITY.action);
	if (!profile?.u) return void notify({ text: 'Не удалось получить данные боя', icon: 'error' });
	const active = battleFromProfile(profile);
	if (!active) {
		patchInvitesContext({ current: null });
		requestInvitesRefresh();
		return void notify({ text: 'Бой уже закончился', icon: 'error' });
	}
	showBattle(active);
}

// Бой окна не хранится после закрытия окна боя и списка участников: дальше работают только данные игры
subscribeModals(() => {
	if (getBattleSession() && !getModalStack().some((entry) => entry.id === 'battle' || entry.id === 'participants')) setBattleSession(null);
});
