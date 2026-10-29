import { useCallback, useEffect, useRef, useState } from 'react';
import { Tappable } from '@vkontakte/vkui';
import { getGame } from '../../../api/game';
import type { RaidNode } from '../../../api/gameTypes';
import { notify } from '../../../app/notify';
import { Divider } from '../../../components/Divider';
import { Button } from '../../../components/form/Form';
import { BotFooter, InfoCard, InfoGrid, InfoSkeleton, Option, OptionGrid, useBotLog } from '../../../components/profile/BotBlocks';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { numberForm, numberSpaces } from '../../../lib/format';
import { storageGetWithDefault, storageSet } from '../../../lib/storage';
import { wait } from '../../../lib/async';
import { askConfirm } from '../../../lib/confirmAction';
import { botAuth, loadBotProfile, type BotAuth } from '../../../profile/bots/common';
import { useBotRunner } from '../../../profile/bots/useBotRunner';
import { fightHash } from '../../../profile/bots/hash';
import { raidPath } from '../../../profile/bots/raidMaps';
import { parseReward, type RewardLine } from '../../../profile/bots/reward';
import { RAIDS, MODES, BOSSES, CHESTS, Settings, DEFAULT_SETTINGS, tierOn, anyTier, RaidData, readRaid, neededEnergy, rewardCards, fightKey, simulateBossFight } from './raidData';
import styles from './RaidsBotPanel.module.css';

/** 6. Рейды: выбор рейда и режима, затем бот проходит карту, убивает боссов и собирает сундуки и бочки. */
export function RaidsBotPanel({ id }: { id: string }) {
	const log = useBotLog();
	const { text: logText, message: logMessage, clear: logClear } = log;
	const [raid, setRaid] = useState<RaidData | null>(null);
	// Страница сразу начинает загрузку рейда
	const [loading, setLoading] = useState(true);
	const [exiting, setExiting] = useState(false);
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [, setTick] = useState(0);
	// Запуск и остановка общие с ботом арены; после остановки данные рейда обновляются (reload объявлен ниже)
	const { flags, running, starting, pausing, setPausing, pause, beginStart, abortStart, markStarted, markFinished, runLoop } = useBotRunner({
		onPause: () => logText('Бот поставлен на паузу, завершаем последнее действие'),
		onStopped: () => {
			setLoading(true);
			void reload();
		},
	});
	const run = useRef({
		exiting: false,
		settings: DEFAULT_SETTINGS,
		raid: null as RaidData | null,
	});
	// Циклы бота читают настройки из ref: он обновляется после каждой отрисовки, а не во время неё
	useEffect(() => {
		run.current.settings = settings;
	});

	const show = (data: RaidData | null) => {
		run.current.raid = data;
		setRaid(data);
		setTick((value) => value + 1);
	};

	/** Пересчитать энергию на рейд; с сообщением — после изменения настроек (они и сохраняются). */
	const updateEnergy = useCallback((next: Settings, message = false) => {
		const data = run.current.raid;
		if (!data?.point) return;
		data.energy = neededEnergy(data, next);
		setTick((value) => value + 1);
		setLoading(false);
		if (message) {
			void storageSet('raidSettings', JSON.stringify(next));
			notify({ text: `Настройки применены, на рейд необходимо ${data.energy} ${numberForm(data.energy, ['энергия', 'энергии', 'энергии'])}`, icon: 'done' });
		}
	}, []);

	const loadSettings = async (base: Settings) => {
		const saved = await storageGetWithDefault('raidSettings', JSON.stringify(base));
		try {
			const value = JSON.parse(saved.value);
			if (value)
				return {
					...base,
					barrels: value.barrels,
					chestsTier1: value.chestsTier1,
					chestsTier2: value.chestsTier2,
					chestsTier3: value.chestsTier3,
					chestsTier4: value.chestsTier4,
					chestsTier5: value.chestsTier5,
				};
		} catch {
			// настройки по умолчанию
		}
		return base;
	};

	/** Профиль и рейд с сервера: данные и ответ с рейдом; null — бот не может работать. */
	const fetchRaid = useCallback(async (): Promise<{ bot: BotAuth; data: RaidData; uraid: RaidNode | undefined } | null> => {
		const bot = botAuth();
		if (!bot) return null;
		const profile = await loadBotProfile(bot);
		if (!profile || !flags.mounted) return null;
		const data: RaidData = {
			chests: [],
			barrels: [],
			bosses: [],
			reward: {},
			energy: run.current.raid?.energy ?? 0,
			id: 0,
			mode: 0,
			point: 0,
			hp: 0,
			limit: Number(profile.raids_cnt?._v),
			player: profile.u,
		};
		return { bot, data, uraid: profile.uraid };
	}, [flags]);

	/** Загрузка или обновление страницы. */
	const reload = useCallback(
		async (first = false) => {
			const result = await fetchRaid();
			if (!result) {
				// Данные не пришли: загрузка не должна крутиться вечно, повторить можно кнопкой «Обновить»
				if (flags.mounted) setLoading(false);
				return;
			}
			const { data, uraid } = result;
			let next = run.current.settings;
			if (uraid !== undefined) {
				readRaid(data, uraid);
				next = { ...next, selectedRaid: data.id, selectedMode: data.mode };
			}
			if (first) next = await loadSettings(next);
			else logText('Данные обновлены');
			setSettings(next);
			show(data);
			setLoading(false);
			updateEnergy(next);
		},
		[fetchRaid, flags, logText, updateEnergy],
	);

	useEffect(() => {
		void reload(true);
	}, [reload]);

	/** Данные персонажа (getStats): энергия перед каждым действием. */
	const stats = async (bot: BotAuth) => {
		try {
			return (await getGame(bot.server, {}, { login: bot.auth.login, password: bot.auth.password }))?.u ?? null;
		} catch {
			return null;
		}
	};

	/** Бой с боссом в точке `to`: true — путь свободен. */
	const fightBoss = async (bot: BotAuth, data: RaidData, to: number): Promise<boolean> => {
		const state = run.current;
		const boss = data.bosses.find((item) => item.point === to);
		if (!boss) return true;
		if (boss.status === 1) return true;
		// Бот остановлен: босса, найденного после остановки, не трогаем и остаёмся в точке
		if (!flags.start) return false;
		if (boss.status !== 0) {
			pause();
			return false;
		}
		const player = await stats(bot);
		if (!flags.start) return false;
		if (!player) {
			logText('Ошибочные данные персонажа', 'red');
			pause();
			return false;
		}
		if (!(boss.type === 1 ? Number(player._en) >= 6 : Number(player._en) >= 3)) {
			logText('Не хватает энергии на убийство босса', 'red');
			pause();
			return false;
		}
		const body = { i: 11, t: boss.id, t2: 3, t3: 0, t4: 0, t5: 0 };
		// Запрос на создание босса отправлен: бой доводим до конца, даже если нажали «Остановить», иначе бот бросит живого босса
		let game = await getGame(bot.server, body, bot.auth);
		if (!game?.fight) {
			await wait(3000);
			game = await getGame(bot.server, body, bot.auth);
		}
		if (!game?.fight) {
			logText('Невозможно создать босса', 'red');
			pause();
			return false;
		}
		// Бой считается заранее: навык каждые 9 очков, затем свитки (если включены) или обычный удар
		const fight = simulateBossFight({
			hp: Number(game.fight._hp),
			dmg: Number(game.fight._dmg),
			myHp: Number(game.fight._myhp),
			myDmg: Number(data.player._dmgi),
			skill: Number(data.player._s3),
			lightning: Number(data.player._item1),
			fire: Number(data.player._item3),
			useLightning: state.settings.useScrollLightning,
			useFire: state.settings.useScrollFire,
		});
		const { hp, hits, handHits, lightningHits, fireHits, skillHits, taken, dealt } = fight;
		const [bossName, bossImage] = BOSSES[data.id - 1]?.[boss.type - 1] ?? ['', ''];
		if (hp <= 0) {
			const hash = fightHash(fightKey({ s0: handHits, s3: skillHits, c1: lightningHits, c3: fireHits, r: hits + skillHits, dd: dealt, dg: taken }));
			const result = await getGame(bot.server, { i: 12, t: hash }, bot.auth);
			if (result?.fight && Number(result.fight._hp) <= 0) {
				boss.status = 1;
				logMessage(bossImage, bossName, `Убит босс с ${numberSpaces(result.fight._mhp)} HP и ${numberSpaces(result.fight._dmg)} DMG`);
				return true;
			}
			logText('Ошибка при убийстве босса', 'red');
			pause();
			return false;
		}
		logText('Невозможно убить босса, вы умрёте', 'red');
		pause();
		await wait(3000);
		await getGame(bot.server, body, bot.auth);
		return false;
	};

	/** Бочка в текущей точке. */
	const openBarrel = async (bot: BotAuth, data: RaidData) => {
		if (!run.current.settings.barrels) return;
		const barrel = data.barrels.find((item) => item.point === data.point);
		if (!barrel || barrel.status === 0) return;
		if (barrel.status !== 1) {
			logText('Невозможно открыть бочку', 'red');
			pause();
			return;
		}
		if (!flags.start) return;
		const player = await stats(bot);
		if (!flags.start) return;
		if (!player) {
			logText('Ошибочные данные персонажа', 'red');
			pause();
		} else if (Number(player._en) >= 3) {
			const game = await getGame(bot.server, { i: 82 }, bot.auth);
			barrel.status = 0;
			logMessage('bot/raids/108.png', 'Бочка', game?.rstep?.r ? parseReward(game.rstep.r) : 'Нет награды');
		} else {
			logText('Не хватает энергии на открытие бочки', 'red');
			pause();
		}
	};

	/** Сундук в текущей точке (только выбранных уровней). */
	const openChest = async (bot: BotAuth, data: RaidData) => {
		const settings = run.current.settings;
		if (!anyTier(settings)) return;
		const chest = data.chests.find((item) => item.point === data.point);
		if (!chest || !tierOn(settings, chest.type) || chest.status === 0 || chest.status === 2) return;
		if (chest.status !== 1) {
			logText('Невозможно открыть сундук', 'red');
			pause();
			return;
		}
		if (!flags.start) return;
		const player = await stats(bot);
		if (!flags.start) return;
		if (!player) {
			logText('Ошибочные данные персонажа', 'red');
			pause();
		} else if (Number(player._en) >= chest.en) {
			const game = await getGame(bot.server, { i: 79, t1: 1 }, bot.auth);
			chest.status = 0;
			const [name, image] = CHESTS[chest.type - 1] ?? ['', '', ''];
			const lines: RewardLine[] | string = game?.rstep?.r ? parseReward(game.rstep.r) : 'Нет награды';
			logMessage(image, name, lines);
		} else {
			logText('Не хватает энергии на открытие сундука', 'red');
			pause();
		}
	};

	/** Переход в точку: сначала босс на пути, затем шаг, бочка и сундук. */
	const move = async (bot: BotAuth, data: RaidData, to: number) => {
		if (!flags.start) return;
		if (!(await fightBoss(bot, data, to))) return;
		// Остановили во время боя: шаг в следующую точку не делаем
		if (!flags.start) return;
		const game = await getGame(bot.server, { i: 77, t: to }, bot.auth);
		if (Number(game?.res?._v) === 1) {
			await getGame(bot.server, { i: 81 }, bot.auth);
			logText(`Переместились в точку ${to}`);
			data.point = to;
			setTick((value) => value + 1);
			await openBarrel(bot, data);
			await openChest(bot, data);
		} else if (flags.start) {
			logText(`Невозможно перейти в точку ${to}`, 'red');
			pause();
		}
	};

	/** Обход карты: все бочки и выбранные сундуки по возрастанию номера точки. */
	const navigate = async (bot: BotAuth, data: RaidData, raidId: number) => {
		const state = run.current;
		const settings = state.settings;
		const marks: { point: number; visited: boolean }[] = [];
		if (settings.barrels) for (const barrel of data.barrels) if (barrel.status === 1) marks.push({ point: barrel.point, visited: false });
		for (const chest of data.chests) if (chest.status === 1 && tierOn(settings, chest.type)) marks.push({ point: chest.point, visited: false });
		marks.sort((a, b) => (a.point < b.point ? -1 : 1));
		// На одной точке могут быть и бочка, и сундук: отмечаются все метки точки
		const visit = (point: number) => {
			for (const mark of marks) if (mark.point === point) mark.visited = true;
		};
		if (flags.start) {
			await openBarrel(bot, data);
			await openChest(bot, data);
			visit(data.point);
		}
		for (const mark of marks) {
			if (!flags.start || mark.visited) continue;
			const path = raidPath(raidId, data.point, mark.point);
			// Пути нет (точки нет на карте): бот не должен молча пропустить награду и объявить рейд собранным
			if (!path.length && mark.point !== data.point) {
				logText(`Не найден путь в точку ${mark.point}`, 'red');
				pause();
				return;
			}
			for (const step of path) {
				if (!flags.start || !flags.mounted) break;
				await move(bot, data, step);
				visit(step);
			}
		}
		if (flags.start) {
			markFinished();
			logText('Собраны все возможные награды, рейд можно завершить', 'blue');
			setLoading(true);
			void reload();
		}
	};

	const start = async () => {
		const state = run.current;
		if (state.exiting) return;
		// Лоадер на кнопке сразу по клику, не после ответа сервера; остальные кнопки, кроме «Остановить», заблокированы
		if (!beginStart()) return;
		const result = await fetchRaid();
		if (!result) return void abortStart();
		if (flags.startCancelled) {
			abortStart();
			show(result.data);
			return;
		}
		const { bot, data } = result;
		let { uraid } = result;
		const settings = state.settings;
		if (uraid === undefined && data.limit < 3) {
			const created = await getGame(bot.server, { i: 76, t: settings.selectedRaid ?? 0, t1: settings.selectedMode ?? 0 }, bot.auth);
			uraid = created?.uraid;
			if (uraid === undefined) {
				flags.stop();
				abortStart();
				show(data);
				logText('Невозможно начать рейд, ошибка при создании', 'red');
				return;
			}
		} else if (uraid === undefined) {
			flags.stop();
			abortStart();
			show(data);
			logText('Невозможно начать рейд, лимит попыток', 'red');
			return;
		}
		if (flags.startCancelled) {
			// Остановили, пока создавался рейд: рейд создан, но бот не запускаем
			abortStart();
			show(data);
			return;
		}
		markStarted();
		readRaid(data, uraid);
		show(data);
		updateEnergy(settings);
		logText('Бот запущен', 'green');
		await runLoop(() => navigate(bot, data, result.uraid === undefined ? (settings.selectedRaid ?? data.id) : data.id));
	};

	/** «Начать рейд» на экране выбора. */
	const create = async () => {
		setLoading(true);
		const result = await fetchRaid();
		if (!result) {
			if (flags.mounted) setLoading(false);
			return;
		}
		const { bot, data, uraid } = result;
		const settings = run.current.settings;
		if (uraid === undefined && data.limit < 3) {
			const created = await getGame(bot.server, { i: 76, t: settings.selectedRaid ?? 0, t1: settings.selectedMode ?? 0 }, bot.auth);
			if (created?.uraid !== undefined) {
				const next = await loadSettings(settings);
				setSettings(next);
				readRaid(data, created.uraid);
				show(data);
				updateEnergy(next);
			} else {
				show(data);
				notify({ text: 'Невозможно начать рейд, ошибка при создании', icon: 'error' });
			}
		} else if (uraid !== undefined) {
			// Рейд уже идёт (начат в игре): сразу показываем его
			readRaid(data, uraid);
			show(data);
			updateEnergy(settings);
		} else {
			show(data);
			notify({ text: 'Невозможно начать рейд, лимит попыток', icon: 'error' });
		}
		setLoading(false);
	};

	/** «Завершить»: выход из рейда (5 энергии). Пока идёт завершение, другие действия бота недоступны. */
	const exit = async () => {
		const state = run.current;
		if (state.exiting || flags.starting || flags.looping) return;
		state.exiting = true;
		try {
			await exitRaid();
		} finally {
			state.exiting = false;
		}
	};

	const exitRaid = async () => {
		setExiting(true);
		const result = await fetchRaid();
		if (!result) return setExiting(false);
		const { bot, data, uraid } = result;
		show(data);
		if (uraid !== undefined) {
			readRaid(data, uraid);
			updateEnergy(run.current.settings);
			const player = await stats(bot);
			if (!player) {
				logText('Ошибочные данные персонажа', 'red');
				pause();
			} else if (Number(player._en) >= 5) {
				const game = await getGame(bot.server, { i: 80 }, bot.auth);
				if (Number(game?.res?._v) === 1) {
					logText('Рейд завершён', 'green');
					setLoading(true);
					await reload();
					logClear();
					setSettings(DEFAULT_SETTINGS);
				} else {
					logText('Невозможно завершить рейд', 'red');
				}
			} else {
				logText('Не хватает энергии на завершение рейда', 'red');
			}
		} else {
			logText('Нет активного рейда', 'red');
		}
		setExiting(false);
	};

	const toggle = (key: keyof Settings) => {
		const next = { ...settings, [key]: !settings[key] };
		setSettings(next);
		if (key !== 'useScrollLightning' && key !== 'useScrollFire') updateEnergy(next, true);
	};

	const skeletonGrid = (
		<InfoGrid>
			{Array.from({ length: 6 }, (_, index) => (
				<InfoSkeleton key={index} />
			))}
		</InfoGrid>
	);

	// Экран выбора рейда
	if (raid && !raid.point) {
		return (
			<WikiPanel
				id={id}
				parent="profile"
				title="Рейды"
				description="Мой профиль"
				avatar="labels/4.png"
				bottom={
					<div className={styles.start}>
						<div className={styles.choice}>
							{settings.selectedRaid == null ? <span className={styles.choiceEmpty}>рейд</span> : RAIDS[settings.selectedRaid - 1]?.title} –{' '}
							{settings.selectedMode == null ? <span className={styles.choiceEmpty}>режим</span> : MODES[settings.selectedMode]?.title}
						</div>
						<Button
							size="s"
							className={styles.startButton}
							disabled={settings.selectedRaid == null || settings.selectedMode == null || raid.limit === 3 || loading}
							loading={loading}
							onClick={() => void create()}
						>
							Начать рейд
						</Button>
						<Button size="s" mode="tertiary" className={`${styles.startButton} ${styles.limit}`}>
							<span>{raid.limit} из 3</span>
						</Button>
					</div>
				}
			>
				<div className={styles.select}>
					<div className={`${styles.raids} ${settings.selectedRaid != null ? styles.isSelected : ''}`}>
						{RAIDS.map((item) => (
							<Tappable
								key={item.id}
								className={`${styles.option} ${settings.selectedRaid === item.id ? styles.checked : ''}`}
								onClick={() => setSettings({ ...settings, selectedRaid: item.id })}
							>
								<span className={styles.cell}>
									<img className={styles.shadow} src={item.image} alt="" />
									<img className={styles.image} src={item.image} alt="" />
									<span className={styles.title}>{item.title}</span>
									<span className={styles.reward}>{item.reward}</span>
								</span>
							</Tappable>
						))}
					</div>
					<div className={styles.gap} />
					<div className={`${styles.modes} ${settings.selectedMode != null ? styles.isSelected : ''}`}>
						{MODES.map((item) => (
							<Tappable
								key={item.id}
								className={`${styles.option} ${settings.selectedMode === item.id ? styles.checked : ''}`}
								onClick={() => setSettings({ ...settings, selectedMode: item.id })}
							>
								<span className={styles.cell}>
									<svg className={`${styles.shadow} ${styles.modeShadow}`} viewBox="0 0 150 150" aria-hidden="true">
										<circle cx="75" cy="75" r="75" fill={item.color} />
									</svg>
									<img className={`${styles.image} ${styles.modeImage}`} src={item.image} alt="" />
									<span className={styles.modeTitle}>{item.title}</span>
								</span>
							</Tappable>
						))}
					</div>
				</div>
			</WikiPanel>
		);
	}

	const data = raid;
	const bosses = data ? (BOSSES[data.id - 1] ?? []) : [];
	const rewards = data?.reward ? rewardCards(data.reward) : [];

	return (
		<WikiPanel
			id={id}
			parent="profile"
			title="Рейды"
			description="Мой профиль"
			avatar="labels/4.png"
			bottom={
				<BotFooter
					loading={!data && loading}
					log={log.entries}
					onClear={logClear}
					mobileRows={2}
					buttonSize="s"
					actions={[
						{ title: 'Запустить', mode: 'commerce', onClick: () => void start(), disabled: running || starting || exiting || loading, loading: running || starting },
						{ title: 'Остановить', mode: 'destructive', onClick: () => (setPausing(true), pause()), disabled: !(running || starting) || loading, loading: pausing },
						{
							title: 'Завершить',
							mode: 'secondary',
							onClick: () =>
								askConfirm({
									title: 'Завершить рейд?',
									description: 'Выход стоит 5 энергии, прохождение прервётся',
									confirm: 'Завершить',
									destructive: true,
									onConfirm: () => void exit(),
								}),
							disabled: running || starting || exiting || !data?.point || loading,
							loading: exiting,
						},
						{ title: 'Обновить', mode: 'secondary', onClick: () => (setLoading(true), void reload()), disabled: running || starting || exiting || loading, loading },
					]}
				/>
			}
		>
			<ScrollBox height={299} locked={!data}>
				{data && !loading ? (
					<InfoGrid>
						<InfoCard image="bot/raids/8.png" title={RAIDS[data.id - 1]?.title} subtitle={MODES[data.mode]?.title} />
						<InfoCard image="bot/raids/9.png" title="Попытки" subtitle={`${data.limit} из 3`} />
						<InfoCard image="bot/raids/7.png" title="Здоровье" subtitle={numberSpaces(data.hp)} />
						<InfoCard image="bot/raids/19.png" title="Энергия" subtitle={`${numberSpaces(data.player._en)} из ${data.energy}`} />
						<InfoCard
							image="bot/raids/17.png"
							title="Свитки молнии"
							subtitle={`${numberSpaces(data.player._item1)} ${numberForm(Number(data.player._item1), ['свиток', 'свитка', 'свитков'])}`}
						/>
						<InfoCard
							image="bot/raids/16.png"
							title="Свитки огня"
							subtitle={`${numberSpaces(data.player._item3)} ${numberForm(Number(data.player._item3), ['свиток', 'свитка', 'свитков'])}`}
						/>
					</InfoGrid>
				) : (
					skeletonGrid
				)}
				<Divider />
				{data ? (
					<OptionGrid>
						<Option type="checkbox" checked={settings.barrels} disabled={running || starting || exiting} onChange={() => toggle('barrels')}>
							Собирать бочки
						</Option>
						{['старые', 'железные', 'сапфировые', 'древние', 'эпические'].map((name, index) => {
							const key = `chestsTier${index + 1}` as keyof Settings;
							return (
								<Option key={key} type="checkbox" checked={!!settings[key]} disabled={running || starting || exiting} onChange={() => toggle(key)}>
									Собирать {name} сундуки
								</Option>
							);
						})}
						<Option
							type="checkbox"
							checked={settings.useScrollLightning}
							disabled={running || starting || exiting || settings.useScrollFire}
							onChange={() => toggle('useScrollLightning')}
						>
							Использовать свитки молнии
						</Option>
						<Option
							type="checkbox"
							checked={settings.useScrollFire}
							disabled={running || starting || exiting || settings.useScrollLightning}
							onChange={() => toggle('useScrollFire')}
						>
							Использовать свитки огня
						</Option>
					</OptionGrid>
				) : (
					<OptionGrid>
						{Array.from({ length: 8 }, (_, index) => (
							<Skeleton key={index} height={36} />
						))}
					</OptionGrid>
				)}
				<Divider />
				{data && !loading ? (
					<>
						<InfoGrid>
							{bosses.map(([name, image], index) => {
								const list = data.bosses.filter((boss) => boss.type === index + 1);
								return <InfoCard key={name + index} image={image} title={name} subtitle={`Убито ${list.filter((boss) => boss.status === 1).length} из ${list.length}`} />;
							})}
						</InfoGrid>
						<Divider />
						<InfoGrid>
							<InfoCard
								image="bot/raids/108.png"
								title="Бочки подземелья"
								subtitle={`Открыто ${data.barrels.filter((barrel) => barrel.status === 0).length} из ${data.barrels.length}`}
							/>
							{CHESTS.map(([, image, title], index) => {
								const list = data.chests.filter((chest) => chest.type === index + 1);
								return (
									<InfoCard
										key={title}
										image={image}
										title={title}
										subtitle={`Открыто ${list.filter((chest) => chest.status === 0 || chest.status === 2).length} из ${list.length}`}
									/>
								);
							})}
						</InfoGrid>
						{data.reward && (
							<>
								<Divider />
								<InfoGrid>
									{rewards.map((card, index) => (
										<InfoCard key={index} image={card.image} title={card.title} subtitle={card.subtitle} item={card.item} />
									))}
								</InfoGrid>
								{!rewards.length && <div className={styles.empty}>Нет наград</div>}
							</>
						)}
					</>
				) : data ? (
					<>
						{skeletonGrid}
						<Divider />
						{skeletonGrid}
						<Divider />
						{skeletonGrid}
					</>
				) : null}
			</ScrollBox>
		</WikiPanel>
	);
}
