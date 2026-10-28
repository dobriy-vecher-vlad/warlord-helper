import { act, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { flush, installBrowserStubs, render } from '../test/harness';
import { useOnChange } from './useOnChange';

installBrowserStubs();

let renders = 0;
let setOpen!: (value: boolean) => void;
let key = '';

function Form() {
	const [open, setOpenState] = useState(false);
	const [value, setValue] = useState('');
	setOpen = setOpenState;
	// Каждое открытие сбрасывает поле
	useOnChange([open], () => {
		if (open) setValue('новое');
	});
	renders++;
	key = value;
	return <input value={value} onChange={(event) => setValue(event.target.value)} />;
}

describe('useOnChange', () => {
	it('при первой отрисовке ничего не делает', async () => {
		await render(<Form />);
		expect(key).toBe('');
	});

	it('при изменении значения правит состояние в той же отрисовке: старое значение на экране не мелькает', async () => {
		await render(<Form />);
		const before = renders;
		await act(async () => setOpen(true));
		await flush();
		expect(key).toBe('новое');
		// Один проход (с досрочным повтором React), а не отрисовка со старым значением и ещё одна после эффекта
		expect(renders - before).toBeLessThanOrEqual(2);
	});

	it('пока значения те же, не вмешивается: введённое пользователем остаётся', async () => {
		await render(<Form />);
		await act(async () => setOpen(true));
		const input = document.body.querySelector('input')!;
		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
			setter.call(input, 'своё');
			input.dispatchEvent(new Event('input', { bubbles: true }));
		});
		expect(key).toBe('своё');
	});
});
