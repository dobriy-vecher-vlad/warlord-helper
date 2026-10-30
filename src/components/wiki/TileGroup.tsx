import type { ReactNode } from 'react';
import { Icon12ChevronOutline } from '@vkontakte/icons';
import { useDeepLink } from '../../app/deepLink';
import { clickable } from '../../lib/clickable';
import { Divider } from '../Divider';
import styles from './TileGroup.module.css';

interface TileGroupProps {
	title: string;
	/** Красный счётчик рядом с заголовком */
	count?: number;
	/** Ссылка справа (см. GroupLink) */
	after?: ReactNode;
	/** Первая группа — без разделителя сверху */
	first: boolean;
	children: ReactNode;
}

/** Ссылка на окно внутри группы: номер группы и номер элемента, склеенные строкой (как в старом приложении). */
export const groupLink = (group: number, index: number) => `${group + 1}${index + 1}`;

/** Группа плиток с заголовком: «Подземелье форта», «Риверфорт» и т. п. */
export function TileGroup({ title, count, after, first, children }: TileGroupProps) {
	return (
		<div>
			{!first && <Divider />}
			<div className={styles.header}>
				<span className={styles.headerTitle}>{title}</span>
				{count !== undefined && <span className={styles.counter}>{count}</span>}
				{after && <span className={styles.headerAfter}>{after}</span>}
			</div>
			{children}
		</div>
	);
}

interface GroupLinkProps {
	children: ReactNode;
	href?: string;
	onClick?: () => void;
	/** Значение `modal=` в ссылке, по которому действие выполняется автоматически */
	deepLink?: string;
	/** Стрелка справа от надписи (по умолчанию есть): у ссылок, которые открывают раздел; у действий («Изменить») её нет */
	chevron?: boolean;
}

/** Ссылка в заголовке группы со стрелкой: «Открыть карту ›». Внешняя (`href`) или действие (`onClick`, его можно вызвать ссылкой). */
export function GroupLink({ children, href, onClick, deepLink, chevron = true }: GroupLinkProps) {
	return href ? (
		<ExternalGroupLink href={href} chevron={chevron}>
			{children}
		</ExternalGroupLink>
	) : (
		<ActionGroupLink onClick={onClick} deepLink={deepLink} chevron={chevron}>
			{children}
		</ActionGroupLink>
	);
}

function ExternalGroupLink({ href, children, chevron }: { href: string; children: ReactNode; chevron: boolean }) {
	return (
		<a href={href} target="_blank" rel="noreferrer" className={styles.headerLink}>
			{children} {chevron && <Icon12ChevronOutline />}
		</a>
	);
}

function ActionGroupLink({ onClick, deepLink, children, chevron }: Omit<GroupLinkProps, 'href'> & { chevron: boolean }) {
	useDeepLink(deepLink, onClick);
	return (
		<a {...clickable(onClick)} className={styles.headerLink}>
			{children} {chevron && <Icon12ChevronOutline />}
		</a>
	);
}
