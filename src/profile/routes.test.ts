import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeModal, getModalStack } from '../store/modal';
import { getNav, initNav } from '../store/nav';
import { installRouteRules } from './routes';
import { setSession } from './session';

describe('доступ к «Магазину» по подписке', () => {
	beforeEach(() => {
		installRouteRules();
		setSession({ status: 'ready' });
	});
	afterEach(() => {
		while (getModalStack().length) closeModal();
	});

	it('без подписки магазин по ссылке не открывается: остаётся главная профиля и окно подписки', () => {
		setSession({ isDonut: false });
		initNav({ view: 'profile', panel: '1' });
		expect(getNav().panel).toBeNull();
		expect(getModalStack().at(-1)?.id).toBe('donut');
	});

	it('с подпиской магазин открывается', () => {
		setSession({ isDonut: true });
		initNav({ view: 'profile', panel: '1' });
		expect(getNav().panel).toBe('1');
		expect(getModalStack()).toHaveLength(0);
	});

	it('главная профиля открыта без подписки', () => {
		setSession({ isDonut: false });
		initNav({ view: 'profile' });
		expect(getNav().story).toBe('profile');
		expect(getModalStack()).toHaveLength(0);
	});
});
