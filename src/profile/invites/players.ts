import { getData } from '../../api/http';
import { fileDate } from '../../panels/rating/ratingData';
import { REALMS } from './realms';

/** Игрок из файла статистики рейтинга: то, что нужно для опроса приглашений и подписи карточки. */
export interface Player {
	/** Игровой id */
	id: number;
	name: string;
	/** Номер аватара арены (`bot/arena/avatar_<n>.png`) */
	avatar: number;
	/** Сколько секунд назад игрок заходил на момент снимка */
	lastSeen: number;
}

export interface PlayerIndex {
	/** Дата файла, из которого собран список («2026.10.21») */
	time: string;
	/** Игровые id активных игроков: недавно заходившие идут первыми */
	ids: number[];
	byId: ReadonlyMap<number, Player>;
}

/** Игроки, заходившие не позже чем столько дней назад, опрашиваются на приглашения. */
export const ACTIVE_DAYS = 30;

/** Строка файла статистики игроков (остальные поля приложению здесь не нужны). */
interface StatRow {
	id: number;
	name: string;
	avatar: number;
	date: number[];
}

/** Активные игроки из строк файла, недавно заходившие — первыми. Строки с неполными данными пропускаются. */
export function activePlayers(rows: readonly StatRow[], days = ACTIVE_DAYS): Player[] {
	const limit = days * 86400;
	const players: Player[] = [];
	for (const row of rows) {
		const lastSeen = row.date?.[1];
		if (typeof lastSeen !== 'number' || lastSeen >= limit || !Number.isInteger(row.id) || row.id <= 0) continue;
		players.push({ id: row.id, name: row.name || `Player${row.id}`, avatar: row.avatar ?? 0, lastSeen });
	}
	return players.sort((a, b) => a.lastSeen - b.lastSeen);
}

const cache = new Map<number, Promise<PlayerIndex | null>>();

/**
 * Список активных игроков сервера. Файл статистики большой (десятки мегабайт, все игроки), поэтому читается один раз
 * за сессию, а в памяти остаются только активные. Последний доступный файл ищется до 10 дней назад, как у рейтинга.
 * null — файла нет (или сервер без статистики).
 */
export function loadPlayers(server: number): Promise<PlayerIndex | null> {
	const realm = REALMS[server];
	if (!realm) return Promise.resolve(null);
	let promise = cache.get(server);
	if (!promise) {
		promise = readPlayers(realm).then((index) => {
			// Неудача не запоминается: следующая попытка скачает файл заново
			if (!index) cache.delete(server);
			return index;
		});
		cache.set(server, promise);
	}
	return promise;
}

async function readPlayers(realm: string): Promise<PlayerIndex | null> {
	for (let day = 0; day < 10; day++) {
		const time = fileDate(day);
		const data = await getData(`https://warlord.website.yandexcloud.net/data/users/${realm}/${time}.json`);
		if (!Array.isArray(data)) continue;
		const players = activePlayers(data);
		return { time, ids: players.map((player) => player.id), byId: new Map(players.map((player) => [player.id, player])) };
	}
	return null;
}
