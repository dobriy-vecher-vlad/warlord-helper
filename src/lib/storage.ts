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

export async function storageGet(key: string): Promise<string | null> {
	if (isEmbedded()) {
		try {
			const data = await bridge.send('VKWebAppStorageGet', { keys: [key] });
			return data.keys[0]?.value || null;
		} catch {
			return null;
		}
	}
	return (local() ? localStorage.getItem(key) : memory.get(key)) || null;
}

/** Возвращает true, если значение сохранено. */
export async function storageSet(key: string, value: string): Promise<boolean> {
	if (isEmbedded()) {
		try {
			await bridge.send('VKWebAppStorageSet', { key, value });
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

/** Прочитать значение, а если его нет — записать и вернуть значение по умолчанию. */
export async function storageGetOrSet(key: string, defaultValue: string): Promise<string> {
	const value = await storageGet(key);
	if (value) return value;
	await storageSet(key, defaultValue);
	return defaultValue;
}

/**
 * Значение с отметкой, было ли оно сохранено раньше (коды старого Storage: 1 — было, 3 — записано значение
 * по умолчанию). По коду старое приложение понимало, что окно показывается впервые.
 */
export async function storageGetWithDefault(key: string, defaultValue: string): Promise<{ value: string; existed: boolean }> {
	const value = await storageGet(key);
	if (value) return { value, existed: true };
	await storageSet(key, defaultValue);
	return { value: defaultValue, existed: false };
}
