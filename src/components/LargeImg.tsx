import type { ImgHTMLAttributes } from 'react';
import { PATH_IMAGES } from '../config';
import { useLargeFile } from '../lib/largeImage';

/** `<img>` картинки из media/images/: берёт большую версию файла, если она есть (см. `useLargeFile`), иначе обычную. */
export function LargeImg({ src, ...rest }: { src: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
	const { file, onError } = useLargeFile(src);
	return <img alt="" {...rest} src={`${PATH_IMAGES}${file}`} onError={onError} />;
}
