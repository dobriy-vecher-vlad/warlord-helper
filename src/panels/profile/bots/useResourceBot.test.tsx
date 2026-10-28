import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../../api/game';
import { closeModal, getModalStack } from '../../../store/modal';
import { setSession } from '../../../profile/session';
import { flush, installBrowserStubs, render } from '../../../test/harness';
import { useResourceBot } from './useResourceBot';

vi.mock('../../../api/game', () => ({ getGame: vi.fn() }));

installBrowserStubs();

type Bot = ReturnType<typeof useResourceBot>;
let bot: Bot;

function Probe() {
	bot = useResourceBot();
	return null;
}

const profileReply = { u: { _id: '5', _clan_id: '0', _va: '0', _pet: '0', _lott: '30' } };
const game = vi.mocked(getGame);

beforeEach(() => {
	game.mockReset();
	setSession({ profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }], index: 0, user: { id: 10 } as never });
});
afterEach(() => closeModal());

describe('useResourceBot', () => {
	it('при открытии страницы данные профиля загружаются, загрузка заканчивается', async () => {
		game.mockResolvedValue(profileReply);
		await render(<Probe />);
		await flush();
		expect(bot.loading).toBe(false);
		expect(bot.view.synced).toBe(true);
	});

	it('сбор не стартует, пока идёт другой: двойное нажатие не запускает два сбора', async () => {
		game.mockImplementation(async (_server, body) => (Object.keys(body ?? {}).length === 0 ? profileReply : { res: { _val: 1 } }));
		await render(<Probe />);
		await flush();
		game.mockClear();
		let first!: Promise<boolean>;
		let second!: Promise<boolean>;
		await act(async () => {
			first = bot.start('daily', 'collect');
			second = bot.start('daily', 'collect');
			await Promise.all([first, second]);
		});
		expect(await second).toBe(false);
		expect(await first).toBe(true);
		// Один сбор: профиль, ежедневная награда, обновление профиля
		expect(game).toHaveBeenCalledTimes(3);
	});

	it('сбой посреди сбора не оставляет страницу в загрузке: блокировка снимается, ошибка попадает в лог', async () => {
		game.mockResolvedValue(profileReply);
		await render(<Probe />);
		await flush();
		game.mockRejectedValue(new Error('boom'));
		await act(async () => {
			expect(await bot.start('daily', 'collect')).toBe(false);
		});
		expect(bot.loading).toBe(false);
		expect(bot.log.entries.some((entry) => entry.type === 'text' && entry.message.includes('Ошибка при сборе: boom'))).toBe(true);
		// После сбоя сбор снова можно запустить
		game.mockResolvedValue(profileReply);
		await act(async () => {
			expect(await bot.start()).toBe(true);
		});
	});

	it('нет ответа игры: настройки профиля не открываются', async () => {
		game.mockResolvedValue(null);
		await render(<Probe />);
		await flush();
		expect(getModalStack()).toHaveLength(0);
		expect(bot.loading).toBe(false);
		expect(bot.view.synced).toBe(false);
	});

	it('игра ответила без персонажа: открываются настройки профиля с ошибкой авторизации', async () => {
		game.mockResolvedValue({ err_msg: 'bad auth' });
		await render(<Probe />);
		await flush();
		expect(getModalStack().map((entry) => entry.id)).toEqual(['settings']);
	});

	it('таблички вида меняются снимками: старый снимок не изменяется на месте', async () => {
		game.mockResolvedValue(profileReply);
		await render(<Probe />);
		await flush();
		const before = bot.view;
		await act(async () => bot.setGuildReward(true));
		expect(bot.view).not.toBe(before);
		expect(before.guildReward).toBe(false);
		expect(bot.view.guildReward).toBe(true);
	});
});
