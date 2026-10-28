import { useCallback, useEffect, useState } from 'react';
import { Spinner, type SpinnerProps } from '@vkontakte/vkui';
import { useOnChange } from '../lib/useOnChange';

/** Уже загруженные картинки: при повторном показе спиннер не появляется вовсе. */
const loaded = new Set<string>();

function useImagesLoaded(urls: string[]) {
	const key = urls.join('\n');
	const cached = (list: string[]) => list.every((url) => loaded.has(url));
	const [done, setDone] = useState(() => cached(urls));
	// Другие картинки: спиннер возвращается, если их ещё нет в кэше
	useOnChange([key], () => setDone(cached(key ? key.split('\n') : [])));
	useEffect(() => {
		const list = key ? key.split('\n') : [];
		if (cached(list)) return;
		let cancelled = false;
		let left = list.length;
		for (const url of list) {
			const image = new Image();
			// Ошибка загрузки тоже убирает спиннер: крутиться вечно ему незачем
			image.onload = image.onerror = () => {
				loaded.add(url);
				if (--left === 0 && !cancelled) setDone(true);
			};
			image.src = url;
		}
		return () => {
			cancelled = true;
		};
	}, [key]);
	return done;
}

/**
 * Загружена ли картинка `<img>`: события самой картинки, без отдельной загрузки —
 * иначе `loading="lazy"` перестал бы работать и браузер сразу качал бы все картинки страницы.
 */
export function useImgLoaded() {
	const [loaded, setLoaded] = useState(false);
	const done = useCallback(() => setLoaded(true), []);
	// Картинка из кэша может загрузиться раньше, чем React подпишется на onLoad
	const ref = useCallback((img: HTMLImageElement | null) => {
		if (img?.complete && img.naturalWidth) setLoaded(true);
	}, []);
	return { loaded, imgProps: { ref, onLoad: done, onError: done } };
}

interface PreloadProps extends SpinnerProps {
	/** Картинки (обычно CSS-фоны), пока грузятся которые, виден спиннер */
	src: string | string[];
}

/**
 * Спиннер под картинкой, пока она грузится. После загрузки спиннер убирается из разметки:
 * в старом приложении он продолжал крутиться под картинкой, а на странице с десятками плиток
 * это постоянная нагрузка на отрисовку.
 */
export function Preload({ src, ...props }: PreloadProps) {
	const done = useImagesLoaded(Array.isArray(src) ? src : [src]);
	return done ? null : <Spinner {...props} />;
}
