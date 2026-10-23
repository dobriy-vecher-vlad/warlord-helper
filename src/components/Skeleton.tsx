import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/** Заглушка загрузки (Skeleton в старом приложении). */
export function Skeleton({
	width = '100%',
	height = '100%',
	borderRadius = 10,
	style,
}: {
	width?: number | string;
	height?: number | string;
	borderRadius?: number | string;
	style?: CSSProperties;
}) {
	return <div className={styles.skeleton} style={{ width, height, borderRadius, ...style }} />;
}
