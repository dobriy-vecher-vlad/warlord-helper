import { getData } from '../../api/http';

/** Строка рейтинга: игрок (с аватаром) или гильдия (с тегом и лидером). */
export interface RatingRow {
	id: number;
	name: string;
	/** Значение в рейтинге: число или строка («85%») */
	title: number | string;
	avatar?: number;
	leader?: number;
	tag?: string;
}

export interface RatingBlock {
	name: string;
	subname: string;
	items: RatingRow[];
}

export type RatingTab = 1 | 2;

interface RatingCache {
	time: string;
	count: number;
	blocks: RatingBlock[];
	/** Строки для поиска: номер (id ВК игрока или id гильдии) и имя */
	search: { id: number; vkId?: number; name: string }[];
}

/** Дата файла статистики: «2026.10.19» за `daysAgo` дней до сегодня по московскому времени (так их создаёт сервер). */
export function fileDate(daysAgo: number) {
	const [day, month, year] = new Date(Date.now() - daysAgo * 86400000)
		.toLocaleDateString('ru', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' })
		.split('.');
	return `${year}.${month}.${day}`;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Игрок в файле статистики рейтинга. */
interface UserStat {
	vkId: number;
	name: string;
	avatar?: number;
	exp: number;
	lvl: number;
	dmg: number;
	hp: number;
	cups: number;
	skills: number[];
}

/** Участник гильдии в файле статистики: `date[1]` — сколько секунд назад заходил. */
interface GuildMember {
	id: number;
	vkId?: number;
	name: string;
	dmg: number;
	hp: number;
	lvl: number;
	date: number[];
}

/** Гильдия в файле статистики (поля `leader` и `tag` при разборе заменяются). */
interface GuildStat {
	id: number;
	name: string;
	leader: number;
	tag?: string;
	lvl: number;
	guard: number[];
	ram: number[];
	users: GuildMember[];
	actions: { bosses: { time: number }[]; wars: { to: { time: number }[] } };
}

/*
 * Старое приложение сортировало один и тот же массив на месте, блок за блоком. При равных значениях
 * порядок поэтому наследуется от предыдущей сортировки — здесь так же: массив `list` общий для всех блоков.
 */
function profileBlocks(list: UserStat[]): RatingBlock[] {
	const row = (user: UserStat, title: number): RatingRow => ({ id: user.vkId, name: user.name, title, avatar: user.avatar });
	const block = (name: string, subname: string, order: (user: UserStat) => number, show: (user: UserStat) => number = order) => ({
		name,
		subname,
		items: list.sort((a, b) => order(b) - order(a)).map((user) => row(user, show(user))),
	});
	const level = block(
		'Уровень',
		'личная статистика',
		(user) => user.exp,
		(user) => user.lvl,
	);
	const attack = block('Атака', 'личная статистика', (user) => user.dmg);
	const health = block(
		'Здоровье',
		'личная статистика',
		(user) => user.hp,
		(user) => user.hp * 15,
	);
	const cups = block('Кубки', 'награда арены', (user) => user.cups);
	// Лишняя сортировка по здоровью перед навыками была и в старом коде: от неё зависит порядок равных
	list.sort((a, b) => b.hp - a.hp);
	const skills = block('Навыки', 'общая сумма', (user) => sum(user.skills));
	return [level, attack, health, cups, skills];
}

/** Тег гильдии: первое слово имени (до 4 символов), иначе первого участника, иначе «#». */
function guildTag(name?: string, reserve?: string): string {
	let result = '#';
	if (name) {
		const word = /^(.+?) /.exec(
			name
				.replace(/{|}|\[|]|-|_/g, ' ')
				.replace(/ +/g, ' ')
				.replace(/^\s/g, ''),
		);
		result = word?.[1] && word[1].length < 5 ? word[1] : reserve ? guildTag(reserve) : '#';
	}
	return result.slice(0, 3);
}

function guildBlocks(list: GuildStat[], now: number): RatingBlock[] {
	const week = 86400000 * 7;
	for (const guild of list) {
		guild.leader = guild.users?.find((user) => user.id == guild.leader)?.vkId || guild.leader;
		// Как в старом коде: лидер для тега ищется уже по новому значению (чаще всего не находится — берётся первый участник)
		guild.tag = guildTag(guild.users?.find((user) => user.id == guild.leader)?.name, guild.users?.[0]?.name);
	}
	const row = (guild: GuildStat, title: number | string): RatingRow => ({ id: guild.id, name: guild.name, title, leader: guild.leader, tag: guild.tag });
	const block = (name: string, subname: string, order: (guild: GuildStat) => number, show: (guild: GuildStat) => number | string = order) => ({
		name,
		subname,
		items: list.sort((a, b) => order(b) - order(a)).map((guild) => row(guild, show(guild))),
	});
	const users = (guild: GuildStat, field: 'dmg' | 'hp' | 'lvl') => sum(guild.users.map((user) => user[field]));
	const attendance = (guild: GuildStat) => Math.ceil(100 / (guild.users.length / guild.users.filter((user) => (user.date[1] ?? Infinity) < 86400 * 7).length));
	return [
		block('Уровень', 'навыки и постройки', (guild) => guild.lvl),
		block('Стража', 'атака и здоровье', (guild) => sum(guild.guard)),
		block('Таран', 'атака и здоровье', (guild) => sum(guild.ram)),
		block('Атака', 'статистика состава', (guild) => users(guild, 'dmg')),
		block(
			'Здоровье',
			'статистика состава',
			(guild) => users(guild, 'hp'),
			(guild) => users(guild, 'hp') * 15,
		),
		block('Уровень', 'статистика состава', (guild) => users(guild, 'lvl')),
		block('Посещаемость', 'за неделю', attendance, (guild) => `${attendance(guild)}%`),
		block('Убито боссов', 'за неделю', (guild) => guild.actions.bosses.filter((boss) => boss.time > now - week).length),
		block('Совершено набегов', 'за неделю', (guild) => guild.actions.wars.to.filter((war) => war.time > now - week).length),
	];
}

const cache = new Map<string, RatingCache>();

/**
 * Рейтинг сервера: файл статистики за последний доступный день (ищется до 10 дней назад).
 * Загруженный рейтинг запоминается до перезапуска приложения. null — данных нет.
 */
export async function loadRating(tab: RatingTab, server: number): Promise<RatingCache | null> {
	const key = `${tab}-${server}`;
	const cached = cache.get(key);
	if (cached) return cached;
	const folder = tab === 1 ? 'users' : 'guilds';
	const realm = ['ermun', 'antares'][server - 1] ?? 'ermun';
	for (let day = 0; day < 10; day++) {
		const time = fileDate(day);
		const data = await getData(`https://warlord.website.yandexcloud.net/data/${folder}/${realm}/${time}.json`);
		if (!Array.isArray(data)) continue;
		const now = new Date(time).getTime();
		const blocks = tab === 1 ? profileBlocks(data) : guildBlocks(data, now);
		// Поиск идёт в порядке после всех сортировок (как по rating.items в старом приложении)
		const search = data.map((row: { id: number; vkId?: number; name: string }) =>
			tab === 1 ? { id: Number(row.vkId), vkId: row.vkId, name: row.name } : { id: row.id, name: row.name },
		);
		const result = { time, count: data.length, blocks, search };
		cache.set(key, result);
		return result;
	}
	return null;
}

/** Дата обновления в подписи: «19.10.2026». */
export const ratingDate = (time: string) => time.replace(/(\d*).(\d*).(\d*)/g, '$3.$2.$1');

/** Цвет квадрата с тегом гильдии (InitialsAvatar gradientColor 1–6). */
export const tagColor = (id: number) => ['red', 'orange', 'yellow', 'green', 'l-blue', 'violet'][id % 6];

/* Поиск по имени с учётом раскладки и транслита, как в старом приложении */
const LAYOUT: Record<string, string>[] = [
	Object.fromEntries([..."qwertyuiop[]asdfghjkl;'zxcvbnm,."].map((key, x) => [key, 'йцукенгшщзхъфывапролджэячсмитьбю'[x] ?? key])),
	Object.fromEntries([...'йцукенгшщзхъфывапролджэячсмитьбю'].map((key, x) => [key, "qwertyuiop[]asdfghjkl;'zxcvbnm,."[x] ?? key])),
];
const TRANSLIT: Record<string, string>[] = [
	{
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'e',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'h',
		ц: 'c',
		ч: 'ch',
		ш: 'sh',
		щ: 'sch',
		ь: '',
		ы: 'y',
		ъ: '',
		э: 'e',
		ю: 'yu',
		я: 'ya',
	},
	{
		a: 'а',
		b: 'б',
		v: 'в',
		g: 'г',
		d: 'д',
		e: 'е',
		z: 'з',
		i: 'и',
		y: 'й',
		k: 'к',
		l: 'л',
		m: 'м',
		n: 'н',
		o: 'о',
		p: 'п',
		r: 'р',
		s: 'с',
		t: 'т',
		u: 'у',
		f: 'ф',
		h: 'х',
		c: 'ц',
	},
];

function convert(word: string, table: Record<string, string>) {
	return [...word].map((symbol) => table[symbol] ?? symbol).join('');
}

/** Регулярное выражение без учёта регистра; null, если запрос не получается разобрать. */
const compile = (pattern: string) => {
	try {
		return new RegExp(pattern, 'i');
	} catch {
		return null;
	}
};

/** Запрос в двух вариантах (другая раскладка или транслит): подходит тот, что совпадает со строкой, иначе второй. */
const bothWays = (search: string, tables: Record<string, string>[]): [RegExp | null, RegExp | null] => [compile(convert(search, tables[0]!)), compile(convert(search, tables[1]!))];
const pick = (pair: [RegExp | null, RegExp | null], value: string) => (pair[0]?.test(value) ? pair[0] : pair[1]);

/** Найти строку по номеру или по части имени (в том числе в другой раскладке и транслитом). */
export function findRating(rows: readonly { id: number; vkId?: number; name: string }[], input: string): number | undefined {
	const id = Number(input);
	if (id !== 0 && Number.isInteger(id) && rows.find((row) => row.vkId == id || row.id == id)) return id;
	const search = input
		.trim()
		.toLowerCase()
		.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
	if (!search.length) return undefined;
	// Выражения собираются один раз, а не для каждой строки рейтинга
	const direct = compile(search);
	const compact = compile(search.replace(/\s/g, ''));
	const layout = bothWays(search, LAYOUT);
	const translit = bothWays(search, TRANSLIT);
	for (const option of rows) {
		const value = String(option.name || '')
			.trim()
			.toLowerCase();
		if (!value.length) continue;
		if (direct?.test(value) || compact?.test(value.replace(/\s/g, '')) || pick(layout, value)?.test(value) || pick(translit, value)?.test(value)) return option.id;
	}
	return undefined;
}
