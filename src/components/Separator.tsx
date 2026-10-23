import styles from './Separator.module.css';

interface SeparatorProps {
	/** Высота блока; линия посередине */
	size?: number;
	/**
	 * Размеры линии задают переменные CSS на классе (или на родителе):
	 * `--bleed` — на сколько линия выходит за края блока, `--inset` — отступ линии от краёв блока.
	 */
	className?: string;
}

/** Разделитель: блок заданной высоты с тонкой линией по центру (в VKUI 4 это был `<Spacing separator size={…} />`). */
export function Separator({ size = 16, className }: SeparatorProps) {
	return <div className={`${styles.separator} ${className ?? ''}`} style={{ height: size }} />;
}
