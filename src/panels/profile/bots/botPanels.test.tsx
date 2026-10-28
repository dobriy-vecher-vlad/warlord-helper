import type { ComponentType } from 'react';
import { View } from '@vkontakte/vkui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGame } from '../../../api/game';
import { setSession } from '../../../profile/session';
import { closeModal, getModalStack } from '../../../store/modal';
import { initNav } from '../../../store/nav';
import { button, click, flush, installBrowserStubs, render } from '../../../test/harness';
import { ArenaBotPanel } from './ArenaBotPanel';
import { RaidsBotPanel } from './RaidsBotPanel';
import { ResourcesBotPanel } from './ResourcesBotPanel';

vi.mock('../../../api/game', () => ({ getGame: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

const game = vi.mocked(getGame);

/** Страница целиком: как в приложении, внутри View, чтобы работали шапка и панель. */
async function show(Panel: ComponentType<{ id: string }>) {
	initNav({ view: 'profile', panel: 'bot' });
	const container = await render(
		<View id="bots" activePanel="bot">
			<Panel id="bot" />
		</View>,
	);
	return container;
}

/** Дать выполниться цепочке запросов и обновлений состояния. */
async function settle() {
	for (let step = 0; step < 8; step++) await flush();
}

const text = () => document.body.textContent ?? '';

beforeEach(() => {
	game.mockReset();
	localStorage.clear();
	setSession({ profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }], index: 0, user: { id: 10 } as never });
});
afterEach(() => closeModal());

describe('страница «Ресурсы»', () => {
	const profile = { u: { _id: '5', _clan_id: '0', _va: '0', _pet: '0', _lott: '30' } };

	it('после загрузки показывает карточки действий и доступные кнопки', async () => {
		game.mockResolvedValue(profile);
		await show(ResourcesBotPanel);
		await settle();
		expect(text()).toContain('Ресурсы');
		expect(text()).toContain('Ежедневная награда');
		expect(text()).toContain('Обыск друзей');
		expect(button('Собрать всё')?.disabled).toBe(false);
		expect(button('Обновить')?.disabled).toBe(false);
	});

	it('«Обновить» перезагружает данные и страница остаётся рабочей', async () => {
		game.mockResolvedValue(profile);
		await show(ResourcesBotPanel);
		await settle();
		game.mockClear();
		await click(button('Обновить')!);
		await settle();
		expect(game).toHaveBeenCalled();
		expect(text()).toContain('Ежедневная награда');
		expect(button('Обновить')?.disabled).toBe(false);
	});

	it('игра не ответила: страница не бросает на настройки профиля, кнопки не заблокированы', async () => {
		game.mockResolvedValue(null);
		await show(ResourcesBotPanel);
		await settle();
		expect(getModalStack()).toHaveLength(0);
		expect(button('Обновить')?.disabled).toBe(false);
	});

	it('игра отказала в доступе: открываются настройки профиля', async () => {
		game.mockResolvedValue({ err_msg: 'bad auth' });
		await show(ResourcesBotPanel);
		await settle();
		expect(getModalStack().map((entry) => entry.id)).toEqual(['settings']);
	});
});

describe('страница «Арена»', () => {
	/** Игрок и противник: у игрока большой урон, противник слабый, поэтому бой идёт в одну сторону. */
	const player = (patch: Record<string, string> = {}) => ({
		_id: '10',
		_name: 'Герой',
		_en: '20',
		_m3: '10',
		_al: '1',
		_ap: '100',
		_exp: '5',
		_dmgi: '1000',
		_end: '10',
		_endi: '10',
		_s3: '0',
		...patch,
	});
	const enemy = { _id: '77', _name: 'Враг', _aid: '3', _dmgi: '1', _end: '1', _endi: '1', _s1: '0', _s2: '0', _s3: '0' };
	const reply =
		(me = player(), chests = 1) =>
		async (_server: number | string, body: Record<string, string | number> = {}) => {
			if (Object.keys(body).length === 0) return { u: me, chests: { ch: Array.from({ length: chests }, (_, index) => ({ _id: String(index) })) } };
			if (body.i === 9) return { u: enemy, my_rating: { _val: '42' } };
			if (body.i === 11) return { fight: { _hp: '15', _myhp: '300', _esk: '0', _myr: '0' } };
			if (body.i === 12) return { fight: { _hp: '0', _myhp: '300', _esk: '0', _myr: '0' }, r: { _exp: '7' } };
			return null;
		};

	it('показывает показатели игрока, лигу и настройки', async () => {
		game.mockImplementation(reply(player({ _al: '2' }), 2));
		await show(ArenaBotPanel);
		await settle();
		expect(text()).toContain('Арена');
		expect(text()).toContain('Лига Воинов I');
		expect(text()).toContain('Лимит проигрышей');
		expect(text()).toContain('Тратит 4 энергии');
		expect(button('Запустить')?.disabled).toBe(false);
		expect(button('Остановить')?.disabled).toBe(true);
	});

	it('бой идёт до конца: убивает противника и останавливается, когда не хватает золота', async () => {
		game.mockImplementation(reply());
		await show(ArenaBotPanel);
		await settle();
		await click(button('Запустить')!);
		await settle();
		expect(text()).toContain('Бот запущен');
		expect(text()).toContain('Убили противника');
		expect(text()).toContain('Не хватает золота на создание противника');
		// Бот остановлен: страница снова управляется кнопками
		expect(button('Запустить')?.disabled).toBe(false);
		expect(button('Остановить')?.disabled).toBe(true);
	});

	it('при лимите сундуков в режиме «Сундуки» бот не запускает бои', async () => {
		localStorage.setItem('arenaSettings', JSON.stringify({ useEnergy: false, useGold: true, useLoss: false, useChest: true, tryLimit: 20 }));
		game.mockImplementation(reply(player(), 3));
		await show(ArenaBotPanel);
		await settle();
		await click(button('Запустить')!);
		await settle();
		expect(text()).toContain('Лимит сундуков');
		expect(game.mock.calls.some(([, body]) => body?.i === 11)).toBe(false);
	});

	it('нет данных арены: страница не остаётся на заставке с заблокированными кнопками', async () => {
		game.mockImplementation(async (_server, body = {}) => (Object.keys(body).length === 0 ? { u: player(), chests: { ch: [] } } : null));
		await show(ArenaBotPanel);
		await settle();
		// Данные арены не пришли в первый раз: бот уходит со страницы (панель закрывается), кнопки не должны висеть в загрузке
		expect(button('Запустить')?.disabled ?? false).toBe(false);
	});
});

describe('страница «Рейды»', () => {
	const raid = {
		_id: '1',
		_mode: '0',
		_pos: '1',
		_hp: '1000',
		rc: [{ _p: '2', _t: '1', _s: '1' }],
		bp: [{ _p: '3', _s: '1' }],
		rb: [{ _id: '304', _p: '4', _s: '0' }],
	};
	const player = { _id: '10', _en: '50', _dmgi: '100', _s3: '0', _item1: '2', _item3: '1' };

	it('без активного рейда показывает выбор рейда и режима; кнопка включается после выбора', async () => {
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '1' } });
		await show(RaidsBotPanel);
		await settle();
		expect(text()).toContain('Подземелье форта');
		expect(text()).toContain('Легендарный режим');
		expect(text()).toContain('1/3');
		expect(button('Начать рейд')?.disabled).toBe(true);
		const raidCell = [...document.body.querySelectorAll('span')].find((item) => item.textContent === 'Подземелье форта')!;
		await click(raidCell);
		const modeCell = [...document.body.querySelectorAll('span')].find((item) => item.textContent === 'Лёгкий режим')!;
		await click(modeCell);
		expect(button('Начать рейд')?.disabled).toBe(false);
	});

	it('при лимите попыток кнопка «Начать рейд» заблокирована', async () => {
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '3' } });
		await show(RaidsBotPanel);
		await settle();
		expect(button('Начать рейд')?.disabled).toBe(true);
		expect(text()).toContain('3/3');
	});

	it('с активным рейдом показывает показатели, боссов, бочки и сундуки', async () => {
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '1' }, uraid: raid });
		await show(RaidsBotPanel);
		await settle();
		expect(text()).toContain('Рейды');
		expect(text()).toContain('1 из 3');
		expect(text()).toContain('Страж Подземелья');
		expect(text()).toContain('Убито 0 из 1');
		expect(text()).toContain('Открыто 0 из 1');
		expect(button('Запустить')?.disabled).toBe(false);
		expect(button('Завершить')?.disabled).toBe(false);
	});

	it('запуск в рейде без наград доходит до конца и сообщает об этом', async () => {
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '1' }, uraid: { ...raid, rc: [], bp: [], rb: [] } });
		await show(RaidsBotPanel);
		await settle();
		await click(button('Запустить')!);
		await settle();
		expect(text()).toContain('Бот запущен');
		expect(text()).toContain('Собраны все возможные награды');
		expect(button('Запустить')?.disabled).toBe(false);
	});

	it('точка, до которой нет пути, останавливает бота с сообщением, а не объявляется собранной', async () => {
		// Точки 999 нет на карте рейда
		const lost = { ...raid, rc: [{ _p: '999', _t: '1', _s: '1' }], bp: [], rb: [] };
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '1' }, uraid: lost });
		await show(RaidsBotPanel);
		await settle();
		await click(button('Запустить')!);
		await settle();
		expect(text()).toContain('Не найден путь в точку 999');
		expect(text()).not.toContain('Собраны все возможные награды');
	});

	it('игра не ответила: загрузка не крутится вечно, можно нажать «Обновить»', async () => {
		game.mockResolvedValue(null);
		await show(RaidsBotPanel);
		await settle();
		expect(getModalStack()).toHaveLength(0);
		expect(button('Обновить')?.disabled).toBe(false);
		// Повторная попытка работает, когда сервер снова отвечает
		game.mockResolvedValue({ u: player, raids_cnt: { _v: '1' }, uraid: raid });
		await click(button('Обновить')!);
		await settle();
		expect(text()).toContain('Убито 0 из 1');
	});
});
