import type { ReactNode } from 'react';
import type { ModalHead } from '../ModalShell';

/** Содержимое окна описания: шапка (без ссылки — её добавляет открывающий) и тело. */
export interface DescriptionContent {
	head: Omit<ModalHead, 'link'>;
	body: ReactNode;
}
