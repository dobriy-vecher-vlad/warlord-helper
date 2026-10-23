import { Spinner } from '@vkontakte/vkui';
import styles from './Splash.module.css';

/** Заставка запуска внутри ВК: только спиннер по центру на основном фоне страницы. */
export function Splash() {
	return (
		<div className={styles.splash}>
			<Spinner size="xl" />
		</div>
	);
}
