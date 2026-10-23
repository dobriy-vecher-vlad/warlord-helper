/** Число с разделителем тысяч: 1234567 -> «1 234 567». */
export function numberSpaces(number: number | string = 0, symbol = ' '): string {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol);
}

/** Падежные формы для счётчика: «1 предмет», «2 предмета», «5 предметов». */
export type Forms = readonly [string, string, string];

/** Склонение по числу: numberForm(5, ['предмет', 'предмета', 'предметов']) -> «предметов». */
export function numberForm(number: number, titles: readonly string[]): string {
	number = Math.abs(number);
	const cases = [2, 0, 1, 1, 1, 2];
	return titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]!] ?? '';
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Секунды -> «чч:мм:сс». Отрицательные и нецелые значения считаются нулём. */
export function getTime(seconds: number | string = 0): string {
	let s = Number(seconds);
	if (s < 0 || !Number.isInteger(s)) s = 0;
	const hours = Math.floor(s / 3600);
	const minutes = Math.floor((s / 60) % 60);
	return `${hours.toString().length === 1 ? `0${hours}` : hours}:${pad(minutes)}:${pad(s % 60)}`;
}

/** Короткая запись большого числа для тесного места: 41158594 -> «41,2 млн», 950000 -> «950 тыс.», до тысячи без изменений. */
export function compactNumber(number: number): string {
	const value = Math.abs(number);
	const units: [number, string][] = [
		[1e9, ' млрд'],
		[1e6, ' млн'],
		[1e3, ' тыс.'],
	];
	for (const [size, suffix] of units) {
		if (value < size) continue;
		const scaled = value / size;
		const text = scaled >= 100 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '').replace('.', ',');
		return `${number < 0 ? '-' : ''}${text}${suffix}`;
	}
	return String(number);
}
