import { forwardRef, type ReactNode } from 'react';
import { useIsDesktop } from '../../app/layout';
import styles from './ScrollBox.module.css';

/**
 * Блок, который на ПК прокручивается сам (высота ограничена, тонкая полоса прокрутки как в старом приложении),
 * а на телефоне прокручивается вместе со страницей. `locked` — без прокрутки (скелетон выше блока обрезается, полосы нет).
 */
export const ScrollBox = forwardRef<HTMLDivElement, { height: number | string; minHeight?: string; locked?: boolean; children: ReactNode }>(function ScrollBox(
	{ height, minHeight, locked = false, children },
	ref,
) {
	const isDesktop = useIsDesktop();
	return (
		<div ref={ref} className={`${styles.scroll} ${locked ? styles.locked : ''}`} style={isDesktop ? { maxHeight: height } : { minHeight }}>
			{children}
		</div>
	);
});
