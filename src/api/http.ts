import { parseResponse } from './parse';

const THROTTLE_MESSAGES = ['Err. More than 1 request per second', 'Too many requests per second.'];
const THROTTLE_HOST = 'tmp1-fb.geronimo.su';

/** Приоритеты запросов к игровому серверу: чем больше, тем раньше уходит запрос из очереди. */
export const PRIORITY = { background: 0, window: 1, action: 2 } as const;

/** Если запрос завис, очередь освобождается через это время: один зависший запрос не должен остановить все остальные. */
const SLOT_MS = 15_000;

interface Waiting {
	priority: number;
	order: number;
	go: () => void;
}

const waiting: Waiting[] = [];
let active = false;
let blockedUntil = 0;
let counter = 0;
let timer = 0;

/** Выпустить следующий запрос: сначала более важные, при равенстве — прежние. После ответа «слишком часто» очередь ждёт секунду. */
function pump() {
	if (active || !waiting.length) return;
	const delay = blockedUntil - Date.now();
	if (delay > 0) {
		if (!timer)
			timer = window.setTimeout(() => {
				timer = 0;
				pump();
			}, delay);
		return;
	}
	waiting.sort((a, b) => b.priority - a.priority || a.order - b.order);
	active = true;
	waiting.shift()!.go();
}

/**
 * Встать в очередь запросов к игровому серверу: в пути один запрос, остальные ждут по важности (удар или вход в бой не стоит за
 * опросом приглашений и подсказками). Пауза между запросами не вводится: сервер отвечает быстро, а лимит «раз в секунду»
 * обрабатывается ответом «слишком часто». Возвращает функцию, которой запрос освобождает очередь.
 */
function acquire(priority: number): Promise<() => void> {
	return new Promise((resolve) => {
		waiting.push({
			priority,
			order: ++counter,
			go: () => {
				let released = false;
				const release = () => {
					if (released) return;
					released = true;
					window.clearTimeout(slot);
					active = false;
					pump();
				};
				const slot = window.setTimeout(release, SLOT_MS);
				resolve(release);
			},
		});
		pump();
	});
}

/** Разбор query-строки без декодирования значений (как в старом parseQueryString). */
function parseQueryString(search: string): Record<string, string | undefined> {
	const result: Record<string, string | undefined> = {};
	if (!search) return result;
	for (const param of search.slice(1).split('&')) {
		const [key = '', value] = param.split('=');
		result[key] = value;
	}
	return result;
}

function getFormData(link: string): FormData {
	const body = parseQueryString(new URL(link).search);
	const data = new FormData();
	for (const [key, value] of Object.entries(body)) data.append(key, String(value));
	return data;
}

/**
 * GET/POST-запрос к игровому серверу и разбор ответа.
 * Запросы к tmp1-fb.geronimo.su уходят POST-ом (параметры из query в теле), при 500 — повторяются GET-ом.
 * При превышении лимита запросов ждёт секунду и повторяет, пока сервер не ответит.
 * Любая ошибка сети или разбора -> null.
 */
export async function getData(link: string, priority: number = PRIORITY.background): Promise<any> {
	try {
		link = link.replace(/%2B/g, '+').replace(/%3D/g, '=');
		let response: Response;
		let text: string;
		if (link.includes(THROTTLE_HOST)) {
			const release = await acquire(priority);
			try {
				const url = new URL(link);
				response = await fetch(url.origin + url.pathname, { method: 'POST', body: getFormData(link) });
				if (response.status === 500) response = await fetch(link);
				text = await response.text();
				// Сервер просит подождать: вся очередь ждёт секунду, запрос повторится со своим приоритетом
				if (THROTTLE_MESSAGES.includes(text)) blockedUntil = Date.now() + 1000;
			} finally {
				release();
			}
		} else {
			response = await fetch(link);
			text = await response.text();
		}
		if (THROTTLE_MESSAGES.includes(text)) return await getData(link, priority);
		return parseResponse(text);
	} catch {
		return null;
	}
}
