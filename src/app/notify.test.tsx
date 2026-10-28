import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installBrowserStubs, render } from '../test/harness';
import { NotifyProvider, notify } from './notify';

installBrowserStubs();

const toast = () => document.body.querySelector<HTMLElement>('.vkuiSnackbar__host');
const inner = () => document.body.querySelector<HTMLElement>('.vkuiSnackbar__in')!;
// В jsdom нет AnimationEvent, и React слушает вендорные имена событий (в браузере — обычные)
const NAMES = { animationstart: 'webkitAnimationStart', animationend: 'webkitAnimationEnd' } as const;
const fire = (type: 'animationstart' | 'animationend') => inner().dispatchEvent(new Event('AnimationEvent' in window ? type : NAMES[type], { bubbles: true }));

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
afterEach(() => vi.useRealTimers());

describe('всплывающие сообщения', () => {
	it('обычное сообщение исчезает по времени', async () => {
		await render(<NotifyProvider>{null}</NotifyProvider>);
		await act(async () => notify({ text: 'готово', icon: 'done' }));
		expect(toast()).not.toBeNull();
		await act(async () => void (fire('animationstart'), undefined));
		await act(async () => void fire('animationend'));
		await act(async () => void vi.advanceTimersByTime(3100));
		await act(async () => void fire('animationstart'));
		await act(async () => void fire('animationend'));
		expect(toast()).toBeNull();
	});

	it('сообщение исчезает, даже если события анимации пришли подряд, пока страница была занята (гонка в VKUI)', async () => {
		await render(<NotifyProvider>{null}</NotifyProvider>);
		await act(async () => notify({ text: 'Убито 21 босс', icon: 'done' }));
		// Страница занята долгой перерисовкой: начало и конец анимации входа обрабатываются одной пачкой
		await act(async () => {
			fire('animationstart');
			fire('animationend');
		});
		await act(async () => void vi.advanceTimersByTime(10_000));
		// Выходная анимация идёт как обычно
		await act(async () => void fire('animationstart'));
		await act(async () => void fire('animationend'));
		expect(toast()).toBeNull();
	});
});
