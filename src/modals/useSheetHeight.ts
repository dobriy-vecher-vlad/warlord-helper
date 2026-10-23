import { useLayoutEffect, useRef, useState } from 'react';

/** Высота шапки шторки на телефоне (см. ModalShell). */
const HEADER_HEIGHT = 60;

/**
 * Высота открытия шторки, как в VKUI 4: если содержимое помещается на экран — по его высоте,
 * иначе на 75% экрана. Замер делается до отрисовки, поэтому шторка не «прыгает».
 * Возвращает ref для блока содержимого и свойства для ModalPage.
 */
export function useSheetHeight(open: boolean, headerHeight = HEADER_HEIGHT) {
	const ref = useRef<HTMLDivElement>(null);
	const [fits, setFits] = useState(true);

	useLayoutEffect(() => {
		if (!open || !ref.current) return;
		setFits(ref.current.offsetHeight + headerHeight <= window.innerHeight);
	}, [open, headerHeight]);

	return { ref, sheetProps: fits ? { dynamicContentHeight: true } : { settlingHeight: 75 } };
}
