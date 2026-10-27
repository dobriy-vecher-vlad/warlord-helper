import { beforeEach, describe, expect, it } from 'vitest';
import { consumePendingModal, getNav, initNav, openPanel, openStory, setRouteRules, showNotFound } from './nav';

describe('nav', () => {
	beforeEach(() => initNav({}));

	it('без view открывается главная', () => {
		expect(getNav()).toEqual({ story: 'home', panel: null, pendingModal: null, notFound: false });
	});
	it('ссылка с view, panel и modal', () => {
		initNav({ view: 'map', panel: '4', modal: '21' });
		expect(getNav()).toEqual({ story: 'map', panel: '4', pendingModal: '21', notFound: false });
	});
	it('modal без panel игнорируется', () => {
		initNav({ view: 'map', modal: '21' });
		expect(getNav().pendingModal).toBeNull();
	});
	it('panel с id раздела — главная панель раздела', () => {
		initNav({ view: 'map', panel: 'map' });
		expect(getNav()).toEqual({ story: 'map', panel: null, pendingModal: null, notFound: false });
	});
	it('неизвестный view -> 404', () => {
		initNav({ view: 'nope', panel: '1' });
		expect(getNav().notFound).toBe(true);
	});
	it('неизвестный panel -> 404', () => {
		initNav({ view: 'map', panel: '99', modal: '1' });
		expect(getNav()).toMatchObject({ panel: null, pendingModal: null, notFound: true });
	});
	it('ещё не перенесённый раздел -> 404', () => {
		initNav({ view: 'profile' });
		expect(getNav().notFound).toBe(true);
	});
	it('неизвестное окно -> 404, переход уводит со страницы 404', () => {
		initNav({ view: 'map', panel: '4', modal: '999' });
		showNotFound();
		expect(getNav()).toMatchObject({ pendingModal: null, notFound: true });
		openStory('home');
		expect(getNav().notFound).toBe(false);
	});
	it('переход в раздел сбрасывает подраздел и отложенное окно', () => {
		initNav({ view: 'map', panel: '4', modal: '21' });
		openStory('arena');
		expect(getNav()).toEqual({ story: 'arena', panel: null, pendingModal: null, notFound: false });
	});
	it('переход в неперенесённый раздел -> 404', () => {
		openStory('rating');
		expect(getNav().notFound).toBe(true);
	});
	it('openPanel и consumePendingModal', () => {
		initNav({ view: 'map', panel: '4', modal: '21' });
		consumePendingModal();
		expect(getNav().pendingModal).toBeNull();
		openPanel('2');
		expect(getNav().panel).toBe('2');
	});

	it('закрытый подпиской подраздел по ссылке не открывается, открывается главная панель раздела', () => {
		const asked: string[] = [];
		setRouteRules({
			available: () => true,
			allowed: (story, panel) => {
				asked.push(`${story}/${panel}`);
				return panel !== '4';
			},
		});
		initNav({ view: 'map', panel: '4', modal: '21' });
		expect(getNav()).toEqual({ story: 'map', panel: null, pendingModal: null, notFound: false });
		expect(asked).toEqual(['map/4']);
		initNav({ view: 'map', panel: '1' });
		expect(getNav().panel).toBe('1');
		setRouteRules({ available: (story) => story !== 'profile' && story !== 'rating', allowed: () => true });
	});
});
