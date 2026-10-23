import { beforeEach, describe, expect, it } from 'vitest';
import { backModal, closeModal, getModalStack, openModal } from './modal';
import { createStore } from './createStore';

const keys = () => getModalStack().map((entry) => entry.key);

describe('createStore', () => {
	it('уведомляет подписчиков и позволяет отписаться', () => {
		const store = createStore({ n: 0 });
		let calls = 0;
		const off = store.subscribe(() => calls++);
		store.set({ n: 1 });
		off();
		store.set({ n: 2 });
		expect(calls).toBe(1);
		expect(store.get().n).toBe(2);
	});
});

describe('стек модальных окон', () => {
	beforeEach(() => closeModal());

	it('новое окно ложится поверх предыдущего', () => {
		openModal('description', { a: 1 }, 1);
		openModal('item', {}, 2);
		expect(keys()).toEqual([1, 2]);
	});
	it('назад возвращает к предыдущему окну, а из последнего закрывает', () => {
		openModal('description', {}, 1);
		openModal('item', {}, 2);
		backModal();
		expect(keys()).toEqual([1]);
		backModal();
		expect(getModalStack()).toEqual([]);
	});
	it('повторное открытие окна с тем же ключом обрезает стек до него и обновляет данные', () => {
		openModal('description', { a: 1 }, 1);
		openModal('item', {}, 2);
		openModal('description', { a: 2 }, 1);
		expect(keys()).toEqual([1]);
		expect(getModalStack()[0]!.data).toEqual({ a: 2 });
	});
	it('closeModal очищает стек', () => {
		openModal('alert', {}, 5);
		closeModal();
		expect(getModalStack()).toEqual([]);
	});
});
