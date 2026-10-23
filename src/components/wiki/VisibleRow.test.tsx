import { act, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installBrowserStubs, render } from '../../test/harness';
import { VisibleRow } from './PickPanel';

installBrowserStubs();

/** Наблюдатель, которым тест сам решает, когда строка попала на экран. */
const observers: Array<{ callback: (entries: Array<{ isIntersecting: boolean }>) => void; disconnected: boolean }> = [];
class FakeObserver {
	state: (typeof observers)[number];
	constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
		this.state = { callback, disconnected: false };
		observers.push(this.state);
	}
	observe() {}
	unobserve() {}
	disconnect() {
		this.state.disconnected = true;
	}
}

describe('VisibleRow', () => {
	const original = globalThis.IntersectionObserver;
	beforeEach(() => {
		observers.length = 0;
		globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
	});
	afterEach(() => {
		globalThis.IntersectionObserver = original;
	});

	it('сообщает, когда строка попала на экран и когда ушла с него; повторный вход снова сообщает', async () => {
		const seen = vi.fn();
		const gone = vi.fn();
		await render(
			<VisibleRow onVisible={seen} onHidden={gone}>
				<span>строка</span>
			</VisibleRow>,
		);
		expect(seen).not.toHaveBeenCalled();
		const [observer] = observers;
		act(() => observer!.callback([{ isIntersecting: false }]));
		expect(seen).not.toHaveBeenCalled();
		expect(gone).not.toHaveBeenCalled();
		act(() => observer!.callback([{ isIntersecting: true }]));
		expect(seen).toHaveBeenCalledTimes(1);
		act(() => observer!.callback([{ isIntersecting: true }]));
		expect(seen).toHaveBeenCalledTimes(1);
		act(() => observer!.callback([{ isIntersecting: false }]));
		expect(gone).toHaveBeenCalledTimes(1);
		act(() => observer!.callback([{ isIntersecting: true }]));
		expect(seen).toHaveBeenCalledTimes(2);
	});

	it('строка убрана из списка, пока была видна: это тоже «ушла с экрана»', async () => {
		const seen = vi.fn();
		const gone = vi.fn();
		let remove = () => {};
		function Probe() {
			const [shown, setShown] = useState(true);
			remove = () => setShown(false);
			return shown ? (
				<VisibleRow onVisible={seen} onHidden={gone}>
					<span>строка</span>
				</VisibleRow>
			) : null;
		}
		await render(<Probe />);
		act(() => observers[0]!.callback([{ isIntersecting: true }]));
		expect(gone).not.toHaveBeenCalled();
		await act(async () => remove());
		expect(gone).toHaveBeenCalledTimes(1);
	});

	it('без поддержки IntersectionObserver строка считается видимой сразу', async () => {
		// @ts-expect-error интерфейс убран, чтобы проверить запасной путь
		delete globalThis.IntersectionObserver;
		const seen = vi.fn();
		await render(
			<VisibleRow onVisible={seen}>
				<span>строка</span>
			</VisibleRow>,
		);
		expect(seen).toHaveBeenCalledTimes(1);
	});
});
