import type { ImgHTMLAttributes, ReactNode } from 'react';
import { PATH_IMAGES } from '../config';

interface BorderedImageProps {
	/** Путь картинки внутри media/images/ */
	src: string;
	/** Размер и скругление рамки; обводку добавляет сам компонент */
	className?: string;
	/** Свойства `<img>` (обработчики загрузки и т. п.) */
	imgProps?: ImgHTMLAttributes<HTMLImageElement>;
	/** Содержимое перед картинкой (например, спиннер загрузки) */
	children?: ReactNode;
}

/** Папки, где белая обводка нарисована в самой картинке: её убираем (ImageCrop в shell.css). */
const CROPPED = /^(stones|rooms|keys|collections|bosses\/icons|items)\//;

/** У картинки из этих папок белая обводка нарисована в самом файле. */
export const hasBakedBorder = (src: string) => CROPPED.test(src);

/** Картинка из media/images/ в рамке с тонкой обводкой (у картинок из CROPPED вшитая белая обводка срезается); загружается лениво, когда подходит к экрану. */
export function BorderedImage({ src, className, imgProps, children }: BorderedImageProps) {
	return (
		<span className={`${className ?? ''} ImageBorder ${hasBakedBorder(src) ? 'ImageCrop' : ''}`}>
			{children}
			<img src={`${PATH_IMAGES}${src}`} alt="" loading="lazy" {...imgProps} />
		</span>
	);
}
