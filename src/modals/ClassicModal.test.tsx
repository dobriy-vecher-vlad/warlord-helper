import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { installBrowserStubs, render } from '../test/harness';
import { ModalSubmit } from './ClassicModal';

installBrowserStubs();

describe('ModalSubmit', () => {
	it('«Готово» подписано словом на любом экране, а не галочкой, и нажимается', async () => {
		for (const layout of ['mobile', 'desktop']) {
			document.documentElement.dataset.layout = layout;
			const onClick = vi.fn();
			const container = await render(<ModalSubmit onClick={onClick} />);
			const button = [...container.querySelectorAll('button, [role="button"]')].find((node) => node.textContent?.includes('Готово'));
			expect(button, layout).toBeTruthy();
			expect(button!.querySelector('svg'), layout).toBeNull();
			await act(async () => void (button as HTMLElement).click());
			expect(onClick, layout).toHaveBeenCalledTimes(1);
		}
	});
});
