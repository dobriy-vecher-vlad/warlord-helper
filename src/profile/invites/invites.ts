import { getGame, type GameAuth } from '../../api/game';
import { wait } from '../../lib/async';
import { asArray } from '../bots/common';

/** Приглашение друга на помощь в бою с боссом (сообщение КПК, узел `ur`). */
export interface Invite {
	/** Номер сообщения */
	id: number;
	/** Игровой id игрока, который позвал */
	uid: number;
	/** Id босса (NPC) */
	npc: number;
	/** Id боя */
	fightId: number;
	/** Id гильдии, для которой приглашение (0 — для всех) */
	guild: number;
	/** Сколько игроков уже в бою */
	players: number;
	/** Имя отправителя, если сервер прислал своё */
	name: string;
	/** Игровые id других игроков, которые зовут на тот же бой (приглашения объединяются в одно) */
	others: number[];
}

/** Сколько игроков передаётся в одном запросе (больше сервер обрезает). */
export const CHUNK = 300;

/** Тип сообщения КПК «позвать в бой». */
const INVITE_TYPE = 1;

/** Поле узла: сервер присылает его то атрибутом (`_id`), то дочерним элементом (`id`). */
function field(node: unknown, key: string): string {
	if (typeof node !== 'object' || node === null) return '';
	const record = node as Record<string, unknown>;
	const raw = record[`_${key}`] ?? record[key];
	const text = typeof raw === 'object' && raw !== null ? (raw as { __text?: unknown }).__text : raw;
	return text === undefined || text === null ? '' : String(text).trim();
}

/** Приглашения из ответа метода КПК: узлы `ur`, тип `1`. Остальные типы сообщений и узлы без номера отбрасываются. */
export function parseInvites(data: unknown): Invite[] {
	if (typeof data !== 'object' || data === null) return [];
	const invites: Invite[] = [];
	for (const node of asArray<unknown>((data as { ur?: unknown }).ur as never)) {
		const id = Number(field(node, 'id'));
		if (!Number.isFinite(id) || id <= 0 || Number(field(node, 't')) !== INVITE_TYPE) continue;
		invites.push({
			id,
			uid: Number(field(node, 'uid')) || 0,
			npc: Number(field(node, 'v2')) || 0,
			fightId: Number(field(node, 'v3')) || 0,
			guild: Number(field(node, 'v5')) || 0,
			players: Number(field(node, 'd1')) || 0,
			name: field(node, 'n'),
			others: [],
		});
	}
	return invites;
}

/** Разбить список на порции. */
export function chunks<T>(list: readonly T[], size = CHUNK): T[][] {
	const result: T[][] = [];
	for (let index = 0; index < list.length; index += size) result.push(list.slice(index, index + size));
	return result;
}

/**
 * Приглашения, на которые игрок может откликнуться: для всех или для его гильдии (`clanId` — гильдия игрока, 0 — без гильдии).
 * Повторы по номеру сообщения убираются. Если на один бой зовут несколько игроков, остаётся одно приглашение (самое новое),
 * а остальные приглашающие попадают в `others`.
 */
export function visibleInvites(invites: readonly Invite[], clanId: number): Invite[] {
	const seen = new Set<number>();
	const byFight = new Map<number, Invite>();
	const result: Invite[] = [];
	for (const invite of invites) {
		if (seen.has(invite.id)) continue;
		seen.add(invite.id);
		if (invite.guild !== 0 && invite.guild !== clanId) continue;
		const same = invite.fightId ? byFight.get(invite.fightId) : undefined;
		if (!same) {
			const entry = { ...invite, others: [...invite.others] };
			if (invite.fightId) byFight.set(invite.fightId, entry);
			result.push(entry);
			continue;
		}
		// Главным остаётся самое новое приглашение, прежний приглашающий уходит в остальные
		const [newer, older] = invite.id > same.id ? [invite, same] : [same, invite];
		const merged = {
			...newer,
			others: [...new Set([...newer.others, ...older.others, older.uid].filter((uid) => uid !== newer.uid))],
			players: Math.max(newer.players, older.players),
		};
		result[result.indexOf(same)] = merged;
		byFight.set(invite.fightId, merged);
	}
	return result;
}

/** Порядок в списке: чем больше id босса, тем он сильнее и выше; при равенстве — где больше игроков, затем новее приглашение. */
export function sortInvites(invites: readonly Invite[]): Invite[] {
	return [...invites].sort((a, b) => b.npc - a.npc || b.players - a.players || b.id - a.id);
}

/**
 * Приглашения всех указанных игроков. Запросы идут по одному, порциями по 300 игроков (аккаунт игры принимает не чаще
 * запроса в секунду, лишнее `getData` само подождёт). Если хоть одна порция не получила ответ — null, чтобы не показать
 * неполный список как полный. `pauseMs` — пауза между порциями.
 */
export async function fetchInvites(server: number, auth: GameAuth, ids: readonly number[], pauseMs = 0): Promise<Invite[] | null> {
	const all: Invite[] = [];
	const parts = chunks(ids);
	for (let index = 0; index < parts.length; index++) {
		if (index > 0 && pauseMs) await wait(pauseMs);
		const part = parts[index]!;
		const sdata = `<data>${part.map((id) => `<u>${id}</u>`).join('')}</data>`;
		const data = await getGame(server, { i: 67, sdata, t: 33, d: Date.now() }, auth);
		if (data === null || data === undefined) return null;
		all.push(...parseInvites(data));
	}
	return all;
}
