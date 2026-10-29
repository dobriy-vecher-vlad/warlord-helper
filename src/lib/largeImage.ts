import { useReducer } from 'react';

/** Расширение, которое сейчас у картинок: при переводе файлов в WebP менять только здесь и в самих файлах/данных. */
const EXT = /\.(png|webp)$/;
const LARGE = /x\.(png|webp)$/;

/**
 * Папки, в которых у файлов есть большая версия с суффиксом `x` (`bosses/icons/274.png` → `274x.png`, в 4 раза крупнее по стороне
 * и в 10–13 раз тяжелее). У `items/` большая есть не у всех: если файла нет, подставляется обычный (см. `useLargeFile`).
 */
const WITH_LARGE = /^(bosses\/icons|items|keys|rooms|stones|collections|labels)\/\d+\.(png|webp)$/;

/** Большая версия файла; у уже большой возвращается она же. */
export const largeImage = (path: string) => (LARGE.test(path) ? path : path.replace(EXT, 'x.$1'));

/** Обычная версия большого файла. */
export const regularImage = (path: string) => path.replace(/x\.(png|webp)$/, '.$1');

/** Большая версия для файлов из папок, где она есть (только `N.png`, не `Nb.png` и не уже большие); остальные пути не меняются. */
export const preferLarge = (path: string) => (WITH_LARGE.test(path) ? largeImage(path) : path);

/** Большие файлы, которых на сервере нет: повторно не запрашиваются (у вещей большие есть не у всех). */
const missing = new Set<string>();
export const isMissingLarge = (path: string) => missing.has(path);
export const markMissingLarge = (path: string) => void missing.add(path);

/**
 * Файл картинки для `<img>`: большой, если он есть, иначе обычный. `onError` вешается на `<img>`: не нашлась большая версия —
 * запоминается и подставляется обычная.
 */
export function useLargeFile(path: string) {
	const [, update] = useReducer((count: number) => count + 1, 0);
	const wanted = preferLarge(path);
	const file = isMissingLarge(wanted) ? regularImage(wanted) : wanted;
	const onError = () => {
		if (file === wanted && wanted !== path) {
			markMissingLarge(wanted);
			update();
		}
	};
	return { file, onError };
}
