import { describe, expect, it } from 'vitest';
import { fightHash, md5 } from './hash';
import { RAID_MAPS, raidPath } from './raidMaps';

describe('md5', () => {
	it('совпадает с эталонными значениями', () => {
		expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
		expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
	});

	it('строки разной длины и кириллица (эталоны посчитаны node:crypto)', () => {
		const cases: [string, string][] = [
			['5ja6', '947a4e7c5ca07551195139a7f906d514'],
			['24ja6', '2fe1c5ea56b84f0a3f48b8fbca7eaf79'],
			['Привет, мир', '464899b4b50fc966ad2753ca039e7378'],
			['x'.repeat(55), '04364420e25c512fd958a70738aa8f72'],
			['y'.repeat(56), '6c830a5d23df58dbe0171eb5639bf3e4'],
			['z'.repeat(64), '3ecc49f9d9d6c263b4f0de7fc3f38aed'],
		];
		for (const [text, hash] of cases) expect(md5(text)).toBe(hash);
	});
});

describe('fightHash', () => {
	it('base64 строки + «Bd<n>rP», задом наперёд, снова base64', () => {
		const key = '<data><d s0="1" dd="10" dg="5" /></data>';
		const first = [...atob(fightHash(key))].reverse().join('');
		expect(first).toMatch(/Bd[1-9]rP$/);
		expect(atob(first.slice(0, -5))).toBe(key);
	});
});

/** Поиск пути из старого приложения без изменений — для сравнения. */
function oldPath(raid: number, from: number, to: number): number[] {
	function PriorityQueue(this: { _nodes: { key: string; priority: number }[] }) {
		this._nodes = [];
	}
	const nodes = new (PriorityQueue as unknown as new () => { _nodes: { key: string; priority: number }[] })();
	const enqueue = (priority: number, key: string) => {
		nodes._nodes.push({ key, priority });
		nodes._nodes.sort((a, b) => a.priority - b.priority);
	};
	const vertices: Record<string, Record<string, number>> = {};
	for (const [point, next] of RAID_MAPS[raid - 1]!) {
		const data: Record<string, number> = {};
		next.forEach((item) => (data[item] = 1));
		vertices[point] = data;
	}
	const distances: Record<string, number> = {};
	const previous: Record<string, string | null> = {};
	let path: string[] = [];
	let smallest: string | null;
	for (const vertex in vertices) {
		if (vertex === String(from)) {
			distances[vertex] = 0;
			enqueue(0, vertex);
		} else {
			distances[vertex] = Infinity;
			enqueue(Infinity, vertex);
		}
		previous[vertex] = null;
	}
	while (nodes._nodes.length) {
		smallest = nodes._nodes.shift()!.key;
		if (smallest === String(to)) {
			path = [];
			while (previous[smallest!]) {
				path.push(smallest!);
				smallest = previous[smallest!] ?? null;
			}
			break;
		}
		if (!smallest || distances[smallest] === Infinity) continue;
		for (const neighbor in vertices[smallest]) {
			const alt = distances[smallest]! + vertices[smallest]![neighbor]!;
			if (alt < distances[neighbor]!) {
				distances[neighbor] = alt;
				previous[neighbor] = smallest;
				enqueue(alt, neighbor);
			}
		}
	}
	return path.reverse().map(Number);
}

describe('raidPath', () => {
	it('совпадает со старым алгоритмом (выборка пар точек всех рейдов)', () => {
		RAID_MAPS.forEach((map, index) => {
			const points = map.map(([point]) => point);
			for (const from of points.filter((_, x) => x % 3 === 0)) {
				for (const to of points.filter((_, x) => x % 5 === 0)) expect(raidPath(index + 1, from, to)).toEqual(oldPath(index + 1, from, to));
			}
		});
	}, 60000);

	it('путь идёт по соседним точкам и заканчивается в цели', () => {
		const path = raidPath(1, 5, 22);
		expect(path.at(-1)).toBe(22);
		let current = 5;
		for (const step of path) {
			expect(RAID_MAPS[0]!.find(([point]) => point === current)![1]).toContain(step);
			current = step;
		}
	});
});

describe('награды', async () => {
	const { joinRewards, parseReward } = await import('./reward');

	it('предметы, затем ресурсы в порядке старого лога', () => {
		const lines = parseReward({
			_m3: '5',
			_m1: '1500',
			i: [
				{ _type: '0', _id: '1123' },
				{ _type: '11', _id: '5' },
			],
		});
		expect(lines.map((line) => `${line.title}: ${line.message}`)).toEqual(['Предмет: Рубаха Воина', 'Камень: Кристальный Аквамарин', 'Серебро: 1 500 ед.', 'Золото: 5 ед.']);
	});

	it('награда из нескольких узлов: предметы с типом собираются в список', () => {
		const lines = parseReward([{ _type: '8', _item: '1123' }, { _exp: '10' }]);
		expect(lines.map((line) => line.title)).toEqual(['Заточка', 'Опыт']);
	});

	it('несколько наград складываются', () => {
		const total = joinRewards([{ _m1: '10', i: { _type: '0', _id: '1123' } }, { _m1: '5' }]);
		expect(total._m1).toBe(15);
		expect(total.i).toHaveLength(1);
	});
});
