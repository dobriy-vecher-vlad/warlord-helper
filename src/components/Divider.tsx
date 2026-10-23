import { Separator } from './Separator';
import styles from './Divider.module.css';

/** Отступ с разделителем посередине (в VKUI 4 это был `<Spacing separator size={…} />`): линия с отступами 12px по бокам. */
export function Divider({ size = 16, className }: { size?: number; className?: string }) {
	return <Separator size={size} className={`${styles.divider} ${className ?? ''}`} />;
}
