import X2JS from './xml2js.js';

const x2js = new X2JS();

/**
 * Игровой сервер отвечает XML, причём не всегда валидным: значения атрибутов могут содержать
 * сырые `&`, `<`, `>` и кавычки. Поэтому каждое значение в кавычках перекладывается в двойные
 * кавычки с экранированием спецсимволов. Логика перенесена из старого getData без изменений.
 */
export function fixXml(text: string): string {
	return text.replace(
		/('(.+?|)??'|"(.+?|)??")/g,
		(_match, _p1, p2, p3) => `"${(p3 || p2 || '').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`,
	);
}

/**
 * Ответ сервера -> объект. Сначала пробуем JSON, затем «чиним» и разбираем XML.
 * Если есть корневой узел `data`, возвращается его содержимое.
 * Если разобрать не удалось, возвращается исходный текст (или null для пустого ответа).
 */
export function parseResponse(text: string): any {
	let data: any;
	try {
		data = JSON.parse(text);
	} catch {
		data = x2js.xml_str2json(fixXml(text));
	}
	if (data && data.data !== undefined) data = data.data;
	return data || text || null;
}
