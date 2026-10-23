/**
 * Данные главной панели раздела, которые берутся из самих данных раздела: картинки баннера и количество записей
 * в каждом подразделе. Лежат в модуле раздела и грузятся вместе с ним, а не вместе с приложением.
 */
export interface HubData {
	/** Картинки баннера, путь внутри media/images/ */
	images: string[];
	/** Количество записей по id подраздела; у подразделов без счётчика — нет */
	counts: Record<string, number>;
}

/** Суммарное количество элементов во вложенных списках: [{ items: [...] }, ...] */
export const nested = <K extends string>(groups: ReadonlyArray<{ [P in K]: readonly unknown[] }>, key: K) => groups.reduce((sum, group) => sum + group[key].length, 0);
