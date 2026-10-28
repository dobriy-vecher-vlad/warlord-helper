import { ModalPage } from '@vkontakte/vkui';
import type { ItemRef } from '../lib/items';
import { backModal } from '../store/modal';
import { ItemModalBodyHost, isItemModalBodyLoaded } from './itemModalBody';
import { useModalPage } from './useModalPage';

/** Окно предмета без шапки и без крестика (закрывается свайпом или тапом по фону). Содержимое грузится вместе с первым разделом (см. itemModalBody). */
export function ItemModalWindow({ open, item }: { open: boolean; item: ItemRef | null }) {
	const { ref, pageProps } = useModalPage(open, 0);
	if (!item || !isItemModalBodyLoaded()) return null;
	return (
		<ModalPage id="item" open={open} onClose={backModal} {...pageProps}>
			<div className="ItemModalContent" ref={ref}>
				<ItemModalBodyHost data={item} />
			</div>
		</ModalPage>
	);
}
