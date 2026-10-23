import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNav, initNav } from '../store/nav';
import { useDeepLink } from './deepLink';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ link, onOpen }: { link: string; onOpen: () => void }) {
	useDeepLink(link, onOpen);
	return null;
}

describe('useDeepLink', () => {
	let root: Root;

	beforeEach(() => {
		root = createRoot(document.createElement('div'));
	});
	afterEach(() => act(() => root.unmount()));

	it('вызывает действие один раз, когда ключ совпал с modal из ссылки', async () => {
		initNav({ view: 'map', panel: '4', modal: '21' });
		const open = vi.fn();
		await act(async () => root.render(<Probe link="21" onOpen={open} />));
		expect(open).toHaveBeenCalledTimes(1);
		expect(getNav().pendingModal).toBeNull();
		// Новый обработчик на следующей отрисовке не вызывает действие повторно
		await act(async () => root.render(<Probe link="21" onOpen={() => open()} />));
		expect(open).toHaveBeenCalledTimes(1);
	});

	it('другой ключ не срабатывает и ссылку не расходует', async () => {
		initNav({ view: 'map', panel: '4', modal: '21' });
		const open = vi.fn();
		await act(async () => root.render(<Probe link="7" onOpen={open} />));
		expect(open).not.toHaveBeenCalled();
		expect(getNav().pendingModal).toBe('21');
	});

	it('без окна в ссылке ничего не делает', async () => {
		initNav({ view: 'map', panel: '4' });
		const open = vi.fn();
		await act(async () => root.render(<Probe link="1" onOpen={open} />));
		expect(open).not.toHaveBeenCalled();
	});
});
