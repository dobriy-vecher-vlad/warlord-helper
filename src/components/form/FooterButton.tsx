import type { ComponentProps, ReactNode } from 'react';
import { Button } from './Form';
import styles from './FooterButton.module.css';

/**
 * Кнопка в низу страницы или окна (бот, бои с боссами, алерты, окна): размер S, по высоте 36px, на телефоне шрифт как у M. Единая для всех
 * кнопок приложения. Лежит отдельно от BotBlocks: её берёт и главный чанк (главная, экран ошибки, алерты), а BotBlocks тянет весь лог бота.
 */
export function FooterButton({ className, ...props }: Omit<ComponentProps<typeof Button>, 'size'>) {
	return <Button {...props} size="s" className={`${styles.footerButton} ${className ?? ''}`} />;
}

/** Число на зелёной кнопке (Counter s prominent на зелёной кнопке VKUI 4): круг цвета текста кнопки, цифра цветом кнопки. */
export function ButtonCounter({ children }: { children: ReactNode }) {
	return (
		<span className={styles.buttonCounter}>
			<span>{children}</span>
		</span>
	);
}
