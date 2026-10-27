import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/game', () => ({ getGame: vi.fn() }));
vi.mock('../../lib/storage', () => ({ storageGet: vi.fn(async () => '{"f":[69],"r":[]}'), storageSet: vi.fn(async () => true) }));

import { getGame } from '../../api/game';
import { parseResponse } from '../../api/parse';
import data from '../../data/bosses.json';
import { setBattleSession, setInvitesContext } from '../../profile/invites/battleStore';
import { loadBossLists } from '../../profile/invites/favorites';
import { setSession } from '../../profile/session';
import { closeModal, getModalStack } from '../../store/modal';
import { button, click, flush, installBrowserStubs, render } from '../../test/harness';
import { KillAllModal } from './KillAllModal';

installBrowserStubs();

const bot = { server: 1, auth: { login: 1, password: 'k' } };
const boss = data.find((item) => item.id === 69)!;
const npc = { id: 69, region: 13, place: 2, type: 1, level: 30, tries: 5 };
const profile = `<data><u id="7" name="Я" aid="8" lvl="67" en="${boss.energy * 3}" locm="40" dmgi="900000000" end="100000" endi="0" s1="0" s2="0" s3="0" s4="0" item1="0" item2="0" item3="0"/></data>`;
const calls = () => vi.mocked(getGame).mock.calls.map((call) => (call[1] as { i?: number } | undefined)?.i);

beforeEach(async () => {
	vi.mocked(getGame).mockReset();
	closeModal();
	setSession({ profiles: [{ login: 1, server: 1 }] as never, index: 0 });
	setBattleSession(null);
	setInvitesContext({ bot, npcs: new Map([[69, npc]]), players: null, player: null, current: null });
	await loadBossLists(bot);
});

describe('окно «Список боя»', () => {
	it('показывает избранного босса, который убьётся один; «Убить» делает одно убийство и пишет его в лог', async () => {
		let attempts = 3;
		vi.mocked(getGame).mockImplementation(async (_server, body) => {
			if (body?.i === 10) return parseResponse(`<data><u hp="1" mhp="1" avail="${attempts}" nrgn="0"/></data>`);
			if (body?.i === 11) return parseResponse('<data><fight hp="31500000" mhp="31500000" dmg="2450" myhp="791370" myr="10" eid="69" fid="900" res="2" time="0"/></data>');
			if (body?.i === 12) {
				attempts--;
				return parseResponse('<data><fight hp="0" mhp="31500000" dmg="2450" myhp="791000" myr="11" eid="69" fid="900" res="3" time="5"/></data>');
			}
			return parseResponse(profile);
		});
		await render(<KillAllModal open />);
		await flush();
		const text = () => document.body.textContent ?? '';
		expect(text()).toContain(boss.name);
		expect(text()).toContain('боя');
		await click(button('Убить')!);
		await flush();
		expect(calls().filter((i) => i === 11)).toHaveLength(1);
		expect(calls().filter((i) => i === 12)).toHaveLength(1);
		expect(text()).toContain('Убит 1 из 3');
	});

	it('пока идёт бой персонажа, убийство не начинается, причина в логе', async () => {
		vi.mocked(getGame).mockImplementation(async (_server, body) =>
			body?.i === 10 ? parseResponse('<data><u hp="1" mhp="1" avail="3" nrgn="0"/></data>') : parseResponse(profile),
		);
		await render(<KillAllModal open />);
		await flush();
		setInvitesContext({
			bot,
			npcs: new Map([[69, npc]]),
			players: null,
			player: null,
			current: { battle: {} as never, fighter: {} as never, me: { id: 7, name: 'Я', avatar: 8 } },
		});
		await flush();
		await click(button('Убить')!);
		await flush();
		expect(calls()).not.toContain(11);
		expect(document.body.textContent).toContain('Закончите текущий бой');
		expect(getModalStack()).toHaveLength(0);
	});
});
