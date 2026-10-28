import { useCallback, useEffect, useRef, useState } from 'react';
import { useLeaveGuard } from '../../lib/leaveGuard';

/**
 * Признаки состояния бота. Читаются из длинных циклов, которые держат старую копию состояния React, поэтому лежат в обычном
 * объекте, а не в состоянии компонента. Меняются только его методами: так переходы между состояниями описаны в одном месте.
 */
export class RunFlags {
	/** Страница открыта: после ухода с неё бот не должен ничего делать */
	mounted = true;
	/** Бот запущен и не остановлен: пока true, цикл продолжает работу */
	start = false;
	/** Идёт запуск (загрузка данных перед первым действием) */
	starting = false;
	/** «Остановить» нажали во время запуска: запуск отменяется на ближайшем шаге */
	startCancelled = false;
	/** Идёт цикл действий */
	looping = false;
	/** «Остановить» нажали во время действия: остановка завершится, когда оно закончится */
	pausePending = false;

	/** Страница открыта. */
	mount() {
		this.mounted = true;
	}

	/** Страница закрыта: бот останавливается. */
	unmount() {
		this.mounted = false;
		this.start = false;
	}

	/** Новые действия не начинаются (бот остановлен или закончил всё, что должен). */
	stop() {
		this.start = false;
	}

	/** «Остановить» нажали: запуск отменяется, цикл заканчивает действие, иначе остановка сразу окончательная. Возвращает true в последнем случае. */
	requestPause(): boolean {
		this.start = false;
		if (this.starting) this.startCancelled = true;
		else if (this.looping) this.pausePending = true;
		else return true;
		return false;
	}

	/** Начать запуск; false — бот уже запускается или работает. */
	beginStart(): boolean {
		if (this.starting || this.looping) return false;
		this.starting = true;
		this.startCancelled = false;
		return true;
	}

	/** Запуск закончился без цикла. Возвращает true, если его отменили кнопкой «Остановить». */
	endStart(): boolean {
		const cancelled = this.startCancelled;
		this.starting = false;
		this.startCancelled = false;
		return cancelled;
	}

	/** Запуск удался: бот работает. */
	started() {
		this.start = true;
		this.starting = false;
	}

	beginLoop() {
		this.looping = true;
	}

	/** Цикл закончился. Возвращает true, если во время него нажали «Остановить»: остановку нужно завершить. */
	endLoop(): boolean {
		this.looping = false;
		const pending = this.pausePending;
		this.pausePending = false;
		return pending;
	}
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
	const [flags] = useState(() => new RunFlags());
	const [running, setRunning] = useState(false);
	const [starting, setStarting] = useState(false);
	const [pausing, setPausing] = useState(false);
	// Уход со страницы остановил бы бота: закрытие вкладки и переход просят подтверждения
	useLeaveGuard(running || starting);
	const callbacks = useRef({ onPause, onStopped });
	useEffect(() => {
		callbacks.current = { onPause, onStopped };
	});

	useEffect(() => {
		flags.mount();
		return () => flags.unmount();
	}, [flags]);

	/** Бот остановлен окончательно. */
	const finishPause = useCallback(() => {
		setRunning(false);
		setPausing(false);
		callbacks.current.onStopped();
	}, []);

	/** Остановить: новые действия не начинаются. */
	const pause = useCallback(() => {
		const finished = flags.requestPause();
		callbacks.current.onPause();
		if (finished) finishPause();
	}, [flags, finishPause]);

	/** Начать запуск; false — бот уже запускается или работает. */
	const beginStart = useCallback(() => {
		if (!flags.beginStart()) return false;
		setStarting(true);
		return true;
	}, [flags]);

	/** Запуск закончился без цикла (ошибка или отмена). Возвращает true, если его отменили кнопкой «Остановить». */
	const abortStart = useCallback(() => {
		const cancelled = flags.endStart();
		setStarting(false);
		if (cancelled && flags.mounted) finishPause();
		return cancelled;
	}, [flags, finishPause]);

	/** Запуск удался: бот работает. */
	const markStarted = useCallback(() => {
		flags.started();
		setRunning(true);
		setStarting(false);
		setPausing(false);
	}, [flags]);

	/** Бот сам выполнил всё, что должен: остановлен без кнопки «Остановить». */
	const markFinished = useCallback(() => {
		flags.stop();
		setRunning(false);
	}, [flags]);

	/** Выполнить цикл действий. Если во время него нажали «Остановить», после последнего действия остановка завершается. */
	const runLoop = useCallback(
		async (loop: () => Promise<void>) => {
			flags.beginLoop();
			try {
				await loop();
			} finally {
				if (flags.endLoop() && flags.mounted) finishPause();
			}
		},
		[flags, finishPause],
	);

	return { flags, running, starting, pausing, setPausing, pause, finishPause, beginStart, abortStart, markStarted, markFinished, runLoop };
}
