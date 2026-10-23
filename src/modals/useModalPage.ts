import { useModalMotion } from './useModalMotion';
import { useSheetHeight } from './useSheetHeight';

/**
 * Общие свойства окон-страниц (ModalPage): ширина, затемнение и анимация, высота шторки на телефоне.
 * `ref` — на блок содержимого, по нему считается высота; `headerHeight` — высота шапки окна на телефоне.
 */
export function useModalPage(open: boolean, headerHeight?: number) {
	const { ref, sheetProps } = useSheetHeight(open, headerHeight);
	const motion = useModalMotion();
	return { ref, pageProps: { size: 420 as const, ...motion, ...sheetProps } };
}
