import { useEffect, useMemo, useRef, useState } from 'react';
import { CustomSelect, CustomSelectOption, FormField, Switch, UnstyledTextField } from '@vkontakte/vkui';
import { notify } from '../../app/notify';
import { BotLog, FooterButton, Thumb, useBotLog } from '../../components/profile/BotBlocks';
import { Divider } from '../../components/Divider';
import { getTime, numberSpaces } from '../../lib/format';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { callFriends } from '../../profile/invites/accept';
import { BATTLE_SECONDS, SKILLS, canKillAlone, roundsToKill, simulate, solveKill, survivableRounds, type Battle, type Setup } from '../../profile/invites/battle';
import { endIfFinished, syncBattle, useBattleSync } from '../../profile/invites/battleFlow';
import { playRound, runRound, useBattleSession, useInvitesContext, type BattleSession } from '../../profile/invites/battleStore';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, settingsKey, type BattleSettings, type Limit } from '../../profile/invites/settings';
import { useBosses } from '../../profile/invites/bosses';
import { useKillAllowed } from '../../profile/invites/killAccess';
import { backModal, openModal } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import { Bar, BossCell, partStyles as styles } from './BattleParts';
import { MAX_PLAYERS } from './InviteModal';

const HITS = [1, 3, 9] as const;

const limitOf = (limit: Limit, owned: number) => (limit.on ? Math.min(owned, Math.max(0, Math.floor(Number(limit.max)) || 0)) : 0);

/** Расходник: поле предела расхода (иконка слева, справа сколько есть в наличии и переключатель «использовать»). */
function Supply({
	image,
	title,
	owned,
	limit,
	onChange,
	disabled,
}: {
	image: string;
	title: string;
	owned: number;
	limit: Limit;
	onChange: (limit: Limit) => void;
	disabled: boolean;
}) {
	const blocked = disabled || owned === 0;
	const input = useRef<HTMLInputElement>(null);
	// Включили расходник — курсор сразу в поле предела, чтобы вписать число
	const toggle = () => {
		onChange({ on: !limit.on, max: limit.max || String(owned) });
		if (!limit.on) window.setTimeout(() => input.current?.focus(), 0);
	};
	return (
		<FormField
			before={<Thumb src={image} size={28} />}
			after={
				<span className={styles.supplyAfter}>
					<span className={styles.supplyOwned}>В наличии {numberSpaces(owned)}</span>
					<Switch className={styles.switchSmall} checked={limit.on} disabled={blocked} aria-label={title} onChange={toggle} />
				</span>
			}
		>
			<UnstyledTextField
				as="input"
				getRootRef={input}
				className={styles.limitField}
				type="number"
				min={0}
				max={owned}
				value={limit.on ? limit.max : ''}
				placeholder={title}
				aria-label={`${title}: сколько использовать`}
				disabled={blocked || !limit.on}
				onChange={(event) => onChange({ ...limit, max: event.target.value })}
			/>
		</FormField>
	);
}

/**
 * Полоска «Время боя». Время боя всегда 2 часа: живой таймер от последнего ответа сервера; на нуле бой проверяется (и заканчивается
 * поражением). Секундомер живёт здесь, чтобы раз в секунду перерисовывалась только полоска, а не всё окно.
 */
function TimeBar({ open, battle }: { open: boolean; battle: Battle }) {
	const [now, setNow] = useState(() => Date.now());
	const left = Math.max(0, Math.round(BATTLE_SECONDS - battle.elapsed - Math.max(0, now - battle.receivedAt) / 1000));
	const lastCheck = useRef(0);
	useEffect(() => {
		if (!open) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [open]);
	useEffect(() => {
		if (!open || left !== 0 || now - lastCheck.current < 3000) return;
		lastCheck.current = now;
		void syncBattle();
	}, [open, left, now]);
	return <Bar label="Время боя" value={getTime(left)} percent={(left / BATTLE_SECONDS) * 100} />;
}

/** Значки навыков (talent_1…3 в картинках персонажа). */
const SKILL_ICON = { 1: 'character/talent_1.png', 2: 'character/talent_2.png', 3: 'character/talent_3.png' } as const;

/**
 * Окно текущего боя: босс, здоровье, участники, выбор навыка, свитков и зелий, подбор настроек для убийства. Лог и кнопки
 * ударов (×1, ×3, ×9, Max) закреплены внизу окна. Пока окно открыто, бой обновляется пустыми раундами; победа над боссом
 * или конец времени боя открывают итоги.
 */
function BattleView({ open, session }: { open: boolean; session: BattleSession }) {
	const bosses = useBosses(open);
	const me = useInvitesContext()?.player;
	const log = useBotLog();
	const { text: logText } = log;
	const [settings, setSettings] = useState<BattleSettings>(DEFAULT_SETTINGS);
	const { skill, fire, lightning, potions } = settings;
	const setSkill = (value: Setup['skill']) => setSettings((current) => ({ ...current, skill: value }));
	const setFire = (value: Limit) => setSettings((current) => ({ ...current, fire: value }));
	const setLightning = (value: Limit) => setSettings((current) => ({ ...current, lightning: value }));
	const setPotions = (value: Limit) => setSettings((current) => ({ ...current, potions: value }));
	const [busy, setBusy] = useState(false);
	const [calling, setCalling] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [note, setNote] = useState<{ text: string; danger: boolean } | null>(null);
	// Удары и приглашение друзей идут запросами к игре: пока они идут, закрытие окна и вкладки просят подтверждения
	useLeaveGuard(busy || calling, 'battle');
	useBattleSync(open);

	// Навык и расходники помнятся для каждого профиля и босса: читаются при входе в бой, сохраняются при изменении
	const key = settingsKey(session.bot, session.battle.npc);
	// В `stored` — то, что уже лежит в хранилище: прочитанное при открытии не записывается обратно (лишний запрос в VK)
	const stored = useRef<string | null>(null);
	useEffect(() => {
		let alive = true;
		void loadSettings(key).then((saved) => {
			if (!alive) return;
			stored.current = JSON.stringify(saved);
			setSettings(saved);
		});
		return () => {
			alive = false;
		};
	}, [key]);
	useEffect(() => {
		if (stored.current === null || stored.current === JSON.stringify(settings)) return;
		const timer = window.setTimeout(() => {
			stored.current = JSON.stringify(settings);
			void saveSettings(key, settings);
		}, 400);
		return () => window.clearTimeout(timer);
	}, [key, settings]);

	const setup: Setup = useMemo(
		() => ({
			skill: skill && session.fighter.skills[skill] > 0 ? (skill as Setup['skill']) : (0 as const),
			fire: limitOf(fire, session.fighter.fire),
			lightning: limitOf(lightning, session.fighter.lightning),
			potions: limitOf(potions, session.fighter.potions),
		}),
		[session, skill, fire, lightning, potions],
	);
	// Max — столько ударов, сколько персонаж выдержит (с включёнными зельями), но не больше нужного для убийства, и всегда хотя бы один
	// (даже если этот удар убьёт персонажа); Kill — все удары до смерти босса. У погибшего персонажа сервер удары не принимает
	// (ошибка 1012), поэтому все кнопки ударов заблокированы. Сколько ударов убивает босса, считается один раз на оба расчёта
	const killRounds = useMemo(() => roundsToKill(session.battle, session.fighter, setup), [session, setup]);
	const maxRounds = useMemo(() => survivableRounds(session.battle, session.fighter, setup, killRounds), [session, setup, killRounds]);
	const full = useMemo(() => simulate(session.battle, session.fighter, setup, killRounds), [session, setup, killRounds]);
	const killAllowed = useKillAllowed();

	const { battle, fighter } = session;
	const boss = bosses?.get(battle.npc) ?? null;
	const learned = SKILLS.filter((item) => fighter.skills[item.id] > 0);
	// Метка SOLO: по полному здоровью босса и полному здоровью персонажа, как в начале боя (без свитков и зелий, с навыками)
	const alone = boss && me ? canKillAlone({ hp: battle.maxHp, dmg: battle.bossDmg }, fighter, me.maxHp) : null;
	// Погибший персонаж ударов не наносит (бой общий, обновляется и дальше)
	const dead = battle.lost;
	// Здоровье персонажа в начале боя (из профиля на странице приглашений); лечение зельями выше него не поднимает
	const maxHp = Math.max(me?.maxHp ?? 0, battle.myHp);
	// Гибель персонажа записывается в лог один раз; если окно открыто на уже погибшем персонаже, запись не нужна
	const wasDead = useRef(dead);
	useEffect(() => {
		if (dead && !wasDead.current) logText('Персонаж убит', 'red');
		wasDead.current = dead;
	}, [dead, logText]);
	// Звать на помощь можно только в общем бое (у одиночных боссов тип 1)
	const shared = boss?.type === 0;

	const attack = async (rounds: number) => {
		const plan = simulate(battle, fighter, setup, rounds);
		if (!plan.rounds && !plan.skillHits) return;
		setBusy(true);
		const result = await runRound(() => playRound(plan));
		setBusy(false);
		if (!result.ok) {
			log.text(result.message, 'red');
			notify({ text: result.message, icon: 'error' });
			return;
		}
		// Наш удар — с аватаркой и ником персонажа, ответ босса — с его иконкой и названием
		const { me: player } = session;
		log.message(
			player.avatar ? `bot/arena/avatar_${player.avatar}.png` : (boss?.icon ?? 'bosses/icons/0.png'),
			player.name || `Player${player.id}`,
			`Нанес ${numberSpaces(plan.dealt)} урона`,
		);
		if (plan.taken > 0) log.message(boss?.icon ?? 'bosses/icons/0.png', boss?.name ?? `Босс №${battle.npc}`, `Нанес ${numberSpaces(plan.taken)} урона`);
		endIfFinished(result);
	};

	const solve = () => {
		const solution = solveKill(battle, fighter);
		const { setup: picked, plan } = solution;
		setSkill(picked.skill);
		setFire({ on: plan.fire > 0, max: String(plan.fire || '') });
		setLightning({ on: plan.lightning > 0, max: String(plan.lightning || '') });
		setPotions({ on: plan.potions > 0, max: String(plan.potions || '') });
		setNote(solution.feasible ? null : { text: 'Убить босса не получится: не хватит здоровья даже со всем запасом', danger: true });
		if (solution.feasible) log.text('Настройки для убийства рассчитаны', 'green');
		else log.text('Убить босса не получится: не хватит здоровья даже со всем запасом', 'red');
	};

	const call = async () => {
		setCalling(true);
		const sent = await callFriends(session.bot);
		setCalling(false);
		log.text(sent ? 'Приглашение отправлено друзьям' : 'Не удалось позвать друзей', sent ? 'green' : 'red');
		notify(sent ? { text: 'Приглашение отправлено друзьям', icon: 'done' } : { text: 'Не удалось позвать друзей', icon: 'error' });
	};

	/** Обновить бой вручную: пустой раунд, как при автоматическом обновлении. */
	const refresh = async () => {
		setRefreshing(true);
		const result = await runRound(() => playRound());
		setRefreshing(false);
		if (!result.ok) {
			log.text(result.message, 'red');
			return notify({ text: result.message, icon: 'error' });
		}
		if (!endIfFinished(result)) log.text('Данные обновлены');
	};

	const footer = (
		<div className={styles.footerBody}>
			<div className={`${styles.logBox} ${shared ? styles.logBoxShort : ''}`}>
				<BotLog entries={log.entries} compact onClear={log.clear} />
			</div>
			{note && <div className={`${styles.hint} ${note.danger ? styles.danger : ''}`}>{note.text}</div>}
			{shared && (
				<FooterButton stretched mode="secondary" loading={calling} disabled={calling} onClick={() => void call()}>
					Позвать друзей
				</FooterButton>
			)}
			<div className={styles.pairButtons}>
				<FooterButton stretched mode="secondary" disabled={busy} onClick={solve}>
					Рассчитать убийство
				</FooterButton>
				<FooterButton stretched mode="secondary" loading={refreshing} disabled={busy || refreshing} onClick={() => void refresh()}>
					Обновить
				</FooterButton>
			</div>
			<div className={`${styles.hits} ${killAllowed ? styles.hitsKill : ''}`}>
				{HITS.map((count) => (
					<FooterButton key={count} className={styles.hitButton} stretched mode="primary" disabled={busy || dead} onClick={() => void attack(count)}>
						×{count}
					</FooterButton>
				))}
				<FooterButton className={styles.hitButton} stretched mode="primary" disabled={busy || dead} onClick={() => void attack(Math.max(1, maxRounds))}>
					Max
				</FooterButton>
				{killAllowed && (
					// Kill бьёт до смерти босса, не глядя на здоровье персонажа (пока он жив)
					<FooterButton className={styles.hitButton} stretched mode="primary" disabled={busy || dead || !(full.rounds || full.skillHits)} onClick={() => void attack(killRounds)}>
						Kill
					</FooterButton>
				)}
			</div>
		</div>
	);

	return (
		<ClassicModal id="battle" open={open} onClose={backModal} title="Бой" footer={footer}>
			<div className={styles.body}>
				<section className={styles.section}>
					<BossCell boss={boss} title={boss?.name ?? `Босс №${battle.npc}`} solo={alone === true} />
				</section>

				<section className={styles.section}>
					<Bar label="Здоровье босса" value={`${numberSpaces(Math.max(battle.hp, 0))} из ${numberSpaces(battle.maxHp)}`} percent={(Math.max(battle.hp, 0) / battle.maxHp) * 100} />
					<Bar
						label="Игроков в бою"
						value={`${battle.participants.length} из ${MAX_PLAYERS}`}
						percent={(battle.participants.length / MAX_PLAYERS) * 100}
						onClick={() => openModal('participants', {}, 'participants')}
					/>
					<TimeBar open={open} battle={battle} />
					{maxHp > 0 && (
						<Bar label="Здоровье персонажа" value={`${numberSpaces(Math.max(battle.myHp, 0))} из ${numberSpaces(maxHp)}`} percent={(Math.max(battle.myHp, 0) / maxHp) * 100} />
					)}
				</section>

				<Divider className={styles.divider} />

				<section className={`${styles.section} ${styles.list}`}>
					<CustomSelect
						value={setup.skill}
						before={setup.skill ? <Thumb src={SKILL_ICON[setup.skill]} size={28} /> : undefined}
						options={[{ value: 0, label: 'Без навыка', description: '' }, ...learned.map((item) => ({ value: item.id, label: item.name, description: item.description }))]}
						renderOption={({ option, ...rest }) => (
							<CustomSelectOption {...rest} before={option.value ? <Thumb src={SKILL_ICON[option.value as 1 | 2 | 3]} size={28} /> : undefined}>
								<span className={styles.skillOption}>{option.label}</span>
							</CustomSelectOption>
						)}
						onChange={(event) => setSkill(Number(event.target.value) as Setup['skill'])}
					/>
					<Supply image="bot/raids/16.png" title="Свитки огня" owned={fighter.fire} limit={fire} onChange={setFire} disabled={busy} />
					<Supply image="bot/raids/17.png" title="Свитки молнии" owned={fighter.lightning} limit={lightning} onChange={setLightning} disabled={busy} />
					<Supply image="character/talent_4.png" title="Зелья лечения" owned={fighter.potions} limit={potions} onChange={setPotions} disabled={busy} />
				</section>
			</div>
		</ClassicModal>
	);
}

/** Окно текущего боя. Каждый новый бой — свежее содержимое (свой лог, настройки и подсказки). */
export function BattleModal({ open }: { open: boolean }) {
	const session = useBattleSession();
	// Бой убирается из памяти, как только окно закрывается: пока оно уезжает, держим последнее состояние, чтобы содержимое не исчезло посреди анимации
	const [shown, setShown] = useState(session);
	if (session && session !== shown) setShown(session);
	const current = session ?? (open ? null : shown);
	// Окно закрылось насовсем: последнее состояние (и подписки вместе с ним) освобождается после анимации
	useEffect(() => {
		if (open || session) return;
		const timer = window.setTimeout(() => setShown(null), 600);
		return () => window.clearTimeout(timer);
	}, [open, session]);
	// Каждое открытие боя — свежее содержимое (свой лог, настройки и подсказки)
	return current ? <BattleView key={`${current.battle.fightId}:${current.opened}`} open={open} session={current} /> : null;
}
