import { describe, expect, it, vi } from 'vitest';
import { ALL_STEPS, runResources, type Problem, type Request, type ResourceEnv } from './resourceRunner';
import { INITIAL_TIMES, type BotProfile } from './resourcesData';
import type { ResourceState } from './resourcesActions';

const emptyState = (): ResourceState => ({ guildReward: false, wars: { start: null, end: null }, profiles: [], counts: {}, times: { ...INITIAL_TIMES }, hints: {} });

const me: BotProfile = { main: true, login: 10, auth: 'pass', server: 1 };
const other: BotProfile = { main: false, login: 20, auth: 'secret', server: 1 };

/** Игровой профиль без гильдии, питомца и премиума: из действий что-то находит только ежедневная награда. */
const profileReply = { u: { _id: '5', _clan_id: '0', _va: '0', _pet: '0', _lott: '30' } };

function setup(options: { request?: Request; alive?: () => boolean; state?: ResourceState } = {}) {
	const problems: [Problem, BotProfile, unknown][] = [];
	const state = options.state ?? emptyState();
	const requests: Record<string, string | number>[] = [];
	const request: Request =
		options.request ??
		vi.fn(async (_server, body) => {
			requests.push(body);
			if (Object.keys(body).length === 0) return profileReply;
			if (body.i === 20) return { res: { _val: 1 } };
			return {};
		});
	const env: ResourceEnv = {
		state,
		alive: options.alive ?? (() => true),
		isShown: (profile) => profile.login === me.login,
		publish: vi.fn(),
		problem: (kind, profile, detail) => void problems.push([kind, profile, detail]),
		logText: vi.fn(),
		logMessage: vi.fn(),
		request,
	};
	return { env, problems, requests, request, state };
}

describe('runResources: подготовка профиля', () => {
	it('без пароля действие не начинается, причина «нет пароля»', async () => {
		const { env, problems, request } = setup();
		expect(await runResources(env, 'daily', 'collect', { ...me, auth: null })).toBe(false);
		expect(problems.map(([kind]) => kind)).toEqual(['noauth']);
		expect(request).not.toHaveBeenCalled();
	});

	it('нет ответа игры (сеть) — это «сеть», а не «неверный пароль»: страница не выбрасывает человека в настройки', async () => {
		const { env, problems } = setup({ request: vi.fn(async () => null) });
		expect(await runResources(env, 'daily', 'collect', me)).toBe(false);
		expect(problems.map(([kind]) => kind)).toEqual(['network']);
	});

	it('ответ без персонажа — неверный пароль, ответ игры передаётся странице', async () => {
		const reply = { err_msg: 'bad auth' };
		const { env, problems } = setup({ request: vi.fn(async () => reply) });
		expect(await runResources(env, 'daily', 'collect', me)).toBe(false);
		expect(problems).toEqual([['badauth', me, reply]]);
	});

	it('сбой запроса гильдии — тоже «сеть»', async () => {
		const request = vi.fn(async (_server: number, body: Record<string, string | number>) => (Object.keys(body).length === 0 ? { u: { ...profileReply.u, _clan_id: '7' } } : null));
		const { env, problems } = setup({ request });
		expect(await runResources(env, 'daily', 'collect', me)).toBe(false);
		expect(problems.map(([kind]) => kind)).toEqual(['network']);
	});

	it('страницу закрыли во время запроса — тихий выход без сообщений', async () => {
		let open = true;
		const request = vi.fn(async () => {
			open = false;
			return profileReply;
		});
		const { env, problems } = setup({ request, alive: () => open });
		expect(await runResources(env, 'daily', 'collect', me)).toBe(false);
		expect(problems).toEqual([]);
	});
});

describe('runResources: действие', () => {
	it('одно действие: проверка профиля, действие, обновление данных; страница получает новое состояние', async () => {
		const { env, requests } = setup();
		expect(await runResources(env, 'daily', 'collect', me)).toBe(true);
		// Профиль, ежедневная награда (i: 20) и повторная загрузка профиля
		expect(requests.map((body) => body.i ?? 'profile')).toEqual(['profile', 20, 'profile']);
		expect(env.logMessage).toHaveBeenCalledWith('bot/resources/7.png', 'Ежедневная награда', 'Ежедневная награда собрана');
		expect(env.publish).toHaveBeenCalled();
	});

	it('действие внутри «Запустить» не перезагружает профиль и не пишет «собирать нечего»', async () => {
		const { env, requests } = setup();
		await runResources(env, 'daily', 'collect', me, false);
		expect(requests.map((body) => body.i ?? 'profile')).toEqual(['profile', 20]);
	});

	it('режим без действия (нет такого сочетания) профиль проверяет, но ничего не собирает', async () => {
		const { env, requests } = setup();
		expect(await runResources(env, 'vip', 'collect', me)).toBe(true);
		// Премиума нет (_va = 0): условие действия не выполнено
		expect(requests).toHaveLength(1);
	});
});

describe('runResources: «Запустить»', () => {
	it('проходит все шаги по порядку, проверка профиля перед каждым и итоговое обновление в конце', async () => {
		const { env, requests } = setup();
		expect(await runResources(env, 'all', '', me)).toBe(true);
		const profileRequests = requests.filter((body) => Object.keys(body).length === 0).length;
		// Начальная проверка, по одной на каждый из шагов и итоговое обновление
		expect(profileRequests).toBe(1 + ALL_STEPS.length + 1);
		// Ежедневная награда (i: 20) собрана один раз
		expect(requests.filter((body) => body.i === 20)).toHaveLength(1);
		// Последним запросом стало итоговое обновление профиля: страница покажет данные после сбора
		expect(Object.keys(requests.at(-1)!)).toHaveLength(0);
	});

	it('остановка страницы прерывает шаги: следующие не начинаются', async () => {
		let steps = 0;
		const request = vi.fn(async (_server: number, body: Record<string, string | number>) => {
			if (Object.keys(body).length === 0) steps++;
			return profileReply;
		});
		const { env } = setup({ request, alive: () => steps < 4 });
		await runResources(env, 'all', '', me);
		expect(steps).toBeLessThan(1 + ALL_STEPS.length);
	});
});

describe('runResources: «Запустить со всех»', () => {
	it('чужие профили собираются с собственным состоянием: показанный профиль не затирается', async () => {
		const state = emptyState();
		state.profiles = [other];
		// У показанного профиля до следующей попытки лотереи 123 секунды, у чужого — 0
		const request = vi.fn(async (_server: number, body: Record<string, string | number>, auth: { login?: string | number }) =>
			Object.keys(body).length === 0 ? { u: { ...profileReply.u, _lott: auth.login === other.login ? '0' : '123' } } : {},
		);
		const { env, problems } = setup({ request, state });
		await runResources(env, 'all-in-all', '', me);
		expect(problems).toEqual([]);
		// Таймер лотереи остался от показанного профиля, а не от чужого (его лотерея — 0)
		expect(state.times.lottery).toBe(123);
		expect(env.logText).toHaveBeenCalledWith('все ресурсы собраны на аккаунте 20');
	});

	it('про профиль, который подготовить не удалось, «собрано» не пишется', async () => {
		const state = emptyState();
		state.profiles = [{ ...other, auth: null }];
		const { env, problems } = setup({ state });
		await runResources(env, 'all-in-all', '', me);
		expect(problems.map(([kind, profile]) => [kind, profile.login])).toEqual([['noauth', 20]]);
		expect(env.logText).not.toHaveBeenCalledWith(expect.stringContaining('все ресурсы собраны на аккаунте'));
	});
});
