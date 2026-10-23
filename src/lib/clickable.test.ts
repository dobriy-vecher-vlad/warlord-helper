import { describe, expect, it, vi } from 'vitest';
import { clickable } from './clickable';

describe('clickable', () => {
	it('без действия ничего не добавляет', () => {
		expect(clickable(undefined)).toEqual({});
	});

	it('даёт роль кнопки, фокус и срабатывание по Enter и пробелу', () => {
		const onClick = vi.fn();
		const props = clickable(onClick) as unknown as { role: string; tabIndex: number; onKeyDown: (event: { key: string; preventDefault: () => void }) => void };
		expect(props.role).toBe('button');
		expect(props.tabIndex).toBe(0);
		const preventDefault = vi.fn();
		props.onKeyDown({ key: 'Enter', preventDefault });
		props.onKeyDown({ key: ' ', preventDefault });
		props.onKeyDown({ key: 'a', preventDefault });
		expect(onClick).toHaveBeenCalledTimes(2);
		expect(preventDefault).toHaveBeenCalledTimes(2);
	});
});
