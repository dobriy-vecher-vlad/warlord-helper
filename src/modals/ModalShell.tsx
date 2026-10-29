import type { ReactNode } from 'react';
import { ModalPage } from '@vkontakte/vkui';
import { CopyButton } from '../components/AppHeader';
import { cropStyle, hasBakedBorder } from '../components/BorderedImage';
import { Divider } from '../components/Divider';
import { useIsDesktop } from '../app/layout';
import { PATH_IMAGES } from '../config';
import { useLargeFile } from '../lib/largeImage';
import { usePanel, useStory } from '../store/nav';
import { ModalDismiss } from './ClassicModal';
import styles from './ModalShell.module.css';
import { useModalPage } from './useModalPage';

export interface ModalHead {
	title: ReactNode;
	description: ReactNode;
	/** Картинка, путь внутри media/images/ */
	avatar?: string;
	/** Крупная версия картинки для большого превью на ПК (если есть) */
	avatarLarge?: string;
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
	// Картинка всегда большая, если у файла есть такая версия (см. `useLargeFile`)
	const { file, onError } = useLargeFile(head.avatarLarge ?? head.avatar ?? '');
	if (!head.avatar) return null;
	const src = `${PATH_IMAGES}${file}`;
	return (
		<span className={className}>
			<span className={`${styles.frame} ImageBorder ${hasBakedBorder(file) ? 'ImageCrop' : ''}`} style={cropStyle(file)}>
				<img className={styles.picture} src={src} alt="" onError={onError} />
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
			<span className={styles.mobileClose}>
				<ModalDismiss onClick={onClose} />
			</span>
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
