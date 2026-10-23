import { ModalPage } from '@vkontakte/vkui';
import type { ItemRef } from '../lib/items';
import { backModal } from '../store/modal';
import { getItemModalBody } from './itemModalBody';
import { useModalPage } from './useModalPage';

/** Окно предмета без шапки. Содержимое грузится вместе с первым разделом (см. itemModalBody). */
export function ItemModalWindow({ open, item }: { open: boolean; item: ItemRef | null }) {
	const { ref, pageProps } = useModalPage(open, 0);
	const Body = getItemModalBody();
	if (!item || !Body) return null;
	return (
		<ModalPage id="item" open={open} onClose={backModal} {...pageProps}>
			<div className="ItemModalContent" ref={ref}>
				<Body data={item} />
			</div>
		</ModalPage>
	);
}
