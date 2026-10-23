import type { ComponentType } from 'react';
import type { ItemRef } from '../lib/items';

/**
 * Содержимое окна предмета вместе с каталогом предметов грузится с первым открытым разделом
 * (окно предмета открывается только из раздела), поэтому в основной бандл каталог не попадает.
 */
let body: ComponentType<{ data: ItemRef }> | null = null;

export const getItemModalBody = () => body;

export async function loadItemModalBody() {
	if (!body) body = (await import('./ItemModal')).ItemModalBody;
}
