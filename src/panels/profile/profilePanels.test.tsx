import type { ComponentType } from 'react';
import { View } from '@vkontakte/vkui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../../lib/items';
import { setSession } from '../../profile/session';
import { initNav } from '../../store/nav';
import { flush, installBrowserStubs, render } from '../../test/harness';
import { CollectionsPanel, InlayPanel, ShopPanel } from './ItemsPanels';
import { getGame } from '../../api/game';
import { getBridge } from '../../profile/vk';
import { getModalStack, closeModal } from '../../store/modal';
import { DonorsPanel, FriendsPanel } from './PeoplePanels';
import { ProfileHubPanel } from './ProfileHubPanel';
import { PROFILE_SECTION } from './ProfilePanels';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../profile/vk', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../profile/vk')>()), getBridge: vi.fn() }));

installBrowserStubs();
vi.setConfig({ testTimeout: 20000 });

async function show(Panel: ComponentType<{ id: string }>) {
	initNav({ view: 'profile', panel: 'p' });
	return render(
		<View id="profile" activePanel="p">
			<Panel id="p" />
		</View>,
	);
}

async function settle() {
	for (let step = 0; step < 6; step++) await flush();
}

const text = () => document.body.textContent ?? '';
const first = ITEMS[0]!;

beforeEach(() => {
	setSession({
		status: 'ready',
		isDonut: false,
		donutUsers: null,
		profiles: [{ id: 10, login: 10, auth: 'pass', server: 1 }, { id: null }],
		profilesFull: [{ id: 10, first_name: 'Иван', last_name: 'Петров', server: 1 } as never, { id: null } as never],
		index: 0,
		user: { id: 10 } as never,
		items: [first.id],
		itemsFull: [
			{
				id: first.id,
				lvl: 3,
				stones: [
					[0, 0],
					[0, 0],
					[0, 0],
				],
				bonus: [1, 2, 3],
			},
		],
		game: { _ap: '1500' } as never,
		draft: { id: null, login: null, auth: null, server: null },
	});
});

describe('страницы предметов профиля', () => {
	it('«Магазин» считает купленные и не купленные предметы', async () => {
		await show(ShopPanel);
		await settle();
		expect(text()).toContain('Магазин');
		expect(text()).toContain(`${ITEMS.length} `);
		expect(text()).toContain('1 предмет');
	});

	it('«Коллекции» не падают с пустым набором собранных', async () => {
		setSession({ items: [], itemsFull: [] });
		await show(CollectionsPanel);
		await settle();
		expect(text()).toContain('Коллекции');
		expect(text()).toContain('0 коллекций');
	});

	it('«Инкрустация» показывает уровни и бонусы купленных предметов', async () => {
		await show(InlayPanel);
		await settle();
		expect(text()).toContain('Инкрустация');
		expect(text()).toContain('3 уровня');
	});
});

describe('страница «Доны»', () => {
	const user = (id: number, extra: object = {}) => ({ id, first_name: `Имя${id}`, last_name: `Фамилия${id}`, ...extra });

	it('один пользователь с двумя записями — одна строка с обоими видами подписки', async () => {
		setSession({ donutUsers: { response: { items: [user(1), user(1, { sex: 2 }), user(2, { sex: 1 })], count: 3 } } as never });
		await show(DonorsPanel);
		await settle();
		expect(text().match(/Имя1 Фамилия1/g)).toHaveLength(1);
		expect(text()).toContain('стандартная + системная');
		expect(text()).toContain('Имя2 Фамилия2');
	});

	it('без донов показывает заглушку', async () => {
		await show(DonorsPanel);
		await settle();
		expect(text()).toContain('Донов пока нет');
	});
});

describe('страница «Мой профиль»', () => {
	it('без подписки в галерее один профиль, виден основной', async () => {
		await show(ProfileHubPanel);
		await settle();
		expect(text()).toContain('Иван');
		expect(text()).toContain('Рейды');
		expect(text()).toContain('Настройки профиля');
	});

	it('с подпиской счётчик кубков арены берётся из персонажа', async () => {
		setSession({ isDonut: true });
		await show(ProfileHubPanel);
		await settle();
		expect(text()).toContain('1 500');
	});
});

describe('подразделы профиля до загрузки сессии', () => {
	it('пока профиль грузится, подраздел показывает загрузку, а не страницу', async () => {
		setSession({ status: 'loading' });
		await show(PROFILE_SECTION['2']!);
		await settle();
		expect(text()).not.toContain('Коллекции');
		expect(text()).not.toContain('Профиль недоступен');
	});

	it('профиль не загрузился: вместо вечной загрузки сообщение и кнопка «Назад»', async () => {
		setSession({ status: 'off' });
		await show(PROFILE_SECTION['2']!);
		await settle();
		expect(text()).toContain('Профиль недоступен');
		expect(text()).toContain('Назад');
	});

	it('профиль загружен — показывается сама страница', async () => {
		await show(PROFILE_SECTION['2']!);
		await settle();
		expect(text()).toContain('Коллекции');
	});
});

describe('страница «Друзья»', () => {
	const node = (id: number, dmg: number) => ({
		_vkId: String(id),
		_id: String(id),
		_name: `Друг${id}`,
		_dmgi: String(dmg),
		_endi: '1',
		_end: '1',
		_lvl: '5',
		_exp: '10',
		_bd: '0',
		_l_t: '0',
	});

	function mockFriends(items: { id: number }[], players: ReturnType<typeof node>[]) {
		vi.mocked(getBridge).mockReset();
		vi.mocked(getBridge).mockResolvedValueOnce({ access_token: 'token' }).mockResolvedValueOnce({ response: { items } });
		vi.mocked(getGame).mockReset();
		vi.mocked(getGame).mockResolvedValue({ u: players });
	}

	afterEach(() => closeModal());

	it('показывает друзей по убыванию урона с номерами мест', async () => {
		mockFriends([{ id: 101 }, { id: 102 }], [node(101, 10), node(102, 50)]);
		await show(FriendsPanel);
		await settle();
		const rows = text();
		expect(rows.indexOf('Друг102')).toBeGreaterThan(-1);
		expect(rows.indexOf('Друг102')).toBeLessThan(rows.indexOf('Друг101'));
	});

	it('нет друзей — заглушка, а не ошибка', async () => {
		mockFriends([], []);
		await show(FriendsPanel);
		await settle();
		expect(text()).toContain('У вас нет друзей');
		expect(getModalStack()).toHaveLength(0);
	});

	it('сбой VK — окно с ошибкой, а не заглушка «нет друзей»', async () => {
		vi.mocked(getBridge).mockReset();
		vi.mocked(getBridge)
			.mockResolvedValueOnce({ access_token: 'token' })
			.mockResolvedValueOnce({ error_data: { error_reason: 'Too many' } });
		await show(FriendsPanel);
		await settle();
		expect(text()).not.toContain('У вас нет друзей');
		expect(getModalStack().map((entry) => entry.id)).toContain('alert');
	});
});
