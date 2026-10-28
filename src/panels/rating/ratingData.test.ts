import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/http', () => ({ getData: vi.fn() }));

import { getData } from '../../api/http';
import { fileDate, fileTime, findRating, loadRating, ratingDate, tagColor } from './ratingData';

const rows = [
	{ id: 1, vkId: 100, name: 'Дракон' },
	{ id: 2, vkId: 200, name: 'Mage King' },
	{ id: 3, vkId: 300, name: 'Иван (воин)' },
];

describe('findRating', () => {
	it('находит строку по номеру ВК или по номеру в рейтинге', () => {
		expect(findRating(rows, '200')).toBe(200);
		expect(findRating(rows, '3')).toBe(3);
	});

	it('находит по части имени без учёта регистра', () => {
		expect(findRating(rows, 'драк')).toBe(1);
		expect(findRating(rows, 'KING')).toBe(2);
	});

	it('находит имя, набранное в другой раскладке', () => {
		// «Дракон» в английской раскладке: lhfrjy
		expect(findRating(rows, 'lhfrjy')).toBe(1);
		// «Mage» в русской раскладке: ьфпу
		expect(findRating(rows, 'ьфпу')).toBe(2);
	});

	it('находит имя, набранное транслитом', () => {
		expect(findRating(rows, 'drakon')).toBe(1);
	});

	it('спецсимволы в запросе не ломают поиск', () => {
		expect(findRating(rows, '(воин')).toBe(3);
		expect(findRating(rows, '[[[')).toBeUndefined();
		expect(findRating(rows, '*')).toBeUndefined();
	});

	it('пустой запрос и неизвестное имя дают undefined', () => {
		expect(findRating(rows, '   ')).toBeUndefined();
		expect(findRating(rows, 'несуществующий')).toBeUndefined();
	});
});

describe('подписи рейтинга', () => {
	it('дата файла превращается в «дд.мм.гггг»', () => {
		expect(ratingDate('2026.10.19')).toBe('19.10.2026');
	});

	it('цвет тега зависит от номера гильдии', () => {
		expect(tagColor(0)).toBe('red');
		expect(tagColor(6)).toBe('red');
		expect(tagColor(5)).toBe('violet');
	});
});

describe('fileTime', () => {
	it('разбирает дату файла вручную, без зависимости от браузера', () => {
		expect(fileTime('2026.10.19')).toBe(Date.UTC(2026, 9, 19));
	});
});

describe('loadRating', () => {
	const user = (patch: Record<string, unknown> = {}) => ({ vkId: 1, name: 'Игрок', exp: 10, lvl: 2, dmg: 5, hp: 3, cups: 1, skills: [1, 2], ...patch });
	const guild = (patch: Record<string, unknown> = {}) => ({
		id: 1,
		name: 'Гильдия',
		leader: 1,
		lvl: 3,
		guard: [1],
		ram: [1],
		users: [{ id: 1, vkId: 11, name: 'Лидер', dmg: 1, hp: 1, lvl: 1, date: [0, 10] }],
		actions: { bosses: [], wars: { to: [] } },
		...patch,
	});
	const today = fileDate(0);
	const yesterday = fileDate(1);
	const server = 1;

	beforeEach(() => vi.mocked(getData).mockReset());

	it('берёт последний доступный день', async () => {
		vi.mocked(getData).mockImplementation(async (url) => (String(url).includes(yesterday) ? [user()] : null));
		const result = await loadRating(1, 2);
		expect(result?.time).toBe(yesterday);
		expect(result?.count).toBe(1);
	});

	it('повреждённый файл за день не ломает страницу: берётся предыдущий', async () => {
		vi.mocked(getData).mockImplementation(async (url) => {
			if (String(url).includes(today)) return [guild({ users: undefined, actions: undefined })];
			if (String(url).includes(yesterday)) return [guild()];
			return null;
		});
		const result = await loadRating(2, server);
		expect(result?.time).toBe(yesterday);
	});

	it('игрок без навыков не роняет разбор рейтинга', async () => {
		vi.mocked(getData).mockResolvedValue([user({ skills: undefined })]);
		const result = await loadRating(1, 1);
		expect(result?.blocks).toHaveLength(5);
	});

	it('гильдия без участников имеет посещаемость 0%, а не NaN', async () => {
		vi.mocked(getData).mockResolvedValue([guild({ users: [] }), guild({ id: 2 })]);
		const result = await loadRating(2, 2);
		const attendance = result?.blocks.find((block) => block.name === 'Посещаемость');
		expect(attendance?.items.map((row) => row.title)).toContain('0%');
		expect(attendance?.items.map((row) => row.title)).not.toContain('NaN%');
	});

	it('нет ни одного файла — null', async () => {
		vi.mocked(getData).mockResolvedValue(null);
		expect(await loadRating(1, 3)).toBeNull();
	});
});
