import { useCallback, useEffect, useRef, useState } from 'react';
import { getGame } from '../../../api/game';
import type { Attrs } from '../../../api/gameTypes';
import { notify } from '../../../app/notify';
import { useIsDesktop } from '../../../app/layout';
import { Slider } from '../../../components/form/Form';
import { BotFooter, InfoCard, InfoGrid, InfoSkeleton, Option, OptionGrid, useBotLog } from '../../../components/profile/BotBlocks';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { Divider } from '../../../components/Divider';
import dataArena from '../../../data/arena.json';
import { numberForm, numberSpaces } from '../../../lib/format';
import { useBotRunner } from '../../../profile/bots/useBotRunner';
import { storageGetWithDefault, storageSet } from '../../../lib/storage';
import { wait } from '../../../lib/async';
import { asArray, botAuth, errorText, loadBotProfile, type BotAuth } from '../../../profile/bots/common';
import { fightHash } from '../../../profile/bots/hash';
import { openPanel } from '../../../store/nav';
import styles from './Bots.module.css';

/** Цена противника в золоте по лиге */
const FIGHT_PRICE = [0, 10, 30, 50, 90, 150, 250, 350, 500, 650];
const LEAGUE_IMAGES = ['46', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const LEAGUE_NAMES = [
	'Нет лиги',
	'Лига Новичков',
	'Лига Воинов I',
	'Лига Воинов II',
	'Лига Мастеров',
	'Лига Рыцарей',
	'Лига Чемпионов',
	'Тёмная Лига',
	'Кровавая Лига',
	'Легендарная Лига',
];

interface Settings {
	/** Сильного противника пропускать за 4 энергии */
	useEnergy: boolean;
	/** …или драться (тратит золото и кубки) */
	useGold: boolean;
	/** Остановка после лимита проигрышей */
	useLoss: boolean;
	/** …или после лимита сундуков */
	useChest: boolean;
}

const DEFAULT_SETTINGS: Settings = { useEnergy: false, useGold: true, useLoss: true, useChest: false };

/** Лига по кубкам (getLeague). */
function leagueOf(cups: number) {
	const index = dataArena.league.slice(0, 8).findIndex((league) => cups < league.to);
	return index === -1 ? 9 : index + 1;
}

/** Игрок арены: поля ответа (`_en`, `_m3` …), к ним добавляются `enemy`, `rating`, `chests`; часть полей по ходу боя заменяется числами. */
type Player = { [field: `_${string}`]: string | number } & { enemy?: Attrs; rating?: Attrs; chests?: number };

/** Строка боя для подписи результата: свой удар, навыки противника и урон. */
function fightKey(fields: Record<string, string | number>) {
	const values = { s0: 1, s1: 0, s2: 0, s3: 0, s4: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, m0: 3, r: 1, dd: 0, dg: 0, ...fields };
	return `<data><d ${Object.entries(values)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ')} /></data>`;
}

/** 7. Арена: бот проводит бои, пропускает сильных противников и останавливается по лимиту. */
export function ArenaBotPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const log = useBotLog();
	const { text: logText } = log;
	// Запуск и остановка общие с ботом рейдов; после остановки данные обновляются (reload объявлен ниже)
	const { flags, running, starting, pausing, setPausing, pause, beginStart, abortStart, markStarted, runLoop } = useBotRunner({
		onPause: () => log.text('Бот поставлен на паузу, завершаем последнее действие'),
		onStopped: () => void reload(),
	});
	const [player, setPlayer] = useState<Player | null>(null);
	const [loading, setLoading] = useState(false);
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [tryLimit, setTryLimit] = useState(20);
	// Состояние запущенного бота читается из циклов, поэтому хранится в ref
	const run = useRef({
		tries: 0,
		player: null as Player | null,
		settings: DEFAULT_SETTINGS,
		tryLimit: 20,
	});
	// Циклы бота читают настройки из ref: он обновляется после каждой отрисовки, а не во время неё
	useEffect(() => {
		run.current.settings = settings;
		run.current.tryLimit = tryLimit;
	});

	const update = (patch: Player) => {
		run.current.player = { ...run.current.player, ...patch };
		setPlayer(run.current.player);
	};

	/** Профиль и данные арены; null — бот не может работать (страница уже закрыта или ошибка). */
	const load = useCallback(async (): Promise<BotAuth | null> => {
		const bot = botAuth();
		if (!bot) return null;
		const profile = await loadBotProfile(bot);
		if (!profile || !flags.mounted) return null;
		const arena = await getGame(bot.server, { i: 9, t: 1 }, bot.auth);
		if (!arena?.my_rating) {
			// Страница уже открыта и данные есть (обновление после остановки): сбой не выбрасывает с неё, можно повторить
			if (!run.current.player) openPanel(null, { force: true });
			notify({ text: 'Ошибка при получении данных арены', icon: 'error' });
			return null;
		}
		run.current.player = { ...profile.u, enemy: arena.u, rating: arena.my_rating, chests: asArray(profile?.chests?.ch).length };
		setPlayer(run.current.player);
		return bot;
	}, [flags]);

	const reload = useCallback(
		async (message = true) => {
			setLoading(true);
			const bot = await load();
			if (bot && message) logText('Данные обновлены');
			setLoading(false);
			return bot;
		},
		[load, logText, setLoading],
	);

	useEffect(() => {
		void (async () => {
			setLoading(true);
			const saved = await storageGetWithDefault('arenaSettings', JSON.stringify(DEFAULT_SETTINGS));
			try {
				const value = JSON.parse(saved.value);
				const next: Settings = {
					useEnergy: value.useEnergy ?? false,
					useGold: value.useGold ?? true,
					useLoss: value.useLoss ?? true,
					useChest: value.useChest ?? false,
				};
				if (next.useEnergy === next.useGold) Object.assign(next, { useEnergy: false, useGold: true });
				if (next.useLoss === next.useChest) Object.assign(next, { useLoss: true, useChest: false });
				setSettings(next);
				setTryLimit(value.tryLimit || 20);
			} catch {
				// настройки по умолчанию
			}
			await load();
			setLoading(false);
		})();
	}, [load]);

	const saveSettings = (next: Settings, limit = tryLimit) => {
		setSettings(next);
		void storageSet('arenaSettings', JSON.stringify({ ...next, tryLimit: limit }));
	};

	/** Один бой: противник, пропуск или бой до конца. */
	const fight = async (bot: BotAuth) => {
		const state = run.current;
		const me = state.player!;
		const enemyData = await getGame(bot.server, { i: 9, t: 1 }, bot.auth);
		if (!enemyData?.my_rating) {
			if (flags.start) log.text('Ошибка при получении данных врага', 'red');
			pause();
			return;
		}
		update({ enemy: enemyData.u, rating: enemyData.my_rating });
		const enemy = enemyData.u;
		const enemyHp = Number(enemy._end) + Number(enemy._endi);
		if (flags.start) {
			log.message(
				`bot/arena/avatar_${Number(enemy._aid)}.png`,
				enemy._name === '' ? `Player${enemy._id}` : enemy._name,
				`Обнаружен противник с ${numberSpaces(enemyHp * 15)} HP и ${numberSpaces(Number(enemy._dmgi))} DMG`,
			);
		}

		const hits = Math.ceil((enemyHp * 15) / Number(me._dmgi));
		const canTake = Math.ceil(((Number(me._end) + Number(me._endi)) * 15) / Number(enemy._dmgi));
		if (!(hits <= canTake) && state.settings.useEnergy) {
			if (Number(state.player!._en) >= 4) {
				update({ _en: Number(state.player!._en) - 4 });
				await getGame(bot.server, { i: 121 }, bot.auth);
				state.tries++;
				if (flags.start) log.text(`Пропустили противника${state.settings.useLoss ? ` ${state.tries} из ${state.tryLimit}` : ''}`, 'green');
			} else {
				if (flags.start) log.text('Не хватает энергии на пропуск противника', 'red');
				pause();
			}
			return;
		}

		const price = FIGHT_PRICE[Number(state.player!._al)] ?? 0;
		if (Number(state.player!._m3) < price) {
			if (flags.start) log.text('Не хватает золота на создание противника', 'red');
			pause();
			return;
		}
		update({ _m3: Number(state.player!._m3) - price });

		let battle = await getGame(bot.server, { i: 11, t: enemy._id }, bot.auth);
		if (!battle?.fight) {
			await wait(3000);
			if (!flags.mounted) return;
			battle = await getGame(bot.server, { i: 11, t: enemy._id }, bot.auth);
		}
		if (!battle?.fight) {
			log.text('Невозможно создать противника', 'red');
			pause();
			return;
		}

		// Навык противника и очки навыка читаются из текущего состояния боя: сначала это весь ответ, затем узел fight
		let node: Player = battle;
		let alive = true;
		// Бой длится примерно столько раундов, сколько нужно ударов; запас втрое. Если сервер не заканчивает бой, цикл не бесконечный
		const maxRounds = Number.isFinite(hits + canTake) ? Math.min(5000, Math.max(100, 3 * (hits + canTake))) : 500;
		let rounds = 0;
		while (alive && flags.mounted) {
			if (++rounds > maxRounds) {
				log.text('Бой не заканчивается, бот остановлен', 'red');
				pause();
				return;
			}
			const dmg = Number(enemy._dmgi);
			const myDmg = Number(me._dmgi);
			const skill = Number(node._esk);
			let key: string;
			if (Number(node._myr) >= 9 && Number(me._s3) > 0) key = fightKey({ s0: 0, s3: 1, dd: myDmg + Number(me._s3) * 7, dg: 0 });
			else if (skill === 1) key = fightKey({ dd: myDmg, dg: dmg + Number(enemy._s1) * 5 });
			else if (skill === 2) key = fightKey({ dd: myDmg - Number(enemy._s2), dg: dmg });
			else if (skill === 3) key = fightKey({ dd: 0, dg: dmg + Number(enemy._s3) * 7 });
			else key = fightKey({ dd: myDmg, dg: dmg });

			const result = await getGame(bot.server, { i: 12, t: fightHash(key) }, bot.auth);
			if (!result?.fight) {
				if (flags.start) log.text(`Ошибка при убийстве противника: раунд ${rounds}, HP ${Number(node._myhp)} / ${Number(node._hp)}, ответ ${errorText(result)}`, 'red');
				pause();
				return;
			}
			const chest = Array.isArray(result.r);
			const reward = chest ? result.r[1] : result.r;
			const fightState = result.fight;
			node = fightState;
			if ((Number(fightState._myhp) > 0 && Number(fightState._hp) <= 0) || (Number(fightState._myhp) <= 0 && Number(fightState._hp) <= 0)) {
				alive = false;
				const cups = Math.max(0, Number(state.player!._ap) + 19);
				update({
					chests: (state.player!.chests ?? 0) + (chest ? 1 : 0),
					_ap: cups,
					_exp: Number(state.player!._exp) + (Number.isInteger(Number(reward?._exp)) ? Number(reward._exp) : 0),
					_al: leagueOf(cups),
				});
				if (flags.start) log.text('Убили противника', 'green');
			} else if (Number(fightState._myhp) <= 0) {
				alive = false;
				const cups = Math.max(0, Number(state.player!._ap) - 16);
				update({ _ap: cups, _al: leagueOf(cups) });
				state.tries++;
				if (flags.start) log.text(`Противник оказался сильнее${state.settings.useLoss ? ` ${state.tries} из ${state.tryLimit}` : ''}`, 'red');
			}
		}
	};

	const start = async () => {
		const state = run.current;
		// Лоадер на кнопке сразу по клику, не после ответа сервера; остальные кнопки, кроме «Остановить», заблокированы
		if (!beginStart()) return;
		setLoading(true);
		const bot = await load();
		setLoading(false);
		if (!bot || !flags.mounted || flags.startCancelled) {
			// Запуск закончен без цикла: ошибка данных или отмена кнопкой «Остановить»
			abortStart();
			return;
		}
		markStarted();
		state.tries = 0;
		log.text('Бот запущен', 'green');
		if (state.settings.useChest && state.player!.chests === 3) {
			log.text('Лимит сундуков', 'red');
			pause();
			return;
		}
		await runLoop(async () => {
			do {
				await fight(bot);
			} while (flags.mounted && flags.start && ((state.settings.useLoss && state.tries < state.tryLimit) || (state.settings.useChest && (state.player!.chests ?? 0) < 3)));
		});
		// Бот сам дошёл до конца (остановку кнопкой завершает runLoop)
		if (flags.mounted && flags.start) pause();
	};

	const disabled = running || starting;
	const chests = Number(player?.chests);

	return (
		<WikiPanel
			id={id}
			parent="profile"
			title="Арена"
			description="Мой профиль"
			avatar="labels/30.png"
			bottom={
				<BotFooter
					buttonSize="s"
					loading={!player}
					log={log.entries}
					onClear={log.clear}
					actions={[
						{ title: 'Запустить', mode: 'commerce', onClick: () => void start(), disabled: running || starting || loading, loading: running || starting },
						{ title: 'Остановить', mode: 'destructive', onClick: () => (setPausing(true), pause()), disabled: !(running || starting) || (loading && !starting), loading: pausing },
						{ title: 'Обновить', mode: 'secondary', onClick: () => void reload(), disabled: running || starting || loading, loading },
					]}
				/>
			}
		>
			<ScrollBox height={299} locked={!player}>
				{player && !loading ? (
					<InfoGrid>
						<InfoCard image="bot/arena/2.png" title="Сундуки" subtitle={numberSpaces(player.chests)} />
						<InfoCard image="bot/arena/19.png" title="Энергия" subtitle={numberSpaces(player._en)} />
						<InfoCard image="bot/arena/11.png" title="Золото" subtitle={numberSpaces(player._m3)} />
						<InfoCard image={`bot/arena/${LEAGUE_IMAGES[Number(player._al)]}.png`} title="Лига" subtitle={LEAGUE_NAMES[Number(player._al)]} />
						<InfoCard image="bot/arena/8.png" title="Место в лиге" subtitle={numberSpaces(player.rating?._val)} />
						<InfoCard image="bot/arena/1.png" title="Кубки арены" subtitle={numberSpaces(player._ap)} />
					</InfoGrid>
				) : (
					<InfoGrid>
						{Array.from({ length: 6 }, (_, index) => (
							<InfoSkeleton key={index} />
						))}
					</InfoGrid>
				)}
				<Divider />
				{player ? (
					<>
						<div className={styles.sliderCard}>
							<Slider className={styles.slider} min={1} max={100} value={tryLimit} onChange={(value) => (flags.start ? undefined : setTryLimit(value))} />
							<span className={styles.sliderLabel}>Лимит проигрышей</span>
						</div>
						<div className={styles.gap} />
						<OptionGrid>
							<Option
								type="radio"
								checked={settings.useLoss}
								disabled={disabled}
								onChange={() => saveSettings({ ...settings, useLoss: true, useChest: false })}
								description={`Остановка после ${tryLimit} ${numberForm(tryLimit, ['боя', 'боёв', 'боёв'])}`}
							>
								Бой
							</Option>
							<Option
								type="radio"
								checked={settings.useChest}
								disabled={disabled || chests === 3}
								onChange={() => saveSettings({ ...settings, useLoss: false, useChest: true })}
								description="Остановка после лимита сундуков"
							>
								Сундуки
							</Option>
							<Option
								type="radio"
								checked={settings.useEnergy}
								disabled={disabled}
								onChange={() => saveSettings({ ...settings, useEnergy: true, useGold: false })}
								description="Тратит 4 энергии"
							>
								Энергия
							</Option>
							<Option
								type="radio"
								checked={settings.useGold}
								disabled={disabled}
								onChange={() => saveSettings({ ...settings, useEnergy: false, useGold: true })}
								description={`Тратит ${FIGHT_PRICE[Number(player._al)]} золота и 16 кубков`}
							>
								Золото
							</Option>
						</OptionGrid>
					</>
				) : (
					<OptionGrid>
						<Skeleton height={isDesktop ? 36 : 52} />
						<Skeleton height={isDesktop ? 36 : 52} />
						{Array.from({ length: 4 }, (_, index) => (
							<Skeleton key={index} height={36} />
						))}
					</OptionGrid>
				)}
			</ScrollBox>
		</WikiPanel>
	);
}
