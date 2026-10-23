import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Checkbox, HorizontalScroll, Input, PullToRefresh } from '@vkontakte/vkui';
import { Icon24ExternalLinkOutline } from '@vkontakte/icons';
import { getGame, type GameAuth } from '../../../api/game';
import type { GuildResponse, ProfileResponse } from '../../../api/gameTypes';
import { notify } from '../../../app/notify';
import { useIsDesktop } from '../../../app/layout';
import { Button } from '../../../components/form/Form';
import { BotFooter, useBotLog } from '../../../components/profile/BotBlocks';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../../config';
import { getTime, numberSpaces } from '../../../lib/format';
import { errorText } from '../../../profile/bots/common';
import { currentProfile, getSession, openSettings } from '../../../profile/session';
import { openPanel } from '../../../store/nav';
import { RESOURCES, CardKey, Times, BotProfile, waiting, INITIAL_TIMES, Mode } from './resourcesData';
import { RESOURCE_ACTIONS, applyProfile, resetEnergyLinks, type ResourceContext } from './resourcesActions';
import styles from './ResourcesBotPanel.module.css';
import { Photo } from '../../../components/Photo';

/** Карточка действия: заголовок, таймер, описание и кнопки; недоступная — полупрозрачная с подсказкой поверх. */
function ActionCard({
	title,
	after,
	disabled,
	hint,
	children,
	bottom,
	extra,
}: {
	title: string;
	after?: ReactNode;
	disabled: boolean;
	hint: string | null;
	children: ReactNode;
	bottom: ReactNode;
	extra?: ReactNode;
}) {
	return (
		<div className={`${styles.card} ${disabled ? styles.cardDisabled : ''}`}>
			{disabled && <div className={styles.hint}>{hint || 'Недоступно'}</div>}
			<div className={styles.cardIn}>
				<div className={styles.head}>
					<div className={styles.headTitle}>{title}</div>
					{after !== undefined && <div className={styles.headAfter}>{after}</div>}
				</div>
				<div className={styles.body}>{children}</div>
				<div className={styles.bottom}>{bottom}</div>
				{extra && (
					<>
						<div className={styles.cardSeparator} />
						<div className={`${styles.bottom} ${styles.bottomExtra}`}>{extra}</div>
					</>
				)}
			</div>
		</div>
	);
}

/** 9. Ресурсы: сбор наград с карты, сундуков, питомца, лотереи, гильдии и т. д. — по отдельности или всё сразу. */
export function ResourcesBotPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const log = useBotLog();
	const { text: logText, message: logMessage } = log;
	const [loading, setLoading] = useState(false);
	const [synced, setSynced] = useState(false);
	const [, setTick] = useState(0);
	const st = useRef({
		mounted: true,
		times: { ...INITIAL_TIMES } as Times,
		hints: {} as Partial<Record<CardKey, string | null>>,
		counts: {} as Record<string, number>,
		profiles: [] as BotProfile[],
		guildReward: false,
		wars: { start: null as number | null, end: null as number | null },
	});
	const rerender = () => setTick((value) => value + 1);

	const mainProfile = (): BotProfile => {
		const profile = currentProfile();
		return { main: true, login: profile?.login || profile?.id || getSession().user?.id || '', auth: profile?.auth, server: profile?.server ?? 1 };
	};

	const run = useCallback(
		async (mode: Mode = '', action = '', needReload = true, profile: BotProfile = mainProfile()): Promise<void> => {
			const s = st.current;
			const alive = () => s.mounted;
			setLoading(true);

			if (!profile.auth) {
				if (profile.main) {
					openSettings({ text: 'Для продолжения работы необходимо указать пароль авторизации' });
					openPanel(null);
				} else {
					logText(`На аккаунте ${profile.login} не указан пароль авторизации`);
					setLoading(false);
				}
				return;
			}
			const server = profile.server;
			const auth: GameAuth = { login: profile.login, password: profile.auth };
			const game = (body: Record<string, string | number>) => getGame(server, body, auth);

			const dataProfile: ProfileResponse | null = await getGame(server, {}, auth);
			if (!alive()) return;
			auth.id = dataProfile?.u?._id || profile.login;
			let guild: GuildResponse | null = {};
			if (Number(dataProfile?.u?._clan_id) !== 0) {
				const data = await game({ i: 49, t1: dataProfile?.u?._clan_id || 0 });
				guild = data?.clan ?? null;
			}
			if (!alive()) return;
			if (!dataProfile?.u || guild === null) {
				if (profile.main) {
					notify({ text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error' });
					openSettings({ text: 'Пароль авторизации игры неисправен, введите новый', error: errorText(dataProfile) });
					openPanel(null);
				} else {
					logText(`Пароль авторизации игры неисправен на аккаунте ${profile.login}`);
					setLoading(false);
				}
				return;
			}
			setSynced(true);

			// Остальные профили для «Собрать со всех»: основной — последним
			const others: BotProfile[] = getSession()
				.profiles.filter((slot) => slot.id)
				.map((slot) => ({ main: false, login: slot.login || slot.id || '', auth: slot.auth, server: slot.server ?? 1 }));
			others.push(others.shift()!);
			s.profiles = others.filter(Boolean);

			const user = dataProfile.u;
			const { times, hints } = s;
			const { builds, chests } = applyProfile(s, { ...dataProfile, u: user }, guild);
			rerender();

			const reload = () => (alive() && needReload ? run('', '', true, profile) : undefined);

			const handler = RESOURCE_ACTIONS[`${mode}:${action}`];
			const context: ResourceContext = { game, dataProfile, user, builds, chests, times, hints, state: s, profile, server, needReload, logText, logMessage };
			if (handler && (!handler.when || handler.when(context))) {
				await handler.run(context);
				await reload();
			}
			if (mode === 'all') {
				const steps: [Mode, string][] = [
					['map', 'collect'],
					['chest', 'collect'],
					['chest', 'open'],
					['pet', 'collect'],
					['pet', 'send'],
					['lottery', 'collect'],
					['search', 'collect'],
					['energy', 'collect'],
					['daily', 'collect'],
					['vip', 'collect'],
					['guildBuild', 'collect'],
					['guildReward', 'collect'],
					['guildWars', 'collect'],
				];
				for (const [stepMode, stepAction] of steps) if (alive()) await run(stepMode, stepAction, false, profile);
			}
			if (mode === 'all-in-all') {
				for (const other of s.profiles) {
					if (!alive()) break;
					await run('all', '', true, other);
					logText(`все ресурсы собраны на аккаунте ${other.login}`);
				}
			}
			if (alive()) {
				rerender();
				setLoading(false);
			}
		},
		[logText, logMessage],
	);

	useEffect(() => {
		const s = st.current;
		s.mounted = true;
		void run();
		// Таймеры карточек идут каждую секунду
		const timer = setInterval(() => {
			const { times } = s;
			let changed = false;
			for (const key of ['chest', 'pet', 'lottery', 'guildBuilds'] as const) {
				if (typeof times[key] === 'number' && times[key] > 0) {
					times[key] -= 1;
					changed = true;
				}
			}
			if (changed) setTick((value) => value + 1);
		}, 1000);
		return () => {
			s.mounted = false;
			resetEnergyLinks();
			clearInterval(timer);
		};
	}, [run]);

	const { times, hints, counts, profiles, wars } = st.current;
	const off = (key: CardKey) => times[key] == null;
	// У неактивной кнопки и в недоступной карточке загрузка не показывается (как в старом приложении)
	const collect = (card: CardKey, mode: Mode, title = 'Собрать', disabled = false, action = 'collect') => (
		<Button size="s" mode="commerce" loading={loading && !disabled && !off(card)} disabled={disabled} onClick={() => void run(mode, action)}>
			{title}
		</Button>
	);
	const secondary = (card: CardKey, mode: Mode, action: string, title: string, disabled = false) => (
		<Button size="s" mode="secondary" loading={loading && !disabled && !off(card)} disabled={disabled} onClick={() => void run(mode, action)}>
			{title}
		</Button>
	);
	const then = (promise: Promise<void>, message: string) => void promise.then(() => st.current.mounted && log.text(message));

	const chips = (
		<HorizontalScroll className={styles.chips} arrowSize="m">
			<div className={styles.chipsIn}>
				{RESOURCES.map((key) => (
					<div key={key} className={styles.chip}>
						{loading || !synced ? (
							<>
								<Skeleton width={18} height={18} style={{ flexShrink: 0 }} />
								<Skeleton width={36} height={12} style={{ flexShrink: 0 }} />
							</>
						) : (
							<>
								<Photo src={`${PATH_IMAGES}bot/resources/${key}.png`} size={18} radius={4} />
								<span>{numberSpaces(counts[key] || 0)}</span>
							</>
						)}
					</div>
				))}
			</div>
		</HorizontalScroll>
	);

	const cards = synced ? (
		<div className={styles.cards}>
			<ActionCard
				title="Карта"
				after={times.map || '0/0'}
				disabled={off('map')}
				hint={hints.map ?? null}
				bottom={
					<>
						{collect('map', 'map')}
						{secondary('map', 'map', 'upgrade', 'Улучшить')}
					</>
				}
			>
				Сбор награды и улучшение доступных построек на карте
			</ActionCard>
			<ActionCard
				title="Сундук"
				after={getTime(times.chest ?? 0)}
				disabled={off('chest')}
				hint={hints.chest ?? null}
				bottom={
					<>
						{collect('chest', 'chest', 'Собрать', waiting(times.chest) || times.chest === 'clear')}
						{secondary('chest', 'chest', 'open', 'Взломать', times.chest !== 'clear')}
					</>
				}
			>
				Сбор награды и взлом активных сундуков в профиле
			</ActionCard>
			<ActionCard
				title="Питомец"
				after={getTime(times.pet ?? 0)}
				disabled={off('pet')}
				hint={hints.pet ?? null}
				bottom={
					<>
						{collect('pet', 'pet', 'Собрать', waiting(times.pet) || times.pet === 'clear')}
						{secondary('pet', 'pet', 'send', 'Отправить', times.pet !== 'clear')}
					</>
				}
			>
				Сбор награды и отправка на поиск активного питомца
			</ActionCard>
			<ActionCard
				title="Лотерея"
				after={getTime(times.lottery ?? 0)}
				disabled={off('lottery')}
				hint={hints.lottery ?? null}
				bottom={collect('lottery', 'lottery', 'Собрать', waiting(times.lottery))}
			>
				Сбор ежедневной награды за игру в лотерею
			</ActionCard>
			<ActionCard title="Обыск друзей" disabled={off('search')} hint={hints.search ?? null} bottom={collect('search', 'search')}>
				Сбор ежедневной награды за обыск друзей
			</ActionCard>
			<ActionCard title="Энергия" disabled={off('energy')} hint={hints.energy ?? null} bottom={collect('energy', 'energy')}>
				Сбор ежедневной энергии по ссылкам со стены{' '}
				<a className={styles.link} href="https://vk.com/wiki.warlord" target="_blank" rel="noreferrer">
					vk.com/wiki.warlord <Icon24ExternalLinkOutline width={16} height={16} />
				</a>
			</ActionCard>
			<ActionCard title="Ежедневная награда" disabled={off('daily')} hint={hints.daily ?? null} bottom={collect('daily', 'daily')}>
				Собирает случайную награду за ежедневный вход в игру
			</ActionCard>
			<ActionCard title="Премиум сундук" disabled={off('vip')} hint={hints.vip ?? null} bottom={collect('vip', 'vip')}>
				Собирает сундук, который выдаётся за премиум статус
			</ActionCard>
			<ActionCard
				title="Здания гильдии"
				after={getTime(times.guildBuilds ?? 0)}
				disabled={off('guildBuilds')}
				hint={hints.guildBuilds ?? null}
				bottom={collect('guildBuilds', 'guildBuild', 'Собрать', waiting(times.guildBuilds))}
			>
				Собирает награду за обыск зданий, которые построены в гильдии
			</ActionCard>
			<ActionCard
				title="Дань гильдии"
				disabled={off('guildReward')}
				hint={hints.guildReward ?? null}
				bottom={collect('guildReward', 'guildReward')}
				extra={
					<Checkbox className={styles.checkbox} checked={st.current.guildReward} onChange={() => ((st.current.guildReward = !st.current.guildReward), rerender())}>
						Собирать со всех
					</Checkbox>
				}
			>
				Собирает награду за захваченные районы гильдией
			</ActionCard>
			<ActionCard
				title="Набеги гильдии"
				disabled={off('guildWars')}
				hint={hints.guildWars ?? null}
				bottom={collect('guildWars', 'guildWars')}
				extra={
					<>
						<Input
							className={styles.input}
							type="number"
							disabled={loading}
							placeholder="Начало"
							value={String(wars.start || '')}
							onChange={(event) => ((st.current.wars.start = Number(event.target.value)), rerender())}
						/>
						<Input
							className={styles.input}
							type="number"
							disabled={loading}
							placeholder="Конец"
							value={String(wars.end || '')}
							onChange={(event) => ((st.current.wars.end = Number(event.target.value)), rerender())}
						/>
					</>
				}
			>
				Собирает награды за побеждённых врагов во всех возможных набегах
			</ActionCard>
		</div>
	) : (
		<div className={styles.cards}>
			{Array.from({ length: 4 }, (_, index) => (
				<div key={index} className={styles.card}>
					<div className={styles.head}>
						<Skeleton height={20} width={70} />
					</div>
					<div className={styles.body}>
						<Skeleton height={32} width="75%" />
					</div>
					<div className={styles.bottom}>
						<Skeleton height={isDesktop ? 28 : 30} width="100%" />
						<Skeleton height={isDesktop ? 28 : 30} width="100%" />
					</div>
				</div>
			))}
		</div>
	);

	return (
		<WikiPanel
			id={id}
			parent="profile"
			title="Ресурсы"
			description="Мой профиль"
			avatar="labels/14.png"
			top={chips}
			bottom={
				<BotFooter
					buttonSize="s"
					loading={!synced}
					log={log.entries}
					onClear={log.clear}
					actions={[
						{ title: 'Собрать всё', mode: 'commerce', onClick: () => then(run('all'), 'все ресурсы собраны'), disabled: loading, loading },
						...(profiles.length > 1
							? [
									{
										title: 'Собрать со всех',
										mode: 'secondary' as const,
										onClick: () => then(run('all-in-all'), 'все ресурсы со всех профилей собраны'),
										disabled: loading,
										loading,
										after: (
											<span className={styles.counter}>
												<span>{profiles.length}</span>
											</span>
										),
									},
								]
							: []),
						{ title: 'Обновить', mode: 'secondary', onClick: () => then(run(), 'данные обновлены'), disabled: loading, loading },
					]}
				/>
			}
		>
			{synced ? (
				<PullToRefresh className={styles.refresh} slotProps={{ controls: { zIndex: 0 } }} onRefresh={() => !loading && then(run(), 'данные обновлены')} isFetching={loading}>
					<ScrollBox height={240}>{cards}</ScrollBox>
				</PullToRefresh>
			) : (
				cards
			)}
		</WikiPanel>
	);
}
