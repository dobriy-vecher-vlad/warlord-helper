import type { ReactNode } from 'react';
import { ModalPage, PanelHeaderBack, PanelHeaderButton } from '@vkontakte/vkui';
import { Icon24Dismiss, Icon28DoneOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../app/layout';
import styles from './ClassicModal.module.css';
import { useModalPage } from './useModalPage';

interface ClassicModalProps {
	id: string;
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	/** Кнопка слева */
	before?: ReactNode;
	/** Кнопка справа */
	after?: ReactNode;
	/** Закреплённый низ окна (как шапка закреплён сверху) */
	footer?: ReactNode;
	/** Закреплённый блок под шапкой: не прокручивается, под ним разделитель; прокручивается только содержимое ниже */
	top?: ReactNode;
	/** Высота блока `top` (px, на телефоне нужна для высоты шторки; приблизительно) */
	topHeight?: number;
	className?: string;
	children: ReactNode;
}

/** Кнопка в шапке окна: иконка или текст. */
export function ModalHeaderButton({ onClick, disabled, children, label, text }: { onClick: () => void; disabled?: boolean; children: ReactNode; label?: string; text?: boolean }) {
	return (
		<PanelHeaderButton className={`${styles.button} ${text ? styles.textButton : ''}`} onClick={onClick} disabled={disabled} aria-label={label} primary={text}>
			{children}
		</PanelHeaderButton>
	);
}

/** «Назад» в шапке окна. */
export const ModalBack = ({ onClick }: { onClick: () => void }) => <PanelHeaderBack className={`${styles.button} HeaderBack`} onClick={onClick} hideLabelOnIOS />;

/** «Готово»: на ПК текстом, на телефоне галочкой (PanelHeaderSubmit VKUI 4). */
export function ModalSubmit({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
	const isDesktop = useIsDesktop();
	return (
		<ModalHeaderButton onClick={onClick} disabled={disabled} label="Готово" text={isDesktop}>
			{isDesktop ? 'Готово' : <Icon28DoneOutline />}
		</ModalHeaderButton>
	);
}

/** Закрыть окно (только на телефоне). */
export const ModalDismiss = ({ onClick }: { onClick: () => void }) => (
	<ModalHeaderButton onClick={onClick} label="Закрыть">
		<Icon24Dismiss style={{ color: 'var(--icon_secondary)' }} />
	</ModalHeaderButton>
);

/** Текстовая кнопка в шапке («Отмена»). */
export const ModalTextButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
	<ModalHeaderButton onClick={onClick} text>
		{children}
	</ModalHeaderButton>
);

/**
 * Окно с обычной шапкой (ModalPage--classic в старом приложении): заголовок по центру, кнопки по краям,
 * под шапкой разделитель. Высота на телефоне — по содержимому или 75% экрана.
 */
export function ClassicModal({ id, open, onClose, title, before, after, footer, top, topHeight = 0, className, children }: ClassicModalProps) {
	const { ref, pageProps } = useModalPage(open, 52 + (top ? topHeight : 0));
	const bar = (
		<div className={styles.header}>
			<div className={styles.before}>{before}</div>
			<div className={styles.title}>{title}</div>
			<div className={styles.after}>{after}</div>
		</div>
	);
	const header = top ? (
		<>
			{bar}
			<div className={styles.top}>{top}</div>
		</>
	) : (
		bar
	);
	return (
		<ModalPage
			id={id}
			open={open}
			onClose={onClose}
			{...pageProps}
			className={`${styles.modal} ${className ?? ''}`}
			header={header}
			footer={footer ? <div className={styles.footer}>{footer}</div> : undefined}
		>
			<div ref={ref} className={styles.content}>
				{children}
			</div>
		</ModalPage>
	);
}
