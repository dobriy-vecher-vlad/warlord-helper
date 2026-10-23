/**
 * Параметры ссылок вида `#view=map&panel=3&modal=12`.
 * Формат совпадает со старым приложением: пары через `&`, ключ и значение через `=`, значения не декодируются.
 */
export type HashParams = Record<string, string | undefined>;

export function parseParams(string = ''): HashParams {
	const params: HashParams = {};
	if (!string.length) return params;
	for (const param of string.slice(1).split('&')) {
		// Значение может содержать «=»: делим только по первому
		const eq = param.indexOf('=');
		if (eq === -1) params[param] = undefined;
		else params[param.slice(0, eq)] = param.slice(eq + 1);
	}
	return params;
}

export const parseHash = (): HashParams => parseParams(window.location.hash);
export const parseQuery = (): HashParams => parseParams(window.location.search);

/** Ссылка на раздел: `#view=…&panel=…&modal=…`. */
export function buildLink(base: string, view?: string | null, panel?: string | null, modal?: string | number | null): string {
	const parts: string[] = [];
	if (view) parts.push(`view=${view}`);
	if (panel) parts.push(`panel=${panel}`);
	if (modal) parts.push(`modal=${modal}`);
	return parts.length ? `${base}#${parts.join('&')}` : base;
}
