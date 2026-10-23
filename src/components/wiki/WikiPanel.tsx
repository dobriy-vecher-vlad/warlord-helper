import { useEffect, type ReactNode } from 'react';
import { Group, Panel } from '@vkontakte/vkui';
import { Icon28PinOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../../app/layout';
import { getNav, showNotFound, usePendingModal, type StoryId } from '../../store/nav';
import { PageHeader } from '../PageHeader';
import { Separator } from '../Separator';
import { ItemFilterBar } from './ItemFilterBar';
import styles from './WikiPanel.module.css';

/** Блок «Полезная информация» с иконкой-булавкой. */
export function InfoBlock({ children, title = 'Полезная информация' }: { children: ReactNode; title?: ReactNode }) {
	return (
		<div className={styles.info}>
			<Icon28PinOutline className={styles.infoIcon} />
			<div className={styles.infoBody}>
				<div className={styles.infoTitle}>{title}</div>
				<div className={styles.infoText}>{children}</div>
			</div>
		</div>
	);
}

interface WikiPanelProps {
	id: string;
	parent: StoryId;
	title: string;
	/** Подпись под заголовком (обычно название раздела) */
	description: string;
	/** Иконка в шапке, путь внутри media/images/ */
	avatar: string;
	/** Текст блока «Полезная информация» */
	info?: ReactNode;
	/** Показать внизу фильтр наград */
	filter?: boolean;
	/** Своё содержимое закреплённого верха вместо подсказки (вкладки, сводки) */
	top?: ReactNode;
	/** Своё содержимое закреплённого низа вместо фильтра наград */
	bottom?: ReactNode;
	/** Панель, на которую ведёт «назад» (по умолчанию главная панель раздела); у такой страницы нет ссылки «копировать» */
	back?: string;
	children: ReactNode;
}

/**
 * Подраздел вики: шапка с «назад» и копированием ссылки, закреплённый сверху блок с подсказкой,
 * содержимое и (по желанию) закреплённый снизу фильтр наград.
 */
export function WikiPanel({ id, parent, title, description, avatar, info, filter, top, bottom, back, children }: WikiPanelProps) {
	const isDesktop = useIsDesktop();
	const pending = usePendingModal();
	// Плитки и карточки открывают окно из ссылки в своих эффектах, а они срабатывают раньше эффекта страницы.
	// Если после них `modal` из ссылки всё ещё не разобран — такого окна на странице нет.
	useEffect(() => {
		const nav = getNav();
		if (pending !== null && nav.pendingModal === pending && nav.panel === id) showNotFound();
	}, [pending, id]);
	const header = <PageHeader title={title} description={description} avatar={avatar} parent={parent} panel={id} back={back} />;
	return (
		<Panel id={id}>
			{!isDesktop && header}
			<Group mode="plain" className={`AppGroup ${filter || bottom ? styles.withFilter : ''} ${info || top ? '' : styles.noTop}`}>
				{info || top ? (
					<div className={`${styles.sticky} ${styles.top}`}>
						{isDesktop && header}
						{info && <InfoBlock>{info}</InfoBlock>}
						{top}
						<Separator className={styles.separator} />
					</div>
				) : (
					// Без подсказки и своего верха — только шапка, без закреплённого блока и разделителя
					isDesktop && header
				)}
				<div className={styles.content}>{children}</div>
				{(filter || bottom) && (
					<div className={`${styles.sticky} ${styles.bottom}`}>
						<Separator className={styles.separator} />
						{bottom ?? <ItemFilterBar />}
					</div>
				)}
			</Group>
		</Panel>
	);
}
