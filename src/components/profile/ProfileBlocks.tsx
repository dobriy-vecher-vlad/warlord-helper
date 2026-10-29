import { Fragment, type ReactNode } from 'react';
import { HorizontalScroll, Tabs as VKTabs, TabsItem } from '@vkontakte/vkui';
import { useIsDesktop } from '../../app/layout';
import { Divider } from '../Divider';
import { Skeleton } from '../Skeleton';
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
		<VKTabs className={styles.tabs} layoutFillMode="shrinked">
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

/** Заглушка загрузки рядов вкладок: по строке на ряд, через тот же отступ, что и между рядами. */
export function TabsSkeleton({ rows = 1 }: { rows?: number }) {
	const isDesktop = useIsDesktop();
	return (
		<>
			{Array.from({ length: rows }, (_, index) => (
				<Fragment key={index}>
					{index > 0 && <Divider size={8} />}
					<Skeleton height={isDesktop ? 44 : 48} style={isDesktop ? undefined : { margin: '0 8px', width: 'auto' }} />
				</Fragment>
			))}
		</>
	);
}
