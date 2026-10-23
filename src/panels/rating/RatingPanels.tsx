import { useEffect, useState, type CSSProperties } from 'react';
import { Group, Input, Panel, PanelHeaderBack, Tappable } from '@vkontakte/vkui';
import { Icon12ChevronOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../../app/layout';
import sadFace from '../../assets/sadFace.svg';
import { CopyButton } from '../../components/AppHeader';
import { Button } from '../../components/form/Form';
import { Skeleton } from '../../components/Skeleton';
import { Pager, TableHead, TableRow, TableStatic } from '../../components/profile/Table';
import { ScrollBox } from '../../components/profile/ScrollBox';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../config';
import { numberSpaces } from '../../lib/format';
import { currentProfile, useSession } from '../../profile/session';
import { createStore, useStore } from '../../store/createStore';
import { openPanel, openStory } from '../../store/nav';
import { findRating, loadRating, ratingDate, tagColor, type RatingBlock, type RatingRow, type RatingTab } from './ratingData';
import styles from './RatingPanels.module.css';
import type { SectionPanels } from '../section';
import { Photo } from '../../components/Photo';

/** Открытый список (панель «1»): какой рейтинг и чей номер показать внизу. */
const ratingStore = createStore<{ tab: RatingTab; current: (RatingBlock & { tab: RatingTab; id: number | null }) | null }>({ tab: 2, current: null });

const grid = (isDesktop: boolean): CSSProperties => ({ gridTemplateColumns: '40px 32px auto auto', gap: isDesktop ? 8 : 16 });

/** Аватар строки: картинка арены у игрока, цветной квадрат с тегом у гильдии. */
function RowAvatar({ row }: { row: RatingRow }) {
	if (row.avatar !== undefined) return <Photo src={`${PATH_IMAGES}bot/arena/avatar_${row.avatar}.png`} size={32} />;
	return <span className={`${styles.tag} ${styles[`tag_${tagColor(row.id)}`]}`}>{row.tag}</span>;
}

const rowTitle = (row: RatingRow, tab: RatingTab) => row.name || `${tab === 2 ? 'Guild' : 'Player'}\n${row.id}`;
const rowValue = (row: RatingRow) => (typeof row.title === 'number' && Number.isInteger(row.title) ? numberSpaces(row.title) : row.title);
const rowLink = (row: RatingRow) => `https://vk.com/id${row.leader ?? row.id}`;

function RatingTableRow({ row, place, tab, isDesktop }: { row: RatingRow; place: number; tab: RatingTab; isDesktop: boolean }) {
	return (
		<TableRow
			grid={grid(isDesktop)}
			count={numberSpaces(place)}
			href={rowLink(row)}
			avatar={<RowAvatar row={row} />}
			columns={[{ title: rowTitle(row, tab) }, { title: rowValue(row), right: true }]}
		/>
	);
}

/** Пустая строка «-» вместо своего места (профиль без данных). */
function EmptyRow({ isDesktop }: { isDesktop: boolean }) {
	return <TableRow grid={grid(isDesktop)} count="-" avatar={<span className={styles.tag}>#</span>} columns={[{ title: '-' }, { title: '-', right: true }]} />;
}

function SkeletonRow({ isDesktop }: { isDesktop: boolean }) {
	return (
		<TableStatic grid={grid(isDesktop)}>
			<Skeleton height={16} />
			<Skeleton height={32} borderRadius="50%" />
			<Skeleton height={16} />
			<Skeleton height={16} />
		</TableStatic>
	);
}

/** Карточка одного рейтинга: заголовок, тройка лидеров и своё место. */
function RatingCard({ block, tab, own, wide, isDesktop }: { block: RatingBlock | null; tab: RatingTab; own: number | null | undefined; wide: boolean; isDesktop: boolean }) {
	const mine = block && own ? (block.items.find((row) => row.id == own) ?? block.items[block.items.length - 1]) : null;
	return (
		// Обёртка: VKUI 8 добавляет к Group соседний разделитель, который иначе занял бы ячейку сетки
		<div className={`${styles.cell} ${wide ? styles.wide : ''}`}>
			<Group mode="plain" separator="hide" className={`AppGroup ${styles.card}`}>
				{block ? (
					<>
						<div className={styles.header}>
							<div className={styles.headerMain}>
								<div className={styles.title}>{block.name}</div>
								<div className={styles.subtitle}>{block.subname}</div>
							</div>
							<Tappable
								className={styles.more}
								hoverMode="opacity"
								activeMode="opacity"
								onClick={() => {
									ratingStore.set({ current: { ...block, tab, id: own ?? null } });
									openPanel('1');
								}}
							>
								Список <Icon12ChevronOutline />
							</Tappable>
						</div>
						<div className={styles.rows}>
							{block.items.slice(0, 3).map((row, x) => (
								<RatingTableRow key={x} row={row} place={x + 1} tab={tab} isDesktop={isDesktop} />
							))}
						</div>
						<div className={styles.separator} />
						{mine ? <RatingTableRow row={mine} place={block.items.indexOf(mine) + 1} tab={tab} isDesktop={isDesktop} /> : <EmptyRow isDesktop={isDesktop} />}
					</>
				) : (
					<>
						<div className={styles.header}>
							<div className={styles.headerMain}>
								<Skeleton height={20} width={100} style={{ marginBottom: 2 }} />
								<Skeleton height={14} width={125} style={{ marginTop: 2 }} />
								{/* Отступы скелетонов схлопываются (2px вместо 4px), и блок выходит на 1px ниже заголовка с подписью: добираем его */}
								<div style={{ height: 1 }} />
							</div>
							<Skeleton height={20} width={50} style={{ margin: `${isDesktop ? 7 : 6}px 0 0 12px` }} />
						</div>
						<div className={styles.rows}>
							{[0, 1, 2].map((x) => (
								<SkeletonRow key={x} isDesktop={isDesktop} />
							))}
						</div>
						<div className={styles.separator} />
						<SkeletonRow isDesktop={isDesktop} />
					</>
				)}
			</Group>
		</div>
	);
}

/** Ошибка загрузки: грустный смайлик, текст и кнопка. */
function RatingError({ text, action, onAction, minHeight }: { text: string; action: string; onAction: () => void; minHeight?: CSSProperties['minHeight'] }) {
	return (
		<div className={styles.error} style={{ minHeight }}>
			<img src={sadFace} alt="" />
			<div className={styles.errorTitle}>Произошла ошибка</div>
			<div className={styles.errorText}>{text}</div>
			<Button mode="tertiary" onClick={onAction}>
				<span className={styles.errorAction}>{action}</span>
			</Button>
		</div>
	);
}

const PROFILE_SKELETON = ['Уровень', 'Атака', 'Здоровье', 'Кубки', 'Навыки'];
const GUILD_SKELETON = ['Уровень', 'Стража', 'Таран', 'Атака', 'Здоровье', 'Уровень', 'Посещаемость', 'Убито боссов', 'Совершено набегов'];

/** Рейтинг: вкладки «Профили» и «Гильдии», карточки рейтингов, поиск своего места. */
export function RatingMainPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const tab = useStore(ratingStore, (s) => s.tab);
	const server = useSession((s) => currentProfile(s)?.server ?? 1);
	const game = useSession((s) => s.game);
	const [data, setData] = useState<Awaited<ReturnType<typeof loadRating>> | undefined>(undefined);
	const [attempt, setAttempt] = useState(0);
	const [mainUser, setMainUser] = useState<number | undefined>(Number(game?._vkId) || undefined);
	const [mainGuild, setMainGuild] = useState<number | undefined>(Number(game?._clan_id) || undefined);

	useEffect(() => {
		let alive = true;
		setData(undefined);
		void loadRating(tab, server).then((result) => alive && setData(result));
		return () => {
			alive = false;
		};
	}, [tab, server, attempt]);

	const own = tab === 1 ? mainUser : mainGuild;
	const blocks = data ? data.blocks : (tab === 1 ? PROFILE_SKELETON : GUILD_SKELETON).map(() => null);
	const setTab = (next: RatingTab) => ratingStore.set({ tab: next });

	const tabs = (
		<div className={styles.tabs}>
			{([1, 2] as const).map((value) => (
				<Tappable key={value} className={`${styles.tab} ${tab === value ? styles.tabSelected : ''}`} onClick={() => setTab(value)} activeMode="opacity">
					<span className={styles.tabLabel}>{value === 1 ? 'Профили' : 'Гильдии'}</span>
					<span className={styles.tabUnderline} />
				</Tappable>
			))}
		</div>
	);

	return (
		<Panel id={id}>
			{isDesktop ? (
				<Group mode="plain" separator="hide" className={`AppGroup ${styles.headerCard}`}>
					<div className={styles.desktopHeader}>
						<div className={styles.headerSide} />
						{tabs}
						<div className={styles.headerSide}>
							<CopyButton view="rating" />
						</div>
					</div>
				</Group>
			) : (
				<div className={styles.mobileHeader}>
					<PanelHeaderBack className={`${styles.back} HeaderBack`} onClick={() => openStory('home')} hideLabelOnIOS />
					{tabs}
					<div className={styles.headerSide} />
				</div>
			)}
			{data === null ? (
				<Group mode="plain" separator="hide" className="AppGroup">
					<RatingError text="Превышено количество попыток" action="Обновить" onAction={() => setAttempt((value) => value + 1)} minHeight={438} />
				</Group>
			) : (
				<>
					<div className={styles.grid}>
						{blocks.map((block, x) => (
							<RatingCard key={`${tab}-${x}`} block={block} tab={tab} own={own} wide={x === 0} isDesktop={isDesktop} />
						))}
					</div>
					<Group mode="plain" separator="hide" className={`AppGroup ${styles.footerCard}`}>
						{isDesktop &&
							(data ? (
								<Input
									key={tab}
									type="text"
									align="center"
									placeholder={tab === 1 ? 'Введите номер профиля' : 'Введите номер гильдии'}
									defaultValue={own ?? ''}
									onChange={(event) => {
										const found = findRating(data.search, event.target.value);
										if (tab === 1) setMainUser(found);
										else setMainGuild(found);
									}}
								/>
							) : (
								<Skeleton height={36} />
							))}
						{isDesktop && <div className={styles.gap8} />}
						<div className={styles.footer}>
							{data ? (
								`${server == 1 ? 'Эрмун' : 'Антарес'}, обновлено ${ratingDate(data.time)} в 12:00, ${numberSpaces(data.count)} ${tab === 1 ? 'игроков' : 'гильдий'}`
							) : (
								<Skeleton height={16} width="35%" style={{ margin: 'auto' }} />
							)}
						</div>
						{!isDesktop && <div className={styles.gap8} />}
					</Group>
				</>
			)}
		</Panel>
	);
}

const PAGE = 50;

/** Полный список одного рейтинга с листанием и своим местом внизу. */
export function RatingListPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const current = useStore(ratingStore, (s) => s.current);
	const [page, setPage] = useState(0);

	// Рейтинг выбирается на главной панели; по прямой ссылке (panel=1) неизвестно, какой список открыть, — идём на главную панель рейтинга
	useEffect(() => {
		if (!current) openPanel(null);
	}, [current]);
	if (!current) return <Panel id={id} />;

	const title = `${current.name} (${current.subname})`;
	const description = `Рейтинг — ${['профили', 'гильдии'][current.tab - 1]}`;
	const rows = current.items;
	const mineIndex = current.id ? rows.findIndex((row) => row.id == current.id) : -1;
	return (
		<WikiPanel
			id={id}
			parent="rating"
			title={title}
			description={description}
			avatar="labels/23.png"
			top={
				<div className={styles.listHead}>
					<TableStatic grid={grid(isDesktop)}>
						<TableHead>#</TableHead>
						<div className={styles.avatarSpace} />
						<TableHead>имя</TableHead>
						<TableHead right>{current.name.toLowerCase()}</TableHead>
					</TableStatic>
				</div>
			}
			bottom={
				<div className={styles.listBottom}>
					{current.id ? (
						mineIndex !== -1 ? (
							<RatingTableRow row={rows[mineIndex]!} place={mineIndex + 1} tab={current.tab} isDesktop={isDesktop} />
						) : (
							<div className={styles.hint}>Авторизуйте профиль на сервере Эрмун и обновите приложение</div>
						)
					) : (
						<div className={styles.hint}>Авторизуйтесь для отображения {current.tab === 2 ? 'вашей гильдии' : 'вашего профиля'} в рейтинге</div>
					)}
					<div className={styles.separator} />
					<Pager page={page} pages={Math.ceil(rows.length / PAGE)} onChange={setPage} />
				</div>
			}
		>
			<ScrollBox height={392}>
				{rows.slice(page * PAGE, (page + 1) * PAGE).map((row, x) => (
					<RatingTableRow key={x} row={row} place={page * PAGE + x + 1} tab={current.tab} isDesktop={isDesktop} />
				))}
			</ScrollBox>
		</WikiPanel>
	);
}

export const RATING_SECTION: SectionPanels = {
	rating: RatingMainPanel,
	'1': RatingListPanel,
};
