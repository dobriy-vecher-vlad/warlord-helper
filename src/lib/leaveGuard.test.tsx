import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerLeave, getLeaveRequest, guardedLeave, useLeaveGuard } from './leaveGuard';
import { backModal, backModalIf, closeModal, getModalStack, openModal } from '../store/modal';
import { getNav, initNav, openPanel } from '../store/nav';
import { flush, installBrowserStubs, render } from '../test/harness';

installBrowserStubs();

function Probe({ active, modal = null, onLeave }: { active: boolean; modal?: string | null; onLeave?: () => void }) {
	useLeaveGuard(active, modal, onLeave);
	return null;
}

afterEach(() => {
	// Открытый вопрос не должен переходить в следующий тест
	answerLeave(false);
	vi.restoreAllMocks();
	closeModal();
});

describe('защита от ухода во время работы', () => {
	it('без активных действий уход выполняется сразу, вопрос не открывается', async () => {
		await render(<Probe active={false} />);
		const go = vi.fn();
		guardedLeave(go);
		expect(go).toHaveBeenCalledTimes(1);
		expect(getLeaveRequest()).toBeNull();
	});

	it('с активным действием открывается вопрос; отказ оставляет на месте, согласие вызывает onLeave и уход', async () => {
		const left = vi.fn();
		await render(<Probe active onLeave={left} />);
		const go = vi.fn();
		guardedLeave(go);
		expect(getLeaveRequest()).not.toBeNull();
		expect(go).not.toHaveBeenCalled();
		answerLeave(false);
		expect(getLeaveRequest()).toBeNull();
		expect(go).not.toHaveBeenCalled();
		expect(left).not.toHaveBeenCalled();
		guardedLeave(go);
		answerLeave(true);
		expect(go).toHaveBeenCalledTimes(1);
		expect(left).toHaveBeenCalledTimes(1);
		expect(getLeaveRequest()).toBeNull();
	});

	it('пока вопрос открыт, новые запросы на уход игнорируются', async () => {
		await render(<Probe active />);
		const first = vi.fn();
		const second = vi.fn();
		guardedLeave(first);
		guardedLeave(second);
		answerLeave(true);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).not.toHaveBeenCalled();
	});

	it('закрытие вкладки перехватывается системным окном браузера, пока действие идёт', async () => {
		await render(<Probe active />);
		const event = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('переход внутри приложения ждёт ответа; force и закрытие чужого окна вопроса не открывают', async () => {
		initNav({ view: 'profile' });
		await render(<Probe active />);
		openPanel('1');
		expect(getNav().panel).toBeNull();
		expect(getLeaveRequest()).not.toBeNull();
		answerLeave(false);
		expect(getNav().panel).toBeNull();
		openPanel('1');
		answerLeave(true);
		expect(getNav().panel).toBe('1');
		openPanel('2', { force: true });
		expect(getNav().panel).toBe('2');
		expect(getLeaveRequest()).toBeNull();
		openModal('alert', {}, 1);
		backModal();
		expect(getLeaveRequest()).toBeNull();
		expect(getModalStack()).toHaveLength(0);
	});

	it('закрытие защищённого окна ждёт согласия', async () => {
		await render(<Probe active modal="killAll" />);
		openModal('killAll', {}, 2);
		backModal();
		expect(getModalStack()).toHaveLength(1);
		expect(getLeaveRequest()).not.toBeNull();
		answerLeave(false);
		expect(getModalStack()).toHaveLength(1);
		backModal();
		answerLeave(true);
		expect(getModalStack()).toHaveLength(0);
		await flush();
	});

	it('окно закрывается без вопроса, когда его закрывает само приложение (backModalIf), даже если страж ещё не снят', async () => {
		await render(<Probe active modal="create" />);
		openModal('create', {}, 3);
		backModalIf('create');
		expect(getLeaveRequest()).toBeNull();
		expect(getModalStack()).toHaveLength(0);
	});

	it('на телефоне вопрос тоже открывается (окном Alert), а закрытие вкладки не перехватывается', async () => {
		document.documentElement.dataset.layout = 'mobile';
		try {
			const left = vi.fn();
			await render(<Probe active modal="killAll" onLeave={left} />);
			const go = vi.fn();
			guardedLeave(go);
			expect(getLeaveRequest()).not.toBeNull();
			answerLeave(true);
			expect(go).toHaveBeenCalledTimes(1);
			expect(left).toHaveBeenCalled();
			const event = new Event('beforeunload', { cancelable: true });
			window.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		} finally {
			delete document.documentElement.dataset.layout;
		}
	});
});
