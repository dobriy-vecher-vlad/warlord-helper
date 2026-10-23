import type { ReactNode } from 'react';
import { HorizontalScroll, Tabs as VKTabs, TabsItem } from '@vkontakte/vkui';
import styles from './ProfileBlocks.module.css';

export interface TabOption<T extends string | number> {
	value: T;
	title: ReactNode;
	/** Счётчик справа от названия (TabsItem status) */
	status?: ReactNode;
}

/** Вкладки с подчёркиванием (Tabs VKUI), листаются по горизонтали. */
export function Tabs<T extends string | number>({ options, value, onChange }: { options: readonly TabOption<T>[]; value: T; onChange: (value: T) => void }) {
	return (
		<VKTabs className={styles.tabs}>
			<HorizontalScroll arrowSize="m">
				<div className={styles.list}>
					{options.map((option) => (
						<TabsItem
							key={option.value}
							className={styles.tab}
							selected={option.value === value}
							status={option.status !== undefined ? <span className={styles.tabStatus}>{option.status}</span> : undefined}
							onClick={() => onChange(option.value)}
						>
							{option.title}
						</TabsItem>
					))}
				</div>
			</HorizontalScroll>
		</VKTabs>
	);
}
