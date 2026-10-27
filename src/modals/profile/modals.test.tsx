import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../lib/storage', () => ({ storageGet: vi.fn(async () => null), storageSet: vi.fn(async () => true) }));

import { getGame } from '../../api/game';
import { storageGet, storageSet } from '../../lib/storage';
import { parseResponse } from '../../api/parse';
import data from '../../data/bosses.json';
import { setBattleSession, setInvitesContext, startBattle } from '../../profile/invites/battleStore';
import { setSession } from '../../profile/session';
import { closeModal, getModalStack } from '../../store/modal';
import { button, click, flush, installBrowserStubs, render } from '../../test/harness';
import { BattleModal } from './BattleModal';
import { BattleResultModal } from './BattleResultModal';
import { InviteModal } from './InviteModal';
import { ParticipantsModal } from './ParticipantsModal';

installBrowserStubs();

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const boss = data.find((item) => item.id === 69)!;
const npc = { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 };
const fighter = { dmg: 143719, skills: { 1: 0, 2: 5, 3: 153, 4: 400 } as const, lightning: 5, fire: 5, potions: 5 };
const player = { level: 67, energy: 51, maxRegion: 0, fighter, maxHp: 791_370 };
const me = { id: 7, name: 'Я', avatar: 8 };
const battle = {
	fightId: 500,
	npc: 69,
	hp: 31_500_000,
	maxHp: 31_500_000,
	bossDmg: 2450,
	myHp: 791_370,
	rage: 10,
	elapsed: 60,
	receivedAt: Date.now(),
	won: false,
	lost: false,
	participants: [],
};
const invite = { id: 1, uid: 77, npc: 69, fightId: 500, guild: 0, players: 3, name: 'Ян', others: [] };

const fightInfo = (id: number, hp = 31_500_000) => parseResponse(`<data><fight id="${id}"/><u hp="${hp}" mhp="31500000" avail="4" nrgn="0"/></data>`);
const entry = (id: 'invite' | 'battleResult' | 'participants', payload: Record<string, unknown>) => ({ id, key: id, data: payload });
const calls = () => vi.mocked(getGame).mock.calls.map((call) => (call[1] as { i?: number } | undefined)?.i);

beforeEach(() => {
	vi.mocked(getGame).mockReset();
	closeModal();
	setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
	setBattleSession(null);
	setInvitesContext({ bot, npcs: new Map([[69, npc]]), players: null, player });
});

describe('окно приглашения', () => {
	const open = () => render(<InviteModal open entry={entry('invite', { invite, boss, inviter: 'Позвал Ян' })} />);

	it('показывает босса, попытки и энергию; «Принять» доступна, когда бой жив', async () => {
		vi.mocked(getGame).mockImplementation(async (_server, body) => (body?.i === 10 ? fightInfo(500) : { u: { _en: '51', _dmgi: '1', _end: '1', _endi: '1' } }));
		await open();
		await flush();
		const text = document.body.textContent ?? '';
		expect(text).toContain(boss.name);
		expect(text).toContain(boss.description);
		expect(text).toContain('4 из 5');
		expect(button('Принять')?.disabled).toBe(false);
	});

	it('бой закончился: сервер прислал другой номер боя — «Приглашение устарело», принять нельзя', async () => {
		vi.mocked(getGame).mockImplementation(async (_server, body) => (body?.i === 10 ? fightInfo(999) : { u: { _en: '51' } }));
		await open();
		await flush();
		expect(document.body.textContent).toContain('Приглашение устарело');
		expect(button('Принять')).toBeUndefined();
		expect(button('Закрыть')).toBeDefined();
	});

	it('пока идёт другой бой (по данным игры), принять нельзя', async () => {
		setInvitesContext({ bot, npcs: new Map([[69, npc]]), players: null, player, current: { battle, fighter, me } });
		// Профиль при открытии окна подтверждает бой (узел fight); без него «Вы уже в бою» пропало бы
		const inFight = { _fid: '9', _eid: '69', _hp: '500', _mhp: '1000', _dmg: '5', _myhp: '40', _myr: '7', _res: '2' };
		vi.mocked(getGame).mockImplementation(async (_server, body) => (body?.i === 10 ? fightInfo(500) : { u: { _en: '51', _id: '7' }, fight: inFight }));
		await open();
		await flush();
		expect(document.body.textContent).toContain('Вы уже в бою');
		expect(button('Принять')?.disabled).toBe(true);
	});

	it('«Принять» входит в бой и открывает окно боя', async () => {
		vi.mocked(getGame).mockImplementation(async (_server, body) => {
			if (body?.i === 10) return fightInfo(500);
			if (body?.i === 11) return parseResponse('<data><fight hp="31000000" mhp="31500000" dmg="2450" myhp="791370" myr="10" eid="69" fid="500" res="2" time="0"/></data>');
			return { u: { _id: '7', _name: 'Я', _aid: '8', _lvl: '67', _en: '51', _dmgi: '143719', _s3: '153' } };
		});
		await open();
		await flush();
		await click(button('Принять')!);
		await flush();
		expect(calls()).toContain(11);
		expect(getModalStack().at(-1)?.id).toBe('battle');
	});
});

describe('окно боя', () => {
	const view = () => render(<BattleModal open />);

	it('кнопки ударов, Max, время боя и расходники', async () => {
		startBattle(bot, battle, fighter, me, null);
		await view();
		await flush();
		const text = document.body.textContent ?? '';
		for (const label of ['×1', '×3', '×9', 'Max', 'Рассчитать убийство', 'Обновить']) expect(text).toContain(label);
		expect(text).toContain('Время боя');
		expect(document.body.querySelector('input[placeholder="Свитки огня"]')).not.toBeNull();
		expect(text).toContain('SOLO');
	});

	it('удар отправляет раунд (i: 12) с расчётом, лог получает запись', async () => {
		startBattle(bot, battle, fighter, me, null);
		vi.mocked(getGame).mockResolvedValue(
			parseResponse('<data><fight hp="31300000" mhp="31500000" dmg="2450" myhp="789000" myr="10" eid="69" fid="500" res="2" time="70"/></data>'),
		);
		await view();
		await flush();
		await click(button('×1')!);
		await flush();
		await flush();
		expect(calls()).toContain(12);
		// Запись об ударе: ник персонажа и «N урона», ответ босса: его название и «N урона»
		expect(document.body.textContent).toContain('Я');
		expect(document.body.textContent).toMatch(/Нанес \d[\d\s]* урона/);
		expect(document.body.textContent).toContain('Гроккар');
	});

	it('погибший персонаж: все кнопки ударов заблокированы (сервер их не принимает), обновление доступно', async () => {
		startBattle(bot, { ...battle, myHp: 0, lost: true }, fighter, me, null);
		await view();
		await flush();
		for (const label of ['×1', '×3', '×9', 'Max']) expect(button(label)?.disabled).toBe(true);
		expect(button('Обновить')?.disabled).toBe(false);
	});

	it('Kill только у тех, кто в белом списке (по запустившему приложение по ответу VK Bridge, не по адресу и не по профилю); у погибшего она заблокирована', async () => {
		// Подмена id в адресе ничего не даёт
		window.history.replaceState(null, '', '/?vk_user_id=153968505');
		setSession({ bossesWhitelist: [153968505], launcherId: 0 });
		startBattle(bot, { ...battle, myHp: 0, lost: true }, fighter, me, null);
		await view();
		await flush();
		expect(button('Kill')).toBeUndefined();
		setSession({ bossesWhitelist: [111, 153968505], launcherId: 153968505 });
		await flush();
		expect(button('Kill')?.disabled).toBe(true);
		setSession({ bossesWhitelist: [111], launcherId: 153968505 });
		await flush();
		expect(button('Kill')).toBeUndefined();
		window.history.replaceState(null, '', '/');
		setSession({ bossesWhitelist: [], launcherId: 0 });
	});
});

describe('настройки боя', () => {
	it('навык и расходники читаются из хранилища для профиля и босса и сохраняются при изменении', async () => {
		vi.mocked(storageGet).mockResolvedValue(JSON.stringify({ skill: 3, fire: { on: true, max: '2' }, lightning: { on: false, max: '' }, potions: { on: false, max: '' } }));
		vi.mocked(storageSet).mockClear();
		startBattle(bot, battle, fighter, me, null);
		await render(<BattleModal open />);
		await flush();
		expect(vi.mocked(storageGet)).toHaveBeenCalledWith('boss_1_1_69');
		expect((document.body.querySelector('input[placeholder="Свитки огня"]') as HTMLInputElement).value).toBe('2');
		// пользователь включает свитки молнии: настройки уходят в хранилище после небольшой паузы
		const lightning = [...document.body.querySelectorAll('input[type="checkbox"]')][1] as HTMLInputElement;
		await click(lightning);
		await act(async () => new Promise((resolve) => setTimeout(resolve, 450)));
		const saved = vi.mocked(storageSet).mock.calls.at(-1)!;
		expect(saved[0]).toBe('boss_1_1_69');
		expect(JSON.parse(saved[1])).toMatchObject({ skill: 3, fire: { on: true, max: '2' }, lightning: { on: true } });
	});
});

describe('итоги и участники', () => {
	const rows = [
		{ id: 7, name: 'Я', avatar: 8, damage: 1000 },
		{ id: 9, name: 'Ян', avatar: null, damage: 500 },
	];

	it('итоги: заголовок, кнопки и награда; по «Все участники» открывается список', async () => {
		vi.mocked(getGame).mockResolvedValue(fightInfo(0));
		await render(<BattleResultModal open entry={entry('battleResult', { npc: 69, rows, meId: 7, lines: [{ avatar: 'bot/raids/12.png', title: 'Серебро', message: '5 ед.' }] })} />);
		await flush();
		expect(document.body.textContent).toContain('Бой завершён');
		expect(document.body.textContent).toContain('Серебро');
		expect(button('Повторить бой')).toBeDefined();
		await click(button('Все участники')!);
		expect(getModalStack().at(-1)).toMatchObject({ id: 'participants', data: { meId: 7 } });
	});

	it('время вышло — подпись об этом вместо награды', async () => {
		vi.mocked(getGame).mockResolvedValue(fightInfo(0));
		await render(<BattleResultModal open entry={entry('battleResult', { npc: 69, rows, meId: 7, lines: [], timeout: true })} />);
		await flush();
		expect(document.body.textContent).toContain('Время боя вышло');
	});

	it('участники после боя: полоска игроков и список, здоровья босса нет', async () => {
		await render(<ParticipantsModal open entry={entry('participants', { rows, meId: 7 })} />);
		await flush();
		const text = document.body.textContent ?? '';
		expect(text).toContain('Игроков в бою');
		expect(text).not.toContain('Здоровье босса');
		expect(text).toContain('Ян');
		expect(text).toContain('1 000');
		// Аватарки участников грузятся, когда подходят к экрану: в бою их до 300
		const avatars = [...document.body.querySelectorAll('img')].filter((image) => image.getAttribute('src')?.includes('avatar_8'));
		expect(avatars.length).toBeGreaterThan(0);
		expect(avatars.every((image) => image.getAttribute('loading') === 'lazy')).toBe(true);
	});

	it('участники идущего боя: здоровье босса есть', async () => {
		startBattle(bot, { ...battle, participants: [{ id: 9, name: 'Ян', avatar: null, damage: 500 }] }, fighter, me, null);
		await render(<ParticipantsModal open entry={entry('participants', {})} />);
		await flush();
		expect(document.body.textContent).toContain('Здоровье босса');
	});
});
