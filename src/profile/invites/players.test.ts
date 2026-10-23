import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/http', () => ({ getData: vi.fn() }));

import { getData } from '../../api/http';
import { activePlayers, loadPlayers } from './players';
import { hasPlayers } from './realms';

const row = (id: number, lastSeen: number, extra: object = {}) => ({ id, name: `P${id}`, avatar: 3, date: [1000, lastSeen, 0], ...extra });

describe('activePlayers', () => {
	it('оставляет заходивших за 30 дней, недавние первыми', () => {
		const players = activePlayers([row(1, 100000), row(2, 60), row(3, 40 * 86400), row(4, 29 * 86400)]);
		expect(players.map((player) => player.id)).toEqual([2, 1, 4]);
	});

	it('пустое имя заменяется на «Player<id>», строки без данных пропускаются', () => {
		const players = activePlayers([row(7, 10, { name: '' }), { id: 8, name: 'x', avatar: 1, date: [] }, { ...row(0, 10) }]);
		expect(players).toEqual([{ id: 7, name: 'Player7', avatar: 3, lastSeen: 10 }]);
	});
});

describe('loadPlayers', () => {
	beforeEach(() => {
		vi.mocked(getData).mockReset();
	});

	it('серверы без статистики не запрашиваются', async () => {
		expect(await loadPlayers(3)).toBeNull();
		expect(hasPlayers(3)).toBe(false);
		expect(hasPlayers(1)).toBe(true);
		expect(getData).not.toHaveBeenCalled();
	});

	it('читает файл один раз за сессию и ищет последний доступный день', async () => {
		vi.mocked(getData)
			.mockResolvedValueOnce('not found')
			.mockResolvedValueOnce([row(5, 30), row(6, 99 * 86400)]);
		const index = await loadPlayers(2);
		expect(index?.ids).toEqual([5]);
		expect(index?.byId.get(5)?.name).toBe('P5');
		expect(vi.mocked(getData).mock.calls[0]![0]).toContain('/users/antares/');
		await loadPlayers(2);
		expect(getData).toHaveBeenCalledTimes(2);
	});

	it('неудачная загрузка не запоминается', async () => {
		vi.mocked(getData).mockResolvedValue(null);
		expect(await loadPlayers(1)).toBeNull();
		vi.mocked(getData).mockReset();
		vi.mocked(getData).mockResolvedValueOnce([row(1, 5)]);
		expect((await loadPlayers(1))?.ids).toEqual([1]);
	});
});
