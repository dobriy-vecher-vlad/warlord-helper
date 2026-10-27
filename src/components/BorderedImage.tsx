import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';
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

/** Иконки боссов есть не у всех: у рейдовых, походов и прочих файла нет, вместо него показывается иконка первого босса. */
const BOSS_ICON = /^bosses\/icons\//;
const BOSS_ICON_FALLBACK = 'bosses/icons/1.png';

/** Картинка из media/images/ в рамке с тонкой обводкой (у картинок из CROPPED вшитая белая обводка срезается); загружается лениво, когда подходит к экрану. */
export function BorderedImage({ src, className, imgProps, children }: BorderedImageProps) {
	// Адрес, для которого файла не нашлось: при смене картинки ошибка прежней не действует
	const [missing, setMissing] = useState<string | null>(null);
	const shown = missing === src && BOSS_ICON.test(src) ? BOSS_ICON_FALLBACK : src;
	return (
		<span className={`${className ?? ''} ImageBorder ${hasBakedBorder(src) ? 'ImageCrop' : ''}`}>
			{children}
			<img
				src={`${PATH_IMAGES}${shown}`}
				alt=""
				loading="lazy"
				{...imgProps}
				onError={(event) => {
					if (BOSS_ICON.test(src) && shown !== BOSS_ICON_FALLBACK) setMissing(src);
					imgProps?.onError?.(event);
				}}
			/>
		</span>
	);
}
