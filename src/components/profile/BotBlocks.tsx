import { Fragment, useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Checkbox, IconButton, Radio, Tappable } from '@vkontakte/vkui';
import { Icon16Clear, Icon28ListOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../../app/layout';
import { PATH_IMAGES } from '../../config';
import type { RewardLine } from '../../profile/bots/reward';
import { logTime } from '../../profile/bots/common';
import { hasBakedBorder } from '../BorderedImage';
import { Button } from '../form/Form';
import { Placeholder } from './Placeholder';
import { Skeleton } from '../Skeleton';
import { appendLog } from '../../profile/bots/log';
import styles from './BotBlocks.module.css';

/* ---------- Картинки ---------- */

const imageUrl = (src: string) => (/^(https?:|\/|data:)/.test(src) ? src : `${PATH_IMAGES}${src}`);

/**
 * Квадратная картинка со скруглением и тонкой рамкой (Avatar mode="app" VKUI 4).
 * У предметов (`item`) и картинок из папок с вшитой белой обводкой края обрезаются на 3px.
 */
export function Thumb({ src, size, item = false, className }: { src: string; size: number; item?: boolean; className?: string }) {
	return (
		<span className={`${styles.thumb} ${item || hasBakedBorder(src) ? styles.thumbItem : ''} ${className ?? ''}`} style={{ width: size, height: size }}>
			<img src={imageUrl(src)} alt="" />
		</span>
	);
}

/* ---------- Карточки показателей ---------- */

/** Показатель бота: картинка 32px, название и значение (DescriptionCardWiki + SimpleCell). */
export function InfoCard({ image, title, subtitle, onClick, item = false }: { image: string; title: ReactNode; subtitle: ReactNode; onClick?: () => void; item?: boolean }) {
	return (
		<Tappable className={styles.info} onClick={onClick} activeMode={onClick ? undefined : 'none'} hoverMode={onClick ? undefined : 'none'}>
			<Thumb className={styles.infoImage} src={image} size={32} item={item} />
			<span className={styles.infoMain}>
				<span className={styles.infoTitle}>{title}</span>
				<span className={styles.infoSubtitle}>{subtitle}</span>
			</span>
		</Tappable>
	);
}

/** Заглушка карточки показателя на время загрузки. */
export function InfoSkeleton() {
	return (
		<div className={styles.infoSkeleton}>
			<Skeleton width={32} height={32} style={{ margin: '0 16px 0 4px', flexShrink: 0 }} />
			<Skeleton width={108} height={38} />
		</div>
	);
}

/** Сетка карточек показателей: по три в ряд на ПК и по две на телефоне (CardGrid s / m). */
export function InfoGrid({ children, columns }: { children: ReactNode; columns?: 2 }) {
	return <div className={`${styles.grid} ${columns === 2 ? styles.grid2 : ''}`}>{children}</div>;
}

/** Сетка по две карточки в ряд (CardGrid m). */
export function OptionGrid({ children }: { children: ReactNode }) {
	return <div className={styles.grid2}>{children}</div>;
}

/* ---------- Переключатели ---------- */

interface OptionProps {
	type: 'radio' | 'checkbox';
	checked: boolean;
	disabled?: boolean;
	onChange: () => void;
	description?: ReactNode;
	children: ReactNode;
}

/** Переключатель или флажок с подписью (Radio / Checkbox VKUI). */
export function Option({ type, checked, disabled, onChange, description, children }: OptionProps) {
	const Control = type === 'radio' ? Radio : Checkbox;
	return (
		<Control className={styles.option} checked={checked} disabled={disabled} description={description} onChange={onChange}>
			{children}
		</Control>
	);
}

/* ---------- Лог действий ---------- */

export type LogEntry = { id: number } & (
	| { type: 'text'; message: string; color?: 'red' | 'green' | 'blue' }
	| { type: 'message'; avatar: string; title: string; time: string; message: string | RewardLine[]; note?: string }
);

/** Номер записи: по нему React узнаёт запись, когда старые записи отбрасываются. */
let logId = 0;

/** Записи лога и действия с ним. Время записи ставится при добавлении. */
export function useBotLog() {
	const [entries, setEntries] = useState<LogEntry[]>([]);
	const text = useCallback((message: string, color?: 'red' | 'green' | 'blue') => setEntries((list) => appendLog(list, { id: ++logId, type: 'text', message, color })), []);
	const message = useCallback(
		(avatar: string, title: string, body: string | RewardLine[], note?: string) =>
			setEntries((list) => appendLog(list, { id: ++logId, type: 'message', avatar, title, time: logTime(), message: body, note })),
		[],
	);
	const clear = useCallback(() => setEntries([]), []);
	return { entries, text, message, clear };
}

/** Картинка 36px записи лога. */
function LogImage({ src, item }: { src: string; item?: boolean }) {
	return <Thumb className={styles.logImage} src={src} size={36} item={item} />;
}

const ITEM_TITLES = ['Предмет', 'Коллекция', 'Заточка', 'Камень'];

/**
 * Лог действий бота. Пока лог прокручен до конца, новые записи прокручивают его вниз за собой; если человек пролистал
 * выше, лог не трогаем (иначе он не может читать записи, пока бот работает). Пустой — «Нет новых действий»; `compact` — та же заглушка, но с меньшей иконкой, полями и в одну строку (в окнах, где лог занимает часть экрана).
 * С `onClear` в правом верхнем углу лога, когда в нём есть записи, стоит крестик очистки.
 */
export function BotLog({ entries, compact = false, onClear }: { entries: readonly LogEntry[]; compact?: boolean; onClear?: () => void }) {
	const ref = useRef<HTMLDivElement>(null);
	// Лог у конца: по умолчанию да, меняется только прокруткой пользователя
	const atBottom = useRef(true);
	const onScroll = () => {
		const log = ref.current;
		if (log) atBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight <= 8;
	};
	useLayoutEffect(() => {
		const log = ref.current;
		if (!entries.length) atBottom.current = true;
		if (log && atBottom.current) log.scrollTo({ top: log.scrollHeight });
	}, [entries]);
	return (
		<div className={styles.logWrap}>
			<div ref={ref} className={styles.log} onScroll={onScroll}>
				{entries.length ? (
					entries.map((entry) =>
						entry.type === 'text' ? (
							<span key={entry.id} className={`${styles.logText} ${entry.color ? styles[entry.color] : ''}`}>
								{entry.message}
							</span>
						) : (
							<div key={entry.id} className={`${styles.logMessage} ${styles.logRoot}`}>
								<LogImage src={entry.avatar} />
								<div className={styles.logMain}>
									<div className={styles.logTitle}>
										<span>{entry.title}</span>
										<span>{entry.time}</span>
									</div>
									<div className={styles.logChildren}>
										{entry.note && <div className={styles.logNote}>{entry.note}</div>}
										{Array.isArray(entry.message)
											? entry.message.map((line, x) => (
													<div key={x} className={styles.logMessage}>
														{line.avatar && <LogImage src={line.avatar} item={ITEM_TITLES.includes(line.title)} />}
														<div className={styles.logMain}>
															<div className={styles.logTitle}>
																<span>{line.title}</span>
															</div>
															<div className={styles.logChildren}>{line.message}</div>
														</div>
													</div>
												))
											: entry.message}
									</div>
								</div>
							</div>
						),
					)
				) : compact ? (
					<Placeholder className={`${styles.logEmpty} ${styles.logEmptyCompact}`} icon={<Icon28ListOutline width={36} height={36} />}>
						Нет новых действий
					</Placeholder>
				) : (
					<Placeholder className={styles.logEmpty} icon={<Icon28ListOutline width={56} height={56} />}>
						Нет новых действий
					</Placeholder>
				)}
			</div>
			{onClear && entries.length > 0 && (
				<IconButton className={styles.logClear} aria-label="Очистить лог действий" onClick={onClear}>
					<Icon16Clear />
				</IconButton>
			)}
		</div>
	);
}

/** Заглушка лога на время загрузки. */
export function BotLogSkeleton() {
	return (
		<div className={`${styles.log} ${styles.logSkeleton}`}>
			<Skeleton height={20} width={144} style={{ flexShrink: 0 }} />
			<div className={styles.logMessage}>
				<Skeleton height={36} width={36} style={{ marginRight: 12, flexShrink: 0 }} />
				<Skeleton height={36} width={234} style={{ flexShrink: 0 }} />
			</div>
			<Skeleton height={20} width={220} style={{ flexShrink: 0 }} />
			<Skeleton height={20} width={320} style={{ flexShrink: 0 }} />
			<div className={styles.logMessage}>
				<Skeleton height={36} width={36} style={{ marginRight: 12, flexShrink: 0 }} />
				<Skeleton height={36} width={184} style={{ flexShrink: 0 }} />
			</div>
			<Skeleton height={20} width={100} style={{ flexShrink: 0 }} />
		</div>
	);
}

/* ---------- Нижняя панель ---------- */

/** Кнопка в низу страницы или окна (бот, бои с боссами): размер S, по высоте как M, на телефоне шрифт как у M. Единая для всех нижних панелей. */
export function FooterButton({ className, ...props }: Omit<ComponentProps<typeof Button>, 'size'>) {
	return <Button {...props} size="s" className={`${styles.footerButton} ${className ?? ''}`} />;
}

/** Кнопка управления ботом (Button size="m" stretched). */
export interface BotAction {
	title: ReactNode;
	mode: 'commerce' | 'destructive' | 'secondary';
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
	after?: ReactNode;
}

/**
 * Низ страницы бота: лог, разделитель во всю ширину, «Очистить лог действий» и ряд кнопок.
 * На телефоне кнопки можно разбить на ряды (`mobileRows` — сколько кнопок в ряду).
 */
export function BotFooter({
	log,
	onClear,
	actions,
	mobileRows,
	loading = false,
	buttonSize = 'm',
}: {
	log: readonly LogEntry[];
	onClear: () => void;
	actions: BotAction[];
	mobileRows?: number;
	loading?: boolean;
	buttonSize?: 's' | 'm';
}) {
	const isDesktop = useIsDesktop();
	const rows =
		!isDesktop && mobileRows
			? Array.from({ length: Math.ceil(actions.length / mobileRows) }, (_, row) => actions.slice(row * mobileRows, row * mobileRows + mobileRows))
			: [actions];
	return (
		<>
			{loading ? <BotLogSkeleton /> : <BotLog entries={log} onClear={onClear} />}
			<div className={styles.separator} />
			{rows.map((row, index) => (
				<Fragment key={index}>
					{index > 0 && <div className={styles.gap} />}
					<div className={styles.row}>
						{row.map((action, x) =>
							loading ? (
								<Skeleton key={x} height={isDesktop ? 32 : 36} />
							) : (
								<Button
									key={x}
									size={buttonSize}
									className={buttonSize === 's' ? styles.footerButton : undefined}
									mode={action.mode}
									stretched
									disabled={action.disabled}
									loading={action.loading}
									after={action.after}
									onClick={action.onClick}
								>
									{action.title}
								</Button>
							),
						)}
					</div>
				</Fragment>
			))}
		</>
	);
}
