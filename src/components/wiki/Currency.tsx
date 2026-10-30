import { PATH_IMAGES } from '../../config';
import { Preload } from '../Preload';
import styles from './Currency.module.css';

/**
 * Иконка валюты в строке текста (media/images/currency/all/m{id}.png), пока грузится — маленький спиннер.
 * Иконка и спиннер стоят прямо в строке, без обёртки: только так иконка опускается под базовую линию
 * и не раздвигает строку (как в старом приложении).
 */
export function Currency({ id }: { id: number }) {
	return (
		<>
			<Preload src={`${PATH_IMAGES}currency/all/m${id}.png`} size="s" className={styles.preload} />
			<i className={styles.icon} style={{ backgroundImage: `url(${PATH_IMAGES}currency/all/m${id}.png)` }} />
		</>
	);
}
