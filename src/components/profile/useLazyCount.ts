import { useEffect, useRef, useState } from 'react';
import { useIsDesktop } from '../../app/layout';
import { useOnChange } from '../../lib/useOnChange';

/**
 * Порционная подгрузка списка по мере прокрутки (InfiniteScroll в старом приложении): сколько элементов показано,
 * ссылки на прокручиваемый блок и на метку в конце списка. Смена `resetKey` возвращает список к началу.
 * На ПК прокручивается блок заданной высоты, на телефоне — страница.
 */
export function useLazyCount(total: number, step: number, resetKey: unknown) {
	const isDesktop = useIsDesktop();
	const [count, setCount] = useState(step);
	const scroll = useRef<HTMLDivElement>(null);
	const sentinel = useRef<HTMLDivElement>(null);

	// Новый список (поиск, фильтр): показ с начала и прокрутка вверх
	useOnChange([resetKey], () => setCount(step));
	// Раскладка читается через ref, чтобы смена ширины окна сама прокрутку не вызывала
	const desktop = useRef(isDesktop);
	useEffect(() => {
		desktop.current = isDesktop;
	});
	useEffect(() => {
		scroll.current?.scrollTo({ top: 0 });
		if (!desktop.current) document.documentElement.scrollTo({ top: 0 });
	}, [resetKey]);

	useEffect(() => {
		const target = sentinel.current;
		if (!target || count >= total) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) setCount((value) => value + step);
			},
			{ root: isDesktop ? scroll.current : null, rootMargin: '200px' },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [count, total, step, isDesktop]);

	return { count, scroll, sentinel, hasMore: count < total };
}
