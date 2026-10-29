import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { flush, installBrowserStubs, render } from '../../test/harness';
import { ProfileCarousel } from './ProfileCarousel';

installBrowserStubs();

/** В jsdom нет PointerEvent: событие собирается вручную с теми полями, которые читает карусель. */
function pointer(target: Element, type: string, props: { x?: number; y?: number } = {}) {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.assign(event, { button: 0, isPrimary: true, pointerId: 1, clientX: props.x ?? 0, clientY: props.y ?? 0 });
	return act(async () => void target.dispatchEvent(event));
}

const carousel = (onSelect: (index: number) => void, value = 1) => (
	<ProfileCarousel
		count={3}
		value={value}
		onSelect={onSelect}
		avatarWidth={35}
		avatar={(index) => <span data-testid={`avatar-${index}`}>{index}</span>}
		name={(index) => <span>{index}</span>}
	/>
);

describe('карусель профилей: нажатие на аватарку', () => {
	it('нажатие на соседнюю аватарку выбирает её, на текущую ничего не меняет', async () => {
		const onSelect = vi.fn();
		const container = await render(carousel(onSelect));
		const avatar = (index: number) => container.querySelector(`[data-testid="avatar-${index}"]`)!;

		await pointer(avatar(2), 'pointerdown', { x: 100, y: 10 });
		await pointer(avatar(2), 'pointerup', { x: 100, y: 10 });
		expect(onSelect).toHaveBeenCalledWith(2);

		onSelect.mockClear();
		await pointer(avatar(1), 'pointerdown');
		await pointer(avatar(1), 'pointerup');
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('отмена касания браузером и вертикальный жест не считаются нажатием', async () => {
		const onSelect = vi.fn();
		const container = await render(carousel(onSelect));
		const avatar = container.querySelector('[data-testid="avatar-0"]')!;

		await pointer(avatar, 'pointerdown');
		await pointer(avatar, 'pointercancel');
		await pointer(avatar, 'pointerdown', { x: 10, y: 10 });
		await pointer(avatar, 'pointermove', { x: 10, y: 40 });
		await pointer(avatar, 'pointerup', { x: 10, y: 40 });
		await flush();
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('с одним слотом карусель ничего не выбирает', async () => {
		const onSelect = vi.fn();
		const container = await render(
			<ProfileCarousel count={1} value={0} onSelect={onSelect} avatarWidth={35} avatar={() => <span data-testid="avatar-0" />} name={() => <span />} />,
		);
		const avatar = container.querySelector('[data-testid="avatar-0"]')!;
		await pointer(avatar, 'pointerdown');
		await pointer(avatar, 'pointerup');
		expect(onSelect).not.toHaveBeenCalled();
	});
});
