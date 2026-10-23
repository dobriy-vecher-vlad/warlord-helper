import { useIsDesktop } from '../app/layout';
import { useInstantModal } from '../store/modal';

/**
 * Пропсы ModalPage / ModalCard. Затемнение рисует приложение (ModalOverlayLayer): у каждого окна оно своё, и при переходе между окнами
 * одно слой гаснет, а другой появляется, отчего экран мигает. На телефоне шторка окна выезжает и уходит всегда;
 * на ПК окно стоит по центру, и между окнами плавность выглядит как мигание, поэтому там анимации отключены.
 */
export function useModalMotion() {
	const isDesktop = useIsDesktop();
	const instant = useInstantModal();
	return { disableModalOverlay: true, disableOpenAnimation: isDesktop && instant, disableCloseAnimation: isDesktop && instant };
}
