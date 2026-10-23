import type { ReactNode } from 'react';
import { ModalPage, PanelHeaderButton } from '@vkontakte/vkui';
import { Icon24Dismiss } from '@vkontakte/icons';
import { CopyButton } from '../components/AppHeader';
import { Divider } from '../components/Divider';
import { useIsDesktop } from '../app/layout';
import { PATH_IMAGES } from '../config';
import { usePanel, useStory } from '../store/nav';
import styles from './ModalShell.module.css';
import { useModalPage } from './useModalPage';

export interface ModalHead {
	title: ReactNode;
	description: ReactNode;
	/** Картинка, путь внутри media/images/ */
	avatar?: string;
	/** CSS-фон вместо картинки (например, босс поверх фона локации) */
	background?: string;
	/** Значение `modal=` для ссылки на это окно */
	link?: string | number;
	/** Без картинки и превью: только заголовок (например, список заточек) */
	plain?: boolean;
}

interface ModalShellProps {
	id: string;
	open: boolean;
	onClose: () => void;
	head: ModalHead;
	children: ReactNode;
}

function Picture({ head, size }: { head: ModalHead; size: 'preview' | 'small' }) {
	const className = size === 'preview' ? styles.preview : styles.small;
	if (head.background) {
		return (
			<span className={className}>
				<span className={`${styles.frame} ImageBorder`}>
					<span className={styles.picture} style={{ background: head.background }} />
				</span>
				{size === 'preview' && <span className={styles.glow} style={{ background: head.background }} />}
			</span>
		);
	}
	if (!head.avatar) return null;
	const src = `${PATH_IMAGES}${head.avatar}`;
	return (
		<span className={className}>
			<span className={`${styles.frame} ImageBorder`}>
				<img className={styles.picture} src={src} alt="" />
			</span>
			{size === 'preview' && <img className={styles.glow} src={src} alt="" />}
		</span>
	);
}

/**
 * Окно описания. На десктопе сверху крупная картинка с размытым свечением, заголовок и кнопка ссылки;
 * на телефоне — компактная шапка с картинкой и кнопкой закрытия.
 */
export function ModalShell({ id, open, onClose, head, children }: ModalShellProps) {
	const isDesktop = useIsDesktop();
	const story = useStory();
	const panel = usePanel();
	const { ref, pageProps } = useModalPage(open);
	const copy = head.link !== undefined ? <CopyButton view={story} panel={panel} modal={head.link} /> : null;

	const mobileHeader = (
		<div className={styles.mobileHeader}>
			{!head.plain && <Picture head={head} size="small" />}
			<span className={styles.mobileText}>
				<span className={styles.mobileName}>{head.title}</span>
				<span className={styles.mobileDescription}>{head.description}</span>
			</span>
			<PanelHeaderButton className={styles.mobileClose} onClick={onClose} aria-label="Закрыть">
				<Icon24Dismiss />
			</PanelHeaderButton>
		</div>
	);

	const desktopHeader = head.plain ? (
		<div className={styles.plainHeader}>
			<span className={styles.plainTitle}>{head.title}</span>
			<div className={styles.plainActions}>{copy}</div>
		</div>
	) : undefined;

	return (
		<ModalPage id={id} open={open} onClose={onClose} {...pageProps} className={styles.modal} header={isDesktop ? desktopHeader : mobileHeader}>
			<div className={styles.content} ref={ref}>
				{isDesktop && !head.plain && (
					<div className={styles.previewHeader}>
						<div className={styles.previewActions}>{copy}</div>
						<Picture head={head} size="preview" />
						<div className={styles.previewTitle}>{head.title}</div>
						<div className={styles.previewDescription}>{head.description}</div>
						<Divider className={styles.previewDivider} />
					</div>
				)}
				{children}
			</div>
		</ModalPage>
	);
}
