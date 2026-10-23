import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeModal, openModal } from '../store/modal';
import { getNav, initNav, openStory } from '../store/nav';
import { startUrlSync } from './urlSync';

/** Изменения адреса записываются в микрозадаче: дожидаемся её. */
const flush = () => Promise.resolve();

describe('urlSync', () => {
	let stop: () => void;

	beforeEach(() => {
		window.history.replaceState(null, '', '/');
		closeModal();
		initNav({});
		stop = startUrlSync();
	});
	afterEach(() => stop());

	it('записывает раздел, подраздел и окно в адрес', async () => {
		initNav({ view: 'map', panel: '3' });
		await flush();
		expect(window.location.hash).toBe('#view=map&panel=3');

		openModal('description', { link: '12' }, 'description');
		await flush();
		expect(window.location.hash).toBe('#view=map&panel=3&modal=12');

		closeModal();
		await flush();
		expect(window.location.hash).toBe('#view=map&panel=3');
	});

	it('главная панель раздела записывается без panel, главная страница — без параметров', async () => {
		initNav({ view: 'arena' });
		await flush();
		expect(window.location.hash).toBe('#view=arena');
		openStory('home');
		await flush();
		expect(window.location.hash).toBe('');
	});

	it('страницу 404 не трогает: видно, какая ссылка не открылась', async () => {
		window.history.replaceState(null, '', '/#view=map&panel=99');
		initNav({ view: 'map', panel: '99' });
		await flush();
		expect(getNav().notFound).toBe(true);
		expect(window.location.hash).toBe('#view=map&panel=99');
	});

	it('адрес, исправленный вручную, открывает записанный в нём раздел', async () => {
		window.location.hash = '#view=guild&panel=2';
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(getNav()).toMatchObject({ story: 'guild', panel: '2' });
	});
});
