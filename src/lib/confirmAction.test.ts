import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerConfirm, askConfirm, getConfirm } from './confirmAction';

afterEach(() => answerConfirm(false));

const options = (onConfirm: () => void) => ({ title: 'Удалить?', confirm: 'Удалить', destructive: true, onConfirm });

describe('подтверждение действия', () => {
	it('вопрос открывается; отказ ничего не делает, согласие выполняет действие', () => {
		const done = vi.fn();
		askConfirm(options(done));
		expect(getConfirm()?.title).toBe('Удалить?');
		answerConfirm(false);
		expect(getConfirm()).toBeNull();
		expect(done).not.toHaveBeenCalled();
		askConfirm(options(done));
		answerConfirm(true);
		expect(done).toHaveBeenCalledTimes(1);
		expect(getConfirm()).toBeNull();
	});

	it('пока вопрос открыт, новый игнорируется; повторный ответ ничего не делает', () => {
		const first = vi.fn();
		const second = vi.fn();
		askConfirm(options(first));
		askConfirm(options(second));
		answerConfirm(true);
		answerConfirm(true);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).not.toHaveBeenCalled();
	});
});
