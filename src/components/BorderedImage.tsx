import { useEffect, useRef, useState, type CSSProperties, type ImgHTMLAttributes, type ReactNode } from 'react';
import { PATH_IMAGES } from '../config';
import { isMissingLarge, markMissingLarge, preferLarge } from '../lib/largeImage';

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

/** Плитки валют с фоном (`currency/all/m1_big.png`, 67×71): белая обводка нарисована в самом файле, как у картинок из CROPPED. */
export const isCurrencyTile = (src: string) => /^currency\/all\/\w+_big\.png$/.test(src);

/** У картинки из этих папок белая обводка нарисована в самом файле. */
export const hasBakedBorder = (src: string) => CROPPED.test(src) || isCurrencyTile(src);

/**
 * Срез вшитой обводки по папкам, % от размера картинки: [по ширине, по высоте]. Обводка 5px при размере файла 67×71 даёт 7,5% и 7%,
 * но подобрано на глаз (у боссов и вещей нужно меньше или больше расчётного). Процент не зависит от показанного размера, поэтому
 * срез одинаков и на 36px, и на 128px, и у большой версии файла (`…x.png`, в 4 раза крупнее).
 */
const CROP: [RegExp, [number, number]][] = [
	[/^bosses\/icons\//, [8, 7.6]],
	[/^collections\//, [7.7, 7.2]],
	[/^items\//, [5, 7]],
];
const CROP_DEFAULT: [number, number] = [7.5, 7];

/**
 * Срез вшитой обводки для `.ImageCrop` (см. shell.css); у картинок без вшитой обводки его нет. `--crop-x` и `--crop-y` нужны
 * `object-view-box`, а `--crop-kx` и `--crop-ky` (во сколько раз растянуть картинку, чтобы срез вышел за рамку) — запасному
 * способу для браузеров без него (Safari на iPhone).
 */
export function cropStyle(src: string): CSSProperties | undefined {
	if (!hasBakedBorder(src)) return undefined;
	const [x, y] = CROP.find(([pattern]) => pattern.test(src))?.[1] ?? CROP_DEFAULT;
	return { '--crop-x': `${x}%`, '--crop-y': `${y}%`, '--crop-kx': 1 / (1 - (2 * x) / 100), '--crop-ky': 1 / (1 - (2 * y) / 100) } as CSSProperties;
}

/** Иконки боссов есть не у всех: у рейдовых, походов и прочих файла нет, вместо него показывается иконка первого босса. */
const BOSS_ICON = /^bosses\/icons\//;
const LARGE = /x\.(png|webp)$/;

/**
 * Что показывать, пока файл не нашёлся: у большой картинки (`…x.png`) обычная, у иконки босса в конце иконка первого босса.
 * Большие файлы, которых нет на сервере (у вещей они есть не у всех), пропускаются сразу, без повторного запроса.
 */
const candidates = (src: string) => {
	const list = [src];
	if (LARGE.test(src)) list.push(src.replace(LARGE, '.$1'));
	if (BOSS_ICON.test(src)) list.push(LARGE.test(src) ? 'bosses/icons/1x.png' : 'bosses/icons/1.png');
	return list.filter((path, index) => index === list.length - 1 || !isMissingLarge(path));
};

/**
 * Пока картинка не рядом с экраном, в `<img>` стоит прозрачный пиксель. Без `src` (или с пустым) браузер рисует заглушку «битой» картинки
 * (белая рамка), а так `<img>` остаётся обычной пустой картинкой того же размера.
 */
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Насколько заранее до края экрана картинка начинает загружаться (px). У `loading="lazy"` браузера этот запас в несколько экранов. */
const LOAD_MARGIN = 150;

/**
 * Рамка подошла к области просмотра. Пока нет, картинка не просит файл вовсе: на странице с сотнями плиток грузятся только видимые
 * (родной `loading="lazy"` подтягивает и несколько экранов вперёд). Без IntersectionObserver картинка грузится сразу.
 */
function useNearViewport() {
	const ref = useRef<HTMLSpanElement>(null);
	const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
	useEffect(() => {
		const target = ref.current;
		if (near || !target) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setNear(true);
					observer.disconnect();
				}
			},
			{ rootMargin: `${LOAD_MARGIN}px` },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [near]);
	return { ref, near };
}

/** Свойства `<img>`: `useImgLoaded` (Preload.tsx) передаёт ещё и ref-колбэк. */
type ImgProps = ImgHTMLAttributes<HTMLImageElement> & { ref?: (node: HTMLImageElement | null) => void };

/**
 * Картинка из media/images/ в рамке с тонкой обводкой (у картинок из CROPPED вшитая белая обводка срезается); файл запрашивается,
 * когда рамка подходит к экрану. Пока картинка не загрузилась, у рамки серая подложка (`data-pending`): видно очертание картинки.
 */
export function BorderedImage({ src, className, imgProps, children }: BorderedImageProps) {
	const { ref, near } = useNearViewport();
	// Адреса, для которых файла не нашлось: при смене картинки ошибки прежней не действуют
	const [failed, setFailed] = useState<{ src: string; paths: string[] }>({ src, paths: [] });
	const paths = failed.src === src ? failed.paths : [];
	// В списках и плитках картинка всегда большая (если она есть): на телефоне с плотным экраном обычная была бы мутной
	const wanted = preferLarge(src);
	const shown = candidates(wanted).find((path) => !paths.includes(path)) ?? wanted;
	// Какой файл уже показан: у нового файла обводка снова скрыта до его загрузки
	const [loadedFor, setLoadedFor] = useState<string | null>(null);
	const { ref: outerRef, onLoad, onError, ...rest } = (imgProps ?? {}) as ImgProps;
	return (
		<span
			ref={ref}
			className={`${className ?? ''} ImageBorder ${hasBakedBorder(src) ? 'ImageCrop' : ''}`}
			style={cropStyle(src)}
			data-pending={loadedFor === shown ? undefined : ''}
		>
			{children}
			<img
				src={near ? `${PATH_IMAGES}${shown}` : PLACEHOLDER}
				alt=""
				loading="lazy"
				{...rest}
				ref={(img) => {
					// Прозрачный пиксель «загруженной картинкой» не считается: ни рамки, ни снятия спиннера
					outerRef?.(near ? img : null);
					// Картинка из кэша могла загрузиться раньше, чем React подписался на onLoad
					if (near && img?.complete && img.naturalWidth) setLoadedFor(shown);
				}}
				onLoad={(event) => {
					if (!near) return;
					setLoadedFor(shown);
					onLoad?.(event);
				}}
				onError={(event) => {
					if (LARGE.test(shown)) markMissingLarge(shown);
					if (candidates(wanted).some((path) => !paths.includes(path) && path !== shown)) setFailed({ src, paths: [...paths, shown] });
					// Файла нет и запасных не осталось: рамка показывается пустой, а не пропадает совсем
					else setLoadedFor(shown);
					onError?.(event);
				}}
			/>
		</span>
	);
}
