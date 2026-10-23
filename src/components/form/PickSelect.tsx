import type { ReactNode } from 'react';
import { SelectMimicry } from '@vkontakte/vkui';
import { PATH_IMAGES } from '../../config';
import { Photo } from '../Photo';

interface PickSelectProps {
	/** Картинка слева, путь внутри media/images/ */
	image?: string;
	placeholder?: string;
	/** Открыть страницу выбора */
	onClick: () => void;
	className?: string;
	/** Выбранное значение */
	children?: ReactNode;
}

/** Поле выбора, которое ведёт на отдельную страницу со списком (SelectMimicry VKUI): выбранное значение с картинкой 24px. */
export function PickSelect({ image, placeholder = 'Не выбран', onClick, className, children }: PickSelectProps) {
	return (
		<SelectMimicry className={className} before={image ? <Photo src={`${PATH_IMAGES}${image}`} size={24} scale={1.15} /> : undefined} placeholder={placeholder} onClick={onClick}>
			{children}
		</SelectMimicry>
	);
}
