import type { ReactNode } from 'react';
import { PanelHeaderBack, PanelHeaderButton } from '@vkontakte/vkui';
import { Icon28CopyOutline } from '@vkontakte/icons';
import { useCopyLink } from '../app/copyLink';
import { useIsDesktop } from '../app/layout';
import { Separator } from './Separator';
import styles from './AppHeader.module.css';
import { LargeImg } from './LargeImg';

/** Кнопка в шапке (иконка 28px акцентного цвета). */
export function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
	return (
		<PanelHeaderButton className={styles.button} onClick={onClick} aria-label={label}>
			{children}
		</PanelHeaderButton>
	);
}

/** Текстовая кнопка в шапке («Изменить»): 17px, жирность 600, акцентный цвет. */
export function HeaderTextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
	return (
		<PanelHeaderButton className={styles.textButton} onClick={onClick} primary>
			{children}
		</PanelHeaderButton>
	);
}

/** Кнопка копирования ссылки на раздел. */
export function CopyButton({ view, panel, modal }: { view?: string | null; panel?: string | null; modal?: string | number | null }) {
	const copy = useCopyLink(view, panel, modal);
	return (
		<HeaderButton label="Скопировать ссылку" onClick={copy}>
			<Icon28CopyOutline />
		</HeaderButton>
	);
}

interface AppHeaderProps {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Иконка слева от заголовка, путь внутри media/images/ */
	avatar?: string;
	/** Заголовок по центру (главные панели разделов и главная страница) */
	center?: boolean;
	onBack?: () => void;
	/** Своя кнопка слева вместо «назад» */
	before?: ReactNode;
	after?: ReactNode;
}

/**
 * Шапка страницы, повторяющая старую (VKUI 4, iOS): на десктопе — 38px внутри карточки
 * с разделителем ниже, на телефоне — закреплённая 52px с разделителем на всю ширину.
 */
export function AppHeader({ title, subtitle, avatar, center = false, onBack, before, after }: AppHeaderProps) {
	const isDesktop = useIsDesktop();
	return (
		<>
			<header className={`${styles.header} ${isDesktop ? styles.desktop : styles.mobile} ${center ? styles.center : ''}`}>
				<div className={styles.before}>
					{before}
					{onBack && <PanelHeaderBack className={`${styles.button} HeaderBack`} onClick={onBack} hideLabelOnIOS />}
				</div>
				<div className={styles.content}>
					{avatar && (
						<span className={`${styles.avatar} ImageBorder`}>
							<LargeImg src={avatar} />
						</span>
					)}
					<div className={styles.text}>
						<div className={`${styles.title} ${center && !subtitle ? styles.titleLarge : ''}`}>{title}</div>
						{subtitle && <div className={styles.subtitle}>{subtitle}</div>}
					</div>
				</div>
				<div className={styles.after}>{after}</div>
			</header>
			{isDesktop && <Separator className={styles.separator} />}
		</>
	);
}
