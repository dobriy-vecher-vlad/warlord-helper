import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBotRunner } from './useBotRunner';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Runner = ReturnType<typeof useBotRunner>;

describe('useBotRunner', () => {
	let root: Root;
	let runner: Runner;
	const onPause = vi.fn();
	const onStopped = vi.fn();

	function Probe() {
		runner = useBotRunner({ onPause, onStopped });
		return null;
	}

	beforeEach(async () => {
		onPause.mockReset();
		onStopped.mockReset();
		root = createRoot(document.createElement('div'));
		await act(async () => root.render(<Probe />));
	});
	afterEach(() => act(() => root.unmount()));

	it('запуск нельзя начать дважды', () => {
		act(() => expect(runner.beginStart()).toBe(true));
		act(() => expect(runner.beginStart()).toBe(false));
		expect(runner.starting).toBe(true);
	});

	it('«Остановить» во время запуска отменяет запуск и завершает остановку', () => {
		act(() => void runner.beginStart());
		act(() => runner.pause());
		expect(onPause).toHaveBeenCalledTimes(1);
		expect(runner.flags.startCancelled).toBe(true);
		expect(onStopped).not.toHaveBeenCalled();
		act(() => expect(runner.abortStart()).toBe(true));
		expect(onStopped).toHaveBeenCalledTimes(1);
		expect(runner.starting).toBe(false);
	});

	it('ошибка запуска без отмены не вызывает остановку', () => {
		act(() => void runner.beginStart());
		act(() => expect(runner.abortStart()).toBe(false));
		expect(onStopped).not.toHaveBeenCalled();
		expect(runner.starting).toBe(false);
	});

	it('успешный запуск: бот работает, признак запуска снят', () => {
		act(() => void runner.beginStart());
		act(() => runner.markStarted());
		expect(runner.running).toBe(true);
		expect(runner.starting).toBe(false);
		expect(runner.flags.start).toBe(true);
		act(() => runner.markFinished());
		expect(runner.running).toBe(false);
		expect(runner.flags.start).toBe(false);
	});

	it('«Остановить» вне цикла останавливает сразу', () => {
		act(() => runner.pause());
		expect(onStopped).toHaveBeenCalledTimes(1);
		expect(runner.flags.start).toBe(false);
	});

	it('«Остановить» во время цикла ждёт конца текущего действия', async () => {
		act(() => void runner.beginStart());
		act(() => runner.markStarted());
		let finish!: () => void;
		const action = new Promise<void>((resolve) => (finish = resolve));
		let done: Promise<void> = Promise.resolve();
		act(() => {
			done = runner.runLoop(() => action);
		});
		expect(runner.flags.looping).toBe(true);
		act(() => runner.pause());
		expect(onStopped).not.toHaveBeenCalled();
		expect(runner.flags.pausePending).toBe(true);
		await act(async () => {
			finish();
			await done;
		});
		expect(onStopped).toHaveBeenCalledTimes(1);
		expect(runner.flags.looping).toBe(false);
		expect(runner.flags.pausePending).toBe(false);
		expect(runner.running).toBe(false);
	});

	it('цикл без остановки не вызывает onStopped', async () => {
		act(() => void runner.beginStart());
		act(() => runner.markStarted());
		await act(async () => runner.runLoop(async () => undefined));
		expect(onStopped).not.toHaveBeenCalled();
		expect(runner.flags.looping).toBe(false);
	});

	it('после ухода со страницы бот считается остановленным', async () => {
		act(() => void runner.beginStart());
		act(() => runner.markStarted());
		const { flags } = runner;
		await act(async () => root.unmount());
		expect(flags.mounted).toBe(false);
		expect(flags.start).toBe(false);
		root = createRoot(document.createElement('div'));
	});
});
