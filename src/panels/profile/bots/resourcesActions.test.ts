import { describe, expect, it, vi } from 'vitest';
import type { Attrs, ProfileResponse } from '../../../api/gameTypes';
import { RESOURCE_ACTIONS, applyProfile, type ResourceContext, type ResourceState } from './resourcesActions';
import { INITIAL_TIMES } from './resourcesData';

function state(): ResourceState {
	return { guildReward: false, wars: { start: null, end: null }, profiles: [], counts: {}, times: { ...INITIAL_TIMES }, hints: {} };
}

/** Контекст действия с подставным игровым сервером. */
function context(overrides: Partial<ResourceContext> = {}) {
	const s = state();
	const logText = vi.fn();
	const logMessage = vi.fn();
	const ctx: ResourceContext = {
		game: vi.fn(async () => ({})),
		dataProfile: { u: {} },
		user: {},
		builds: [],
		chests: [],
		times: s.times,
		hints: s.hints,
		state: s,
		profile: { main: true, login: 1, auth: 'a', server: 1 },
		server: 1,
		needReload: true,
		logText,
		logMessage,
		...overrides,
	};
	return { ctx, logText, logMessage };
}

describe('applyProfile', () => {
	const profile = (extra: Partial<ProfileResponse> = {}, user: Attrs = {}): ProfileResponse & { u: Attrs } => ({ u: { _va: '1', _pet: '0', _lott: '30', ...user }, ...extra });

	it('без зданий, сундуков, питомца и гильдии карточки недоступны с подсказками', () => {
		const s = state();
		applyProfile(s, profile({}, { _va: '0' }), {});
		expect(s.times).toMatchObject({ map: null, chest: null, pet: null, vip: null, guildBuilds: null, guildReward: null, guildWars: null, lottery: 30 });
		expect(s.hints).toMatchObject({ map: 'Нет доступных зданий', chest: 'Нет доступных сундуков', pet: 'Нет активного питомца', vip: 'Нет премиум статуса' });
	});

	it('считает готовые здания и сундук для сбора', () => {
		const s = state();
		const { builds, chests } = applyProfile(s, profile({ j: [{ _t: '0' }, { _t: '5' }], chests: { ch: { _o: '1', _ot: '0' } } }), null);
		expect(builds).toHaveLength(2);
		expect(chests).toHaveLength(1);
		expect(s.times.map).toBe('1 из 2');
		expect(s.times.chest).toBe('clear');
	});

	it('питомец без еды недоступен', () => {
		const s = state();
		applyProfile(s, profile({ mypets: { p: { _is_loot: '0' } }, pets: { p: { _id: '3', _lp: '50' } } }, { _pet: '3', _pf1: '10' }), {});
		expect(s.times.pet).toBeNull();
		expect(s.hints.pet).toBe('Не хватает еды');
	});

	it('набеги берутся из истории гильдии: только выигранные', () => {
		const s = state();
		applyProfile(s, profile({}, { _clan_id: '5' }), {
			hist: {
				h: [
					{ _t: '18', _v3: '1', _v2: '12', _v1: '4', _d: 'д1' },
					{ _t: '18', _v3: '0', _v2: '11' },
					{ _t: '7', _v3: '1', _v2: '10' },
				],
			},
		});
		expect(s.times.guildWars).toEqual([{ id: 12, enemy: 4, date: 'д1' }]);
		expect(s.wars.end).toBe(12);
	});
});

describe('действия', () => {
	it('«Обыск зданий» собирает награды и пишет итог', async () => {
		const game = vi.fn(async () => ({ j: {}, r: { _m1: '100' } }));
		const { ctx, logMessage } = context({
			game,
			builds: [
				{ _r: '1', _rn: '1' },
				{ _r: '2', _rn: '2' },
			],
		});
		await RESOURCE_ACTIONS['map:collect']!.run(ctx);
		expect(game).toHaveBeenCalledTimes(2);
		expect(logMessage).toHaveBeenCalledWith('bot/resources/9_1.png', 'Обыск зданий', expect.any(Array));
	});

	it('«Обыск зданий» без наград сообщает о лимите, если запущен отдельно', async () => {
		const { ctx, logText, logMessage } = context({ builds: [{ _r: '1', _rn: '1' }] });
		await RESOURCE_ACTIONS['map:collect']!.run(ctx);
		expect(logMessage).not.toHaveBeenCalled();
		expect(logText).toHaveBeenCalledWith('Лимит обыска зданий');
	});

	it('в составе «Запустить» об отсутствии награды не сообщает', async () => {
		const { ctx, logText } = context({ needReload: false });
		await RESOURCE_ACTIONS['map:collect']!.run(ctx);
		expect(logText).not.toHaveBeenCalled();
	});

	it('ежедневная награда отключает карточку', async () => {
		const game = vi.fn(async () => ({ res: { _val: '1' } }));
		const { ctx, logMessage } = context({ game });
		await RESOURCE_ACTIONS['daily:collect']!.run(ctx);
		expect(logMessage).toHaveBeenCalledWith('bot/resources/7.png', 'Ежедневная награда', 'Ежедневная награда собрана');
		expect(ctx.times.daily).toBeNull();
		expect(ctx.hints.daily).toBe('Ежедневная награда уже собрана');
	});

	it('обыск друзей прекращается, когда сервер говорит, что на сегодня хватит', async () => {
		let calls = 0;
		const game = vi.fn(async () => (++calls > 3 ? { msg: 'На сегодня хватит! Можно продолжить завтра.' } : { r: { _m1: '1' } }));
		const { ctx } = context({ game });
		await RESOURCE_ACTIONS['search:collect']!.run(ctx);
		expect(game).toHaveBeenCalledTimes(4);
		expect(ctx.times.search).toBeNull();
	});

	it('дань гильдии: сообщение сервера становится подсказкой без точки', async () => {
		const game = vi.fn(async () => ({ msg: 'Вы уже забрали свою долю на сегодня.' }));
		const { ctx, logText } = context({ game });
		await RESOURCE_ACTIONS['guildReward:collect']!.run(ctx);
		expect(ctx.hints.guildReward).toBe('Вы уже забрали свою долю на сегодня');
		expect(logText).toHaveBeenCalledWith('Вы уже забрали свою долю на сегодня');
	});

	it('условия запуска: без питомца, гильдии и премиума действия пропускаются', () => {
		const { ctx } = context({ user: { _pet: '0', _clan_id: '0', _va: '0' } });
		expect(RESOURCE_ACTIONS['pet:collect']!.when!(ctx)).toBe(false);
		expect(RESOURCE_ACTIONS['guildBuild:collect']!.when!(ctx)).toBe(false);
		expect(RESOURCE_ACTIONS['vip:collect']!.when!(ctx)).toBe(false);
		const withClan = context({ user: { _pet: '2', _clan_id: '9', _va: '1' } }).ctx;
		expect(RESOURCE_ACTIONS['pet:send']!.when!(withClan)).toBe(true);
		expect(RESOURCE_ACTIONS['guildBuild:collect']!.when!(withClan)).toBe(true);
	});

	it('дань гильдии с чужого профиля — только если включён сбор со всех', () => {
		const other = { main: false, login: 2, auth: 'b', server: 1 };
		const base = context({ user: { _clan_id: '9' }, profile: other }).ctx;
		expect(RESOURCE_ACTIONS['guildReward:collect']!.when!(base)).toBe(false);
		base.state.guildReward = true;
		expect(RESOURCE_ACTIONS['guildReward:collect']!.when!(base)).toBe(true);
	});
});
