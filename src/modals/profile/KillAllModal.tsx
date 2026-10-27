import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon56UsersOutline } from '@vkontakte/icons';
import { PRIORITY } from '../../api/http';
import { notify } from '../../app/notify';
import { BotLog, FooterButton, useBotLog } from '../../components/profile/BotBlocks';
import { Placeholder } from '../../components/profile/Placeholder';
import { Skeleton } from '../../components/Skeleton';
import { NavCell } from '../../components/wiki/NavCell';
import { numberForm, numberSpaces } from '../../lib/format';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { createFightUnchecked, fetchBoss, type FightInfo, type Player } from '../../profile/invites/accept';
import { clearAttempts } from '../../profile/invites/attempts';
import { getInvitesContext, markBattleFinished, patchInvitesContext, refreshPlayer, requestInvitesRefresh, useInvitesContext } from '../../profile/invites/battleStore';
import { useBosses } from '../../profile/invites/bosses';
import { useBossLists } from '../../profile/invites/favorites';
import { killPlan, killStrikes, strikeBoss, type KillEntry } from '../../profile/invites/killAll';
import { useKillAllowed } from '../../profile/invites/killAccess';
import { joinRewards, parseReward, type RawReward } from '../../profile/bots/reward';
import { backModal } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import { Stat, partStyles as styles } from './BattleParts';
import killStyles from './KillAllModal.module.css';

/** Что известно о персонаже и попытках боссов на момент последнего обновления. */
interface Snapshot {
	player: Player;
	attempts: ReadonlyMap<number, FightInfo | null>;
}

/** Иконка итога прохода. */
const SUMMARY_ICON = 'bot/raids/9.png';

/**
 * Окно «Список боя»: избранные боссы, которых персонаж может убить один (с Kill — любых) и на которых хватает энергии, и бот,
 * который их убивает: «Убить» — одну попытку, «Убить всех» — весь список, каждого босса до лимита. Список обновляется при открытии,
 * по кнопке и после каждого убийства (молча, без записи в лог), чтобы не убить лишнего. Ничего не хранится: закрыли — при следующем
 * открытии всё считается заново. Пока бот работает, закрытие окна и вкладки требует подтверждения.
 */
export function KillAllModal({ open }: { open: boolean }) {
	const context = useInvitesContext();
	const bosses = useBosses(open);
	const bot = context?.bot;
	const lists = useBossLists(bot);
	const unlimited = useKillAllowed();
	const log = useBotLog();
	const [data, setData] = useState<Snapshot | null>(null);
	const [killed, setKilled] = useState<ReadonlyMap<number, number>>(new Map());
	const [running, setRunning] = useState<'one' | 'all' | null>(null);
	const [active, setActive] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	/** Остановку попросили: бот дорабатывает текущего босса, повторно нажать нельзя */
	const [stopping, setStopping] = useState(false);

	// То, что нужно ходу бота по ходу работы: он читает свежие значения, а не те, что были при его запуске
	const live = useRef({ data: null as Snapshot | null, killed: new Map<number, number>(), favorites: lists.favorites, bosses, unlimited, bot });
	useEffect(() => {
		Object.assign(live.current, { favorites: lists.favorites, bosses, unlimited, bot });
	});
	/** Номер открытия окна: работа прежнего открытия (запросы, запись в лог) в новое не попадает */
	const session = useRef(0);
	const stop = useRef(false);
	/** Проход идёт (в отличие от `running` меняется сразу, без ожидания перерисовки) */
	const working = useRef(false);

	const entries = useMemo(
		() => (data && bosses && context ? killPlan({ favorites: lists.favorites, bosses, npcs: context.npcs, player: data.player, attempts: data.attempts, killed, unlimited }) : []),
		[data, bosses, context, lists.favorites, killed, unlimited],
	);
	const fights = entries.reduce((sum, entry) => sum + entry.left, 0);
	const energy = entries.reduce((sum, entry) => sum + entry.left * entry.boss.energy, 0);

	/** Список прямо сейчас (из свежих значений). */
	const planNow = (): KillEntry[] => {
		const l = live.current;
		const npcs = getInvitesContext()?.npcs;
		return l.data && l.bosses && npcs
			? killPlan({ favorites: l.favorites, bosses: l.bosses, npcs, player: l.data.player, attempts: l.data.attempts, killed: l.killed, unlimited: l.unlimited })
			: [];
	};

	const setSnapshot = (next: Snapshot) => {
		live.current.data = next;
		setData(next);
	};

	/** Персонаж (энергия, бой, район) и попытки: всех избранных или одного `only`. Молча, без записи в лог. false — обновить не удалось. */
	const fetchSnapshot = async (mine: number, only?: number): Promise<Snapshot | null> => {
		const l = live.current;
		if (!l.bot) return null;
		const player = await refreshPlayer(l.bot, PRIORITY.window);
		if (mine !== session.current || !player) return null;
		const npcs = getInvitesContext()?.npcs;
		const ids = only === undefined ? l.favorites : [only];
		const infos = await Promise.all(ids.map((id) => (npcs?.get(id) && l.bot ? fetchBoss(l.bot, npcs.get(id)!, PRIORITY.window) : Promise.resolve(null))));
		if (mine !== session.current) return null;
		const attempts = new Map(only === undefined ? [] : l.data?.attempts);
		ids.forEach((id, index) => attempts.set(id, infos[index] ?? null));
		return { player, attempts };
	};

	/** Обновить и показать. false — обновить не удалось. */
	const refresh = async (mine: number, only?: number) => {
		const snapshot = await fetchSnapshot(mine, only);
		if (snapshot) setSnapshot(snapshot);
		return !!snapshot;
	};

	// Каждое открытие — как первый вход: ничего не помнится
	useEffect(() => {
		if (!open) return;
		const mine = ++session.current;
		stop.current = false;
		live.current.data = null;
		live.current.killed = new Map();
		setData(null);
		setKilled(new Map());
		setRunning(null);
		setStopping(false);
		setActive(null);
		log.clear();
		setLoading(true);
		void refresh(mine).then((ok) => {
			if (mine !== session.current) return;
			setLoading(false);
			if (!ok) notify({ text: 'Не удалось получить данные персонажа', icon: 'error' });
		});
		return () => {
			// Окно закрыто: работа этого открытия дальше ничего не пишет
			session.current++;
		};
	}, [open]);

	// Пока бот работает, закрытие окна и вкладки просят подтверждения; согласие закрыть окно останавливает бота (он дорабатывает текущего босса)
	useLeaveGuard(open && !!running, 'killAll', () => {
		stop.current = true;
	});

	/** Одно убийство: бой, удары одним запросом, учёт. null — не вышло (причина в логе), бот останавливается. */
	const killOnce = async (mine: number, entry: KillEntry): Promise<{ reward: RawReward | null } | null> => {
		const l = live.current;
		const { boss, npc } = entry;
		const say = (action: () => void) => mine === session.current && action();
		const fail = async (message: string) => {
			say(() => log.text(message, 'red'));
			// Бой мог остаться открытым: профиль покажет его как текущий
			await refresh(mine, boss.id);
			return null;
		};
		if (!l.bot || !l.data) return null;
		const battle = await createFightUnchecked(l.bot, npc);
		if (!battle) return fail(`Не удалось создать бой: ${boss.name}`);
		const strikes = killStrikes(battle, l.data.player.fighter);
		if (!strikes.killed) return fail(`Босса «${boss.name}» не убить: бой создан, закончите его вручную`);
		const result = await strikeBoss(l.bot, strikes);
		if (!result?.battle.won) return fail(`Босс «${boss.name}» не убит: сервер не принял удары, бой остался открытым`);
		markBattleFinished(result.battle.fightId);
		patchInvitesContext({ current: null });
		clearAttempts();
		const count = (l.killed.get(boss.id) ?? 0) + 1;
		// Данные обновляются сразу после убийства: энергия и попытки изменились
		const before = l.data;
		// Обновить не вышло (нет ответа): считаем сами, что энергия и попытка потрачены, чтобы не убить лишнего по старым данным
		const fresh: Snapshot = (await fetchSnapshot(mine, boss.id)) ?? {
			player: { ...before.player, energy: before.player.energy - boss.energy },
			attempts: new Map(before.attempts).set(
				boss.id,
				before.attempts.get(boss.id) ? { ...before.attempts.get(boss.id)!, left: Math.max(0, before.attempts.get(boss.id)!.left - 1) } : null,
			),
		};
		l.killed = new Map(l.killed).set(boss.id, count);
		l.data = fresh;
		const left = planNow().find((item) => item.boss.id === boss.id)?.left ?? 0;
		const total = count + left;
		// Всё, что изменилось, показывается одной перерисовкой окна: оно работает долго и не должно подвисать
		say(() => {
			setKilled(l.killed);
			setData(fresh);
			log.message(boss.icon, boss.name, parseReward(result.reward), `Убит ${count} из ${total}`);
		});
		return { reward: result.reward };
	};

	/** Проход: одно убийство (`one`) или весь список, каждый босс до лимита (`all`). */
	const run = async (mode: 'one' | 'all') => {
		const mine = session.current;
		// Второе нажатие, пока прежнее ещё не успело перерисовать кнопки, ничего не запускает
		if (!live.current.bot || running || working.current) return;
		if (getInvitesContext()?.current) return log.text('Закончите текущий бой, чтобы убивать боссов', 'red');
		working.current = true;
		stop.current = false;
		setRunning(mode);
		const sum = { kills: 0, energy: 0, rewards: [] as RawReward[] };
		try {
			while (!stop.current && mine === session.current) {
				const next = planNow().find((entry) => entry.left > 0);
				if (!next) break;
				setActive(next.boss.id);
				const done = await killOnce(mine, next);
				if (!done) break;
				sum.kills++;
				sum.energy += next.boss.energy;
				if (done.reward) sum.rewards.push(done.reward);
				if (mode === 'one') break;
			}
		} catch {
			if (mine === session.current) log.text('Ошибка во время убийства, проход остановлен', 'red');
		} finally {
			working.current = false;
			if (mine === session.current) {
				setRunning(null);
				setStopping(false);
				setActive(null);
				requestInvitesRefresh();
				if (mode === 'all' && sum.kills > 0) {
					const text = `Убито ${sum.kills} ${numberForm(sum.kills, ['босс', 'босса', 'боссов'])}, потрачено ${numberSpaces(sum.energy)} энергии`;
					log.message(SUMMARY_ICON, 'Итог', parseReward(joinRewards(sum.rewards)), text);
					notify({ text, icon: 'done' });
				}
			}
		}
	};

	const halt = () => {
		if (stop.current) return;
		stop.current = true;
		setStopping(true);
		log.text('Остановка после текущего убийства', 'blue');
	};

	const reload = () => {
		const mine = session.current;
		setLoading(true);
		void refresh(mine).then((ok) => {
			if (mine !== session.current) return;
			setLoading(false);
			if (!ok) return notify({ text: 'Не удалось обновить данные', icon: 'error' });
			// Убитые до лимита боссы (серые) из списка уходят; остальные помнят, сколько уже убито
			const l = live.current;
			const alive = new Set(
				planNow()
					.filter((entry) => entry.left > 0)
					.map((entry) => entry.boss.id),
			);
			l.killed = new Map([...l.killed].filter(([id]) => alive.has(id)));
			setKilled(l.killed);
			log.text('Данные обновлены');
		});
	};

	// Кнопки и список не перерисовываются, пока их данные не изменились: обработчики стабильны
	const actions = useRef({ reload, run, halt });
	useEffect(() => {
		actions.current = { reload, run, halt };
	});
	const onReload = useCallback(() => actions.current.reload(), []);
	const onRun = useCallback((mode: 'one' | 'all') => void actions.current.run(mode), []);
	const onHalt = useCallback(() => actions.current.halt(), []);
	const footer = (
		<div className={styles.footerBody}>
			<div className={killStyles.logBox}>
				<MemoLog entries={log.entries} compact onClear={log.clear} />
			</div>
			<Actions loading={loading} running={running} stopping={stopping} canKill={fights > 0} onReload={onReload} onRun={onRun} onHalt={onHalt} />
		</div>
	);

	return (
		<ClassicModal id="killAll" open={open} onClose={backModal} title="Список боя" footer={footer} top={<Cards ready={!!data} fights={fights} energy={energy} />} topHeight={82}>
			<div className={killStyles.listBody}>
				{data === null || !bosses ? (
					<section>
						{Array.from({ length: 4 }, (_, index) => (
							<div key={index} className={killStyles.skeletonRow}>
								<Skeleton height={48} borderRadius={10} />
							</div>
						))}
					</section>
				) : entries.length ? (
					<section>
						{entries.map((entry) => (
							<KillRow key={entry.boss.id} entry={entry} active={active === entry.boss.id} />
						))}
					</section>
				) : (
					<Placeholder icon={<Icon56UsersOutline />} title="Некого убивать">
						Добавьте боссов в избранное: в список попадают те, кого вы убьёте один и на кого хватает энергии
					</Placeholder>
				)}
			</div>
		</ClassicModal>
	);
}

const MemoLog = memo(BotLog);

/** Две карточки: сколько боёв и сколько энергии уйдёт. */
const Cards = memo(function Cards({ ready, fights, energy }: { ready: boolean; fights: number; energy: number }) {
	return (
		<div className={killStyles.cards}>
			<div className={styles.pair}>
				<Stat label={numberForm(fights, ['бой', 'боя', 'боёв'])} value={ready ? numberSpaces(fights) : '…'} />
				<Stat label="энергии" value={ready ? numberSpaces(energy) : '…'} />
			</div>
		</div>
	);
});

/** Строка босса: перерисовывается только когда изменилось число боёв или подсветка. */
const KillRow = memo(
	function KillRow({ entry, active }: { entry: KillEntry; active: boolean }) {
		return (
			<NavCell
				className={`${killStyles.row} ${active ? killStyles.active : ''} ${entry.left === 0 ? killStyles.done : ''}`}
				chevron={false}
				image={entry.boss.icon}
				title={entry.boss.name}
				subtitle={<span className={styles.oneLine}>{entry.boss.description}</span>}
				count={`${entry.left} за ${entry.left * entry.boss.energy}`}
			/>
		);
	},
	(before, after) => before.active === after.active && before.entry.boss.id === after.entry.boss.id && before.entry.left === after.entry.left,
);

/** Кнопки окна. */
const Actions = memo(function Actions({
	loading,
	running,
	stopping,
	canKill,
	onReload,
	onRun,
	onHalt,
}: {
	loading: boolean;
	running: 'one' | 'all' | null;
	stopping: boolean;
	canKill: boolean;
	onReload: () => void;
	onRun: (mode: 'one' | 'all') => void;
	onHalt: () => void;
}) {
	const idle = loading || !!running;
	return (
		<>
			<FooterButton stretched mode="secondary" loading={loading} disabled={idle} onClick={onReload}>
				Обновить
			</FooterButton>
			<div className={killStyles.pair}>
				<FooterButton stretched mode="commerce" loading={running === 'one'} disabled={idle || !canKill} onClick={() => onRun('one')}>
					Убить
				</FooterButton>
				<FooterButton stretched mode="commerce" loading={running === 'all'} disabled={idle || !canKill} onClick={() => onRun('all')}>
					Убить всех
				</FooterButton>
			</div>
			<FooterButton stretched mode="destructive" loading={stopping} disabled={!running || stopping} onClick={onHalt}>
				Остановить
			</FooterButton>
		</>
	);
});
