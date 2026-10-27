import type { BotAuth } from '../bots/common';
import { fetchBoss, type FightInfo, type Npc } from './accept';

/** Попытки на босса недавно запрашивались: ответ живёт 20 секунд, чтобы повторное открытие списка не слало запросы заново. */
const TTL_MS = 20_000;
const cache = new Map<string, { at: number; info: FightInfo | null }>();
/** Сколько раз ответы забывали: очередь, стоявшая на паузе, по нему понимает, что её значения устарели. */
let epoch = 0;

/** Забыть сохранённые ответы: попытки изменились (бой создан, принят или закончен), прежние значения устарели. */
export const clearAttempts = () => {
	cache.clear();
	epoch++;
};

/** Сколько попыток осталось на босса (`i: 10`); null — данных нет. */
export async function loadAttempts(bot: BotAuth, npc: Npc, now = Date.now()): Promise<FightInfo | null> {
	const key = `${bot.server}:${bot.auth.login}:${npc.id}`;
	const hit = cache.get(key);
	if (hit && now - hit.at < TTL_MS) return hit.info;
	const info = await fetchBoss(bot, npc);
	// Сбой (нет ответа) не запоминается: следующий запрос попробует снова
	if (info) cache.set(key, { at: Date.now(), info });
	return info;
}

/**
 * Очередь запросов попыток для боссов, которые видны на экране сейчас. Запросы идут по одному (сервер принимает не чаще запроса
 * в секунду), результат передаётся сразу, как только пришёл. Босс, ушедший с экрана до своей очереди (быстрая прокрутка), из очереди
 * убирается и не запрашивается; уже полученный ответ остаётся и показывается, когда строка вернётся.
 */
export class AttemptsQueue {
	/** Боссы, чьи строки на экране сейчас */
	private readonly visible = new Set<number>();
	/** Боссы, чьи попытки уже получены */
	private readonly done = new Set<number>();
	private readonly queue: number[] = [];
	/** Босс, чей запрос в пути */
	private current: number | null = null;
	private running = false;
	private stopped = false;
	/** Пауза: поверх страницы открыто окно или вкладка скрыта; с чем запросы не идут (null — не на паузе) */
	private pausedAt: { time: number; epoch: number } | null = null;

	constructor(
		private readonly bot: BotAuth,
		private readonly npcs: ReadonlyMap<number, Npc>,
		private readonly onResult: (id: number, info: FightInfo | null) => void,
	) {}

	/** Строка босса попала на экран: поставить в очередь, если его попыток ещё нет (повторный вызов ничего не делает). */
	request(id: number) {
		if (this.stopped || !this.npcs.has(id)) return;
		this.visible.add(id);
		if (this.done.has(id) || this.current === id || this.queue.includes(id)) return;
		this.queue.push(id);
		void this.run();
	}

	/** Строка босса ушла с экрана: если очередь до него не дошла, запрос отменяется. */
	cancel(id: number) {
		this.visible.delete(id);
		const index = this.queue.indexOf(id);
		if (index !== -1) this.queue.splice(index, 1);
	}

	/** Спросить заново тех, кто на экране (вкладка снова видна: за это время попытки могли измениться); остальным ответ устарел. */
	refresh() {
		if (this.stopped) return;
		clearAttempts();
		this.done.clear();
		for (const id of this.visible) if (this.current !== id && !this.queue.includes(id)) this.queue.push(id);
		void this.run();
	}

	/** Страница потеряла фокус (открыто окно, вкладка скрыта): новые запросы не уходят, запрос в пути дорабатывает. */
	pause() {
		this.pausedAt ??= { time: Date.now(), epoch };
	}

	/**
	 * Фокус вернулся: очередь продолжается. Если за паузу ответы забыли (бой создан, принят или закончен) или они состарились,
	 * спрашиваются заново те, кто на экране.
	 */
	resume() {
		const paused = this.pausedAt;
		if (!paused) return;
		this.pausedAt = null;
		if (this.stopped) return;
		if (paused.epoch !== epoch || Date.now() - paused.time >= TTL_MS) this.refresh();
		else void this.run();
	}

	stop() {
		this.stopped = true;
		this.queue.length = 0;
	}

	private async run() {
		if (this.running || this.pausedAt) return;
		this.running = true;
		try {
			for (let id = this.queue.shift(); id !== undefined && !this.stopped; id = this.pausedAt ? undefined : this.queue.shift()) {
				this.current = id;
				const info = await loadAttempts(this.bot, this.npcs.get(id)!);
				this.current = null;
				if (this.stopped) break;
				this.done.add(id);
				this.onResult(id, info);
			}
		} finally {
			this.current = null;
			this.running = false;
		}
	}
}
