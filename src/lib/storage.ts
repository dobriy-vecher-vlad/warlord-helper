import bridge from '@vkontakte/vk-bridge';
import { isEmbedded } from './platform';

/**
 * Постоянное хранилище. Внутри ВК — VK Storage (данные привязаны к профилю и переносятся между устройствами),
 * вне ВК — localStorage, а если он недоступен — память страницы.
 * В VK Storage пустая строка означает «значения нет», поэтому удаление = запись пустой строки.
 */
const memory = new Map<string, string>();

/** localStorage проверяется записью один раз: в приватных режимах и с запретом на хранение он бросает исключение. */
let localChecked: Storage | null | undefined;

function local(): Storage | null {
	if (localChecked !== undefined) return localChecked;
	try {
		const probe = '__storage_probe__';
		localStorage.setItem(probe, probe);
		localStorage.removeItem(probe);
		localChecked = localStorage;
	} catch {
		localChecked = null;
	}
	return localChecked;
}

/** Мост ВК иногда не отвечает вовсе: без предела запрос завис бы навсегда и заставка осталась бы на экране. */
const BRIDGE_TIMEOUT_MS = 10_000;

const withTimeout = <T>(promise: Promise<T>): Promise<T> =>
	new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => reject(new Error('timeout')), BRIDGE_TIMEOUT_MS);
		promise.then(
			(value) => (window.clearTimeout(timer), resolve(value)),
			(error) => (window.clearTimeout(timer), reject(error)),
		);
	});

/** Результат чтения: `ok: false` — прочитать не удалось (сеть, таймаут), это не то же самое, что «значения нет». */
export interface StorageRead {
	ok: boolean;
	value: string | null;
}

export async function storageRead(key: string): Promise<StorageRead> {
	if (isEmbedded()) {
		try {
			const data = await withTimeout(bridge.send('VKWebAppStorageGet', { keys: [key] }));
			return { ok: true, value: data.keys[0]?.value || null };
		} catch {
			return { ok: false, value: null };
		}
	}
	try {
		return { ok: true, value: (local() ? localStorage.getItem(key) : memory.get(key)) || null };
	} catch {
		return { ok: false, value: null };
	}
}

export async function storageGet(key: string): Promise<string | null> {
	return (await storageRead(key)).value;
}

/** Возвращает true, если значение сохранено. */
export async function storageSet(key: string, value: string): Promise<boolean> {
	if (isEmbedded()) {
		try {
			await withTimeout(bridge.send('VKWebAppStorageSet', { key, value }));
			return true;
		} catch {
			return false;
		}
	}
	try {
		if (local()) localStorage.setItem(key, value);
		else memory.set(key, value);
		return true;
	} catch {
		return false;
	}
}

export const storageRemove = (key: string) => storageSet(key, '');

/**
 * Прочитать значение, а если его нет — записать и вернуть значение по умолчанию. Если прочитать не удалось, ничего не записывается
 * (иначе сбой сети затёр бы сохранённые данные значением по умолчанию) и возвращается значение по умолчанию.
 */
export async function storageGetOrSet(key: string, defaultValue: string): Promise<string> {
	const { ok, value } = await storageRead(key);
	if (value || !ok) return value ?? defaultValue;
	await storageSet(key, defaultValue);
	return defaultValue;
}

/**
 * Значение с отметкой, было ли оно сохранено раньше (коды старого Storage: 1 — было, 3 — записано значение
 * по умолчанию). По коду старое приложение понимало, что окно показывается впервые. `failed` — прочитать не удалось:
 * по умолчанию ничего не записано, и вызывающий решает, что делать (не показывать окна, не продолжать запуск).
 */
export async function storageGetWithDefault(key: string, defaultValue: string): Promise<{ value: string; existed: boolean; failed: boolean }> {
	const { ok, value } = await storageRead(key);
	if (!ok) return { value: defaultValue, existed: true, failed: true };
	if (value) return { value, existed: true, failed: false };
	await storageSet(key, defaultValue);
	return { value: defaultValue, existed: false, failed: false };
}
