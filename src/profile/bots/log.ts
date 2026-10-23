/** Сколько записей хранит лог бота: дольше бот работает часами, а список из тысяч записей замедляет страницу. */
export const LOG_LIMIT = 500;

/** Добавить запись; старые записи сверх лимита отбрасываются. */
export function appendLog<T>(list: readonly T[], entry: T, limit = LOG_LIMIT): T[] {
	return list.length >= limit ? [...list.slice(list.length - limit + 1), entry] : [...list, entry];
}
