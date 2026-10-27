import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEAVE_TEXT, confirmLeave, useLeaveGuard } from './leaveGuard';
import { backModal, backModalIf, closeModal, getModalStack, openModal } from '../store/modal';
import { getNav, initNav, openPanel } from '../store/nav';
import { flush, installBrowserStubs, render } from '../test/harness';

installBrowserStubs();

function Probe({ active, modal = null, onLeave }: { active: boolean; modal?: string | null; onLeave?: () => void }) {
	useLeaveGuard(active, modal, onLeave);
	return null;
}

afterEach(() => {
	vi.restoreAllMocks();
	closeModal();
});

describe('защита от ухода во время работы', () => {
	it('без активных действий уходить можно, подтверждение не спрашивается', async () => {
		const ask = vi.spyOn(window, 'confirm');
		await render(<Probe active={false} />);
		expect(confirmLeave()).toBe(true);
		expect(ask).not.toHaveBeenCalled();
	});

	it('с активным действием спрашивается стандартный текст; отказ оставляет на месте, согласие отпускает и вызывает onLeave', async () => {
		const left = vi.fn();
		await render(<Probe active onLeave={left} />);
		const ask = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
		expect(confirmLeave()).toBe(false);
		expect(left).not.toHaveBeenCalled();
		expect(confirmLeave()).toBe(true);
		expect(left).toHaveBeenCalledTimes(1);
		expect(ask).toHaveBeenCalledWith(LEAVE_TEXT);
	});

	it('закрытие вкладки перехватывается системным окном, пока действие идёт', async () => {
		await render(<Probe active />);
		const event = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('переход внутри приложения просит подтверждения; force и закрытие чужого окна — нет', async () => {
		initNav({ view: 'profile' });
		await render(<Probe active />);
		const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
		openPanel('1');
		expect(getNav().panel).toBeNull();
		expect(ask).toHaveBeenCalledTimes(1);
		openPanel('1', { force: true });
		expect(getNav().panel).toBe('1');
		ask.mockClear();
		openModal('alert', {}, 1);
		backModal();
		expect(ask).not.toHaveBeenCalled();
		expect(getModalStack()).toHaveLength(0);
	});

	it('закрытие защищённого окна просит подтверждения, согласие закрывает', async () => {
		await render(<Probe active modal="killAll" />);
		openModal('killAll', {}, 2);
		const ask = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
		backModal();
		expect(getModalStack()).toHaveLength(1);
		backModal();
		expect(getModalStack()).toHaveLength(0);
		expect(ask).toHaveBeenCalledTimes(2);
		await flush();
	});

	it('окно закрывается без вопроса, когда его закрывает само приложение (backModalIf), даже если страж ещё не снят', async () => {
		await render(<Probe active modal="create" />);
		openModal('create', {}, 3);
		const ask = vi.spyOn(window, 'confirm');
		backModalIf('create');
		expect(ask).not.toHaveBeenCalled();
		expect(getModalStack()).toHaveLength(0);
	});
});
