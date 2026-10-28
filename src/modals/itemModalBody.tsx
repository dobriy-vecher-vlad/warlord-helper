import type { ComponentType } from 'react';
import type { ItemRef } from '../lib/items';

/**
 * Содержимое окна предмета вместе с каталогом предметов грузится с первым открытым разделом
 * (окно предмета открывается только из раздела), поэтому в основной бандл каталог не попадает.
 */
let body: ComponentType<{ data: ItemRef }> | null = null;

/** Содержимое окна предмета уже загружено. */
export const isItemModalBodyLoaded = () => body !== null;

/** Содержимое окна предмета: пока оно не загружено, пусто. */
export function ItemModalBodyHost({ data }: { data: ItemRef }) {
	const Body = body;
	return Body ? <Body data={data} /> : null;
}

export async function loadItemModalBody() {
	if (!body) body = (await import('./ItemModal')).ItemModalBody;
}
