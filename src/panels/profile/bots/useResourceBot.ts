import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notify } from '../../../app/notify';
import { useBotLog } from '../../../components/profile/BotBlocks';
import { useLeaveGuard } from '../../../lib/leaveGuard';
import { errorText } from '../../../profile/bots/common';
import { currentProfile, getSession, openSettings } from '../../../profile/session';
import { openPanel } from '../../../store/nav';
import { runResources, type Problem, type ResourceEnv } from './resourceRunner';
import { INITIAL_TIMES, type BotProfile, type Mode, type Times } from './resourcesData';
import { resetEnergyLinks, type ResourceState } from './resourcesActions';

/** Что страница рисует: снимок состояния сбора. Снимок не меняется на месте, поэтому отрисовка не читает изменяемые объекты. */
export interface ResourceView {
	times: Times;
	hints: ResourceState['hints'];
	counts: Record<string, number>;
	/** Профили для «Собрать со всех» */
	profiles: BotProfile[];
	/** «Собирать со всех» дань гильдии */
	guildReward: boolean;
	wars: ResourceState['wars'];
	/** Данные показанного профиля получены хотя бы раз */
	synced: boolean;
}

const emptyState = (): ResourceState => ({ guildReward: false, wars: { start: null, end: null }, profiles: [], counts: {}, times: { ...INITIAL_TIMES }, hints: {} });

function snapshot(state: ResourceState, synced: boolean): ResourceView {
	return {
		times: { ...state.times, guildWars: state.times.guildWars && state.times.guildWars.map((war) => ({ ...war })) },
		hints: { ...state.hints },
		counts: { ...state.counts },
		profiles: [...state.profiles],
		guildReward: state.guildReward,
		wars: { ...state.wars },
		synced,
	};
}

/** Профиль, открытый на странице, как участник сбора. */
function shownProfile(): BotProfile {
	const profile = currentProfile();
	return { main: true, login: profile?.login || profile?.id || getSession().user?.id || '', auth: profile?.auth, server: profile?.server ?? 1 };
}

const sameAccount = (a: BotProfile, b: BotProfile) => String(a.login) === String(b.login) && a.server === b.server;

/** Остальные профили для «Собрать со всех»: основной (первый заполненный слот) — последним. */
function allProfiles(): BotProfile[] {
	const list: BotProfile[] = getSession()
		.profiles.filter((slot) => slot.id)
		.map((slot) => ({ main: false, login: slot.login || slot.id || '', auth: slot.auth, server: slot.server ?? 1 }));
	const first = list.shift();
	if (first) list.push(first);
	return list;
}

/**
 * Сбор ресурсов страницы «Ресурсы»: состояние карточек, запуск и защита от двойного запуска. Сбор идёт по одному: пока он не
 * закончился, новый не стартует (кнопки и так заблокированы, но между нажатием и перерисовкой их можно нажать дважды). Любая
 * ошибка заканчивается записью в лог и снятием блокировки: страница не остаётся навсегда в загрузке.
 */
export function useResourceBot() {
	const log = useBotLog();
	const { text: logText, message: logMessage } = log;
	const [view, setView] = useState<ResourceView>(() => snapshot(emptyState(), false));
	// Страница сразу начинает загрузку данных профиля
	const [loading, setLoading] = useState(true);
	// Сбор меняет данные игры: пока он идёт, закрытие вкладки на ПК и уход со страницы просят подтверждения (простое обновление не считается)
	const [acting, setActing] = useState(false);
	useLeaveGuard(acting);
	// Рабочее состояние меняют действия и таймеры; страница получает его только снимками
	const work = useRef(emptyState());
	const alive = useRef(true);
	const busy = useRef(false);

	const publish = useCallback(() => setView(snapshot(work.current, true)), []);
	const republish = useCallback(() => setView((current) => snapshot(work.current, current.synced)), []);

	const env = useMemo<ResourceEnv>(
		() => ({
			// Читается только во время сбора, не при отрисовке
			get state() {
				return work.current;
			},
			alive: () => alive.current,
			isShown: (profile) => profile.main || sameAccount(profile, shownProfile()),
			publish,
			logText,
			logMessage,
			problem: (kind: Problem, profile: BotProfile, detail?: unknown) => {
				if (!profile.main) {
					const reasons: Record<Problem, string> = {
						noauth: `На аккаунте ${profile.login} не указан пароль авторизации`,
						badauth: `Пароль авторизации игры неисправен на аккаунте ${profile.login}`,
						network: `Нет ответа от игры на аккаунте ${profile.login}`,
					};
					logText(reasons[kind], kind === 'network' ? 'red' : undefined);
					return;
				}
				// Нет ответа игры — это сбой связи, не повод менять пароль: остаёмся на странице
				if (kind === 'network') {
					notify({ text: 'Нет ответа от игры, попробуйте позже', icon: 'error' });
					logText('Нет ответа от игры', 'red');
					return;
				}
				const text = kind === 'noauth' ? 'Для продолжения работы необходимо указать пароль авторизации' : 'Пароль авторизации игры неисправен, введите новый';
				if (kind === 'badauth') notify({ text, icon: 'error' });
				openSettings(kind === 'badauth' ? { text, error: errorText(detail) } : { text });
				openPanel(null, { force: true });
			},
		}),
		[publish, logText, logMessage],
	);

	/** Сам сбор: замок `busy` уже взят вызывающим. Блокировку снимает всегда, что бы ни случилось. */
	const execute = useCallback(
		async (mode: Mode, action: string): Promise<boolean> => {
			work.current.profiles = allProfiles();
			try {
				return await runResources(env, mode, action, shownProfile());
			} catch (error) {
				logText(`Ошибка при сборе: ${error instanceof Error ? error.message : 'неизвестная'}`, 'red');
				return false;
			} finally {
				busy.current = false;
				if (alive.current) {
					setLoading(false);
					setActing(false);
				}
			}
		},
		[env, logText],
	);

	/** Запустить сбор. true — сбор выполнен; false — не начался (идёт другой) или профиль подготовить не удалось. */
	const start = useCallback(
		(mode: Mode = '', action = ''): Promise<boolean> => {
			if (busy.current) return Promise.resolve(false);
			busy.current = true;
			setLoading(true);
			if (mode) setActing(true);
			return execute(mode, action);
		},
		[execute],
	);

	useEffect(() => {
		alive.current = true;
		const state = work.current;
		// Первая загрузка: страница уже в состоянии «загрузка» (см. useState), поэтому состояние здесь не меняется
		if (!busy.current) {
			busy.current = true;
			void execute('', '');
		}
		// Таймеры карточек идут каждую секунду
		const timer = setInterval(() => {
			let changed = false;
			for (const key of ['chest', 'pet', 'lottery', 'guildBuilds'] as const) {
				const value = state.times[key];
				if (typeof value === 'number' && value > 0) {
					state.times[key] = value - 1;
					changed = true;
				}
			}
			if (changed) republish();
		}, 1000);
		return () => {
			alive.current = false;
			resetEnergyLinks();
			clearInterval(timer);
		};
	}, [execute, republish]);

	const setGuildReward = useCallback(
		(value: boolean) => {
			work.current.guildReward = value;
			republish();
		},
		[republish],
	);
	/** Номер набега, с которого (`start`) или до которого (`end`) собирается награда. */
	const setWar = useCallback(
		(field: 'start' | 'end', value: number) => {
			work.current.wars[field] = value;
			republish();
		},
		[republish],
	);

	return { view, loading, log, start, setGuildReward, setWar };
}
