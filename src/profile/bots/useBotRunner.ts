import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Признаки состояния бота. Читаются из длинных циклов, которые держат старую копию состояния React,
 * поэтому лежат в обычном объекте, а не в состоянии компонента.
 */
export interface RunFlags {
	/** Страница открыта: после ухода с неё бот не должен ничего делать */
	mounted: boolean;
	/** Бот запущен и не остановлен: пока true, цикл продолжает работу */
	start: boolean;
	/** Идёт запуск (загрузка данных перед первым действием) */
	starting: boolean;
	/** «Остановить» нажали во время запуска: запуск отменяется на ближайшем шаге */
	startCancelled: boolean;
	/** Идёт цикл действий */
	looping: boolean;
	/** «Остановить» нажали во время действия: остановка завершится, когда оно закончится */
	pausePending: boolean;
}

interface BotRunnerOptions {
	/** Остановку попросили: записать в лог */
	onPause: () => void;
	/** Бот остановлен окончательно: вернуть кнопки в обычное состояние и обновить данные */
	onStopped: () => void;
}

/**
 * Запуск и остановка бота, общие для арены и рейдов.
 *
 * Состояния: ждёт → запуск (`beginStart`) → цикл (`markStarted`, `runLoop`) → ждёт. «Остановить» (`pause`) действует по-разному:
 * во время запуска он отменяется, во время цикла бот заканчивает начатое действие, вне цикла остановка сразу окончательная.
 */
export function useBotRunner({ onPause, onStopped }: BotRunnerOptions) {
	const [flags] = useState<RunFlags>(() => ({ mounted: true, start: false, starting: false, startCancelled: false, looping: false, pausePending: false }));
	const [running, setRunning] = useState(false);
	const [starting, setStarting] = useState(false);
	const [pausing, setPausing] = useState(false);
	const callbacks = useRef({ onPause, onStopped });
	useEffect(() => {
		callbacks.current = { onPause, onStopped };
	});

	useEffect(() => {
		flags.mounted = true;
		return () => {
			flags.mounted = false;
			flags.start = false;
		};
	}, [flags]);

	/** Бот остановлен окончательно. */
	const finishPause = useCallback(() => {
		setRunning(false);
		setPausing(false);
		callbacks.current.onStopped();
	}, []);

	/** Остановить: новые действия не начинаются. */
	const pause = useCallback(() => {
		flags.start = false;
		callbacks.current.onPause();
		if (flags.starting) flags.startCancelled = true;
		else if (flags.looping) flags.pausePending = true;
		else finishPause();
	}, [flags, finishPause]);

	/** Начать запуск; false — бот уже запускается или работает. */
	const beginStart = useCallback(() => {
		if (flags.starting || flags.looping) return false;
		flags.starting = true;
		flags.startCancelled = false;
		setStarting(true);
		return true;
	}, [flags]);

	/** Запуск закончился без цикла (ошибка или отмена). Возвращает true, если его отменили кнопкой «Остановить». */
	const abortStart = useCallback(() => {
		const cancelled = flags.startCancelled;
		flags.starting = false;
		flags.startCancelled = false;
		setStarting(false);
		if (cancelled && flags.mounted) finishPause();
		return cancelled;
	}, [flags, finishPause]);

	/** Запуск удался: бот работает. */
	const markStarted = useCallback(() => {
		flags.start = true;
		flags.starting = false;
		setRunning(true);
		setStarting(false);
		setPausing(false);
	}, [flags]);

	/** Бот сам выполнил всё, что должен: остановлен без кнопки «Остановить». */
	const markFinished = useCallback(() => {
		flags.start = false;
		setRunning(false);
	}, [flags]);

	/** Выполнить цикл действий. Если во время него нажали «Остановить», после последнего действия остановка завершается. */
	const runLoop = useCallback(
		async (loop: () => Promise<void>) => {
			flags.looping = true;
			try {
				await loop();
			} finally {
				flags.looping = false;
				if (flags.pausePending) {
					flags.pausePending = false;
					if (flags.mounted) finishPause();
				}
			}
		},
		[flags, finishPause],
	);

	return { flags, running, starting, pausing, setPausing, pause, finishPause, beginStart, abortStart, markStarted, markFinished, runLoop };
}
