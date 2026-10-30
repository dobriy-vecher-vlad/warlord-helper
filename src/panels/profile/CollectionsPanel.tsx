import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon12Add, Icon56FragmentsOutline } from '@vkontakte/icons';
import type { ProfileResponse } from '../../api/gameTypes';
import { useIsDesktop } from '../../app/layout';
import { notify } from '../../app/notify';
import { BorderedImage } from '../../components/BorderedImage';
import { Divider } from '../../components/Divider';
import { FooterButton } from '../../components/form/FooterButton';
import { Counter, Counters, FooterSkeleton } from '../../components/profile/Counters';
import { LazyGrid } from '../../components/profile/LazyGrid';
import { LoadFailed } from '../../components/profile/LoadFailed';
import { Placeholder } from '../../components/profile/Placeholder';
import { Tabs, TabsSkeleton } from '../../components/profile/ProfileBlocks';
import { ScrollBox } from '../../components/profile/ScrollBox';
import { MOBILE_ACTION_HEIGHT, SelectedItem } from '../../components/profile/SelectedItem';
import { Skeleton } from '../../components/Skeleton';
import { ItemCard, ItemCardGrid } from '../../components/wiki/ItemCard';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { ITEM_TYPES } from '../../lib/items';
import { botAuth, loadBotProfile, type BotAuth } from '../../profile/bots/common';
import {
	collect,
	collectionState,
	collectionsFromProfile,
	partCounts,
	readinessOf,
	sortCollections,
	stageOf,
	timesCollected,
	type Collection,
	type CollectionState,
	type Readiness,
	type Stage,
} from '../../profile/collections';
import { setSession } from '../../profile/session';
import { ownedIds } from '../../profile/shop';
import { sectionBase } from '../section';
import styles from './CollectionsPanel.module.css';

/** Сторона плитки части в футере, px (как аватарка предмета в карточке). */
const TILE = 60;

const base = sectionBase('profile', 'Мой профиль');

const TYPE_TABS = [{ value: 0, title: 'Все' }, ...ITEM_TYPES] as const;

/** Этап сборки: первая даёт предмет, повторная заточку для него. */
type StageFilter = 'all' | Stage;
const STAGES: { value: StageFilter; title: string }[] = [
	{ value: 'all', title: 'Все' },
	{ value: 'first', title: 'Предмет' },
	{ value: 'repeat', title: 'Заточка' },
];

type ReadyFilter = 'all' | Readiness;
const READINESS: { value: ReadyFilter; title: string }[] = [
	{ value: 'all', title: 'Все' },
	{ value: 'ready', title: 'Можно собрать' },
	{ value: 'progress', title: 'В процессе' },
	{ value: 'empty', title: 'Нет частей' },
];

interface Row {
	collection: Collection;
	state: CollectionState;
}

/** Справа в карточке: сколько сборок готово (зелёным) или сколько видов частей из скольких есть. */
function End({ row }: { row: Row }) {
	const { state, collection } = row;
	const ready = state.sets > 0;
	return (
		<span className={`${styles.progress} ${ready ? styles.ready : state.have > 0 ? styles.some : styles.dim}`}>
			{ready ? `×${state.sets}` : `${state.have} из ${collection.parts.length}`}
		</span>
	);
}

/**
 * Футер выбранной коллекции: ряд квадратных плиток с обводкой, как аватарка предмета, листается по горизонтали. На каждой из пяти частей
 * картинка и сколько таких частей есть (нет части — картинка приглушена), шестая ячейка, как в магазине и кузнице, — сколько раз коллекция уже собрана и на сколько вырастет при обмене (+1, показывается всегда).
 */
function CollectionParts({ row }: { row: Row }) {
	const { collection, state } = row;
	return (
		<Counters>
			{collection.parts.map((part, position) => {
				const count = state.counts[position] ?? 0;
				return (
					<div key={part.id} className={styles.tile} title={part.name}>
						<BorderedImage src={`collections/${part.id}.png`} className={`${styles.tileImage} ${count === 0 ? styles.missing : ''}`} />
						<span className={styles.partCount}>{count}</span>
					</div>
				);
			})}
			<Counter title="Собрано" now={state.times} change={1} suffix="раз" />
		</Counters>
	);
}

/**
 * 2. Коллекции: части коллекций, готовность к сборке и сама сборка. Только с подпиской и паролем авторизации игры (как магазин, кузница и боссы).
 * Первая сборка выдаёт предмет, каждая следующая — одну заточку для него. Каталог, количество частей и число сборок берутся из профиля игры;
 * удалась ли сборка, определяется по обновлённому профилю (выросло число сборок).
 */
export function CollectionsPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const bot = useRef<BotAuth | null>(null);
	const lock = useRef(false);
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	// Сборка расходует части: пока она идёт, закрытие вкладки и уход со страницы просят подтверждения, а кнопка занята
	const [collecting, setCollecting] = useState(false);
	useLeaveGuard(collecting);
	const [tab, setTab] = useState(0);
	const [stage, setStage] = useState<StageFilter>('all');
	const [readiness, setReadiness] = useState<ReadyFilter>('all');
	const [active, setActive] = useState<number | null>(null);

	/** Профиль с сервера; null — нет пароля (открыты настройки), он неверный или сервер не ответил (сообщение уже показано). */
	const reload = useCallback(async () => {
		const auth = bot.current ?? botAuth();
		if (!auth) return null;
		bot.current = auth;
		setLoading(true);
		const data = await loadBotProfile(auth);
		if (data) setProfile(data);
		setLoading(false);
		return data;
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const rows = useMemo<Row[]>(() => {
		const catalog = collectionsFromProfile(profile) ?? [];
		const counts = partCounts(profile);
		const times = timesCollected(profile);
		const owned = ownedIds(profile);
		return catalog.map((collection) => ({ collection, state: collectionState(collection, counts, times, owned) }));
	}, [profile]);

	// Счётчики строк зависят только от строк выше: тип считает все коллекции, готовность — выбранный тип, этап — выбранные тип и готовность
	const byType = useMemo(() => rows.filter((row) => tab === 0 || row.collection.item.type === tab), [rows, tab]);
	const byReadiness = useMemo(() => byType.filter((row) => readiness === 'all' || readinessOf(row.state) === readiness), [byType, readiness]);
	const list = useMemo(() => sortCollections(byReadiness.filter((row) => stage === 'all' || stageOf(row.state) === stage)), [byReadiness, stage]);
	const selected = list.find((row) => row.collection.id === active) ?? null;

	const typeOptions = TYPE_TABS.map((type) => ({
		value: type.value,
		title: type.title,
		status: rows.filter((row) => type.value === 0 || row.collection.item.type === type.value).length,
	}));
	const readinessOptions = READINESS.map((option) => ({
		value: option.value,
		title: option.title,
		status: byType.filter((row) => option.value === 'all' || readinessOf(row.state) === option.value).length,
	}));
	const stageOptions = STAGES.map((option) => ({
		value: option.value,
		title: option.title,
		status: byReadiness.filter((row) => option.value === 'all' || stageOf(row.state) === option.value).length,
	}));

	// Любой выбор в строках фильтров сбрасывает выбранную коллекцию
	const changeTab = (value: number) => {
		setTab(value);
		setActive(null);
	};
	const changeStage = (value: StageFilter) => {
		setStage(value);
		setActive(null);
	};
	const changeReadiness = (value: ReadyFilter) => {
		setReadiness(value);
		setActive(null);
	};

	const assemble = async (row: Row) => {
		// Второе нажатие, пока идёт первое, потратило бы части ещё раз
		if (!bot.current || lock.current) return;
		lock.current = true;
		setCollecting(true);
		try {
			const { message } = await collect(bot.current, row.collection.id);
			const data = await reload();
			if (message) notify({ text: message, icon: 'error' });
			else if (!data) notify({ text: 'Не удалось обновить данные, проверьте сборку позже', icon: 'error' });
			else if ((timesCollected(data).get(row.collection.id) ?? 0) > row.state.times) {
				const first = !row.state.owned;
				notify({ text: first ? `Получен предмет: ${row.collection.item.title}` : `Получена заточка: ${row.collection.item.title}`, icon: 'done' });
				// Остальные разделы берут купленное из сессии
				if (first) {
					const itemId = row.collection.item.id;
					setSession((state) => ({
						...state,
						items: state.items.includes(itemId) ? state.items : [...state.items, itemId],
						itemsFull: state.itemsFull.some((owned) => owned.id === itemId)
							? state.itemsFull
							: [
									...state.itemsFull,
									{
										id: itemId,
										lvl: 0,
										stones: [
											[0, 0],
											[0, 0],
											[0, 0],
										],
										bonus: [0, 0, 0],
									},
								],
					}));
				}
			} else notify({ text: 'Не удалось собрать коллекцию', icon: 'error' });
		} finally {
			// Метка снимается всегда: иначе охранник выхода остался бы включённым, а кнопка заблокированной
			lock.current = false;
			setCollecting(false);
		}
	};

	const placeholderSize = 68 + 16 + TILE + (isDesktop ? 0 : MOBILE_ACTION_HEIGHT) - (20 + 56 + 12);
	const hint = (
		<Placeholder className={styles.hint} icon={<Icon56FragmentsOutline />} style={{ padding: `${placeholderSize / 2 + 1}px 32px ${placeholderSize / 2}px` }}>
			Выберите коллекцию
		</Placeholder>
	);

	const ready = !!profile;
	const top = ready ? (
		<>
			<Tabs options={typeOptions} value={tab} onChange={changeTab} />
			<Divider size={8} />
			<Tabs options={readinessOptions} value={readiness} onChange={changeReadiness} />
			<Divider size={8} />
			<Tabs options={stageOptions} value={stage} onChange={changeStage} />
		</>
	) : (
		<TabsSkeleton rows={3} />
	);

	let bottom;
	if (!ready) {
		bottom = <FooterSkeleton cell={{ count: 6, width: TILE, height: TILE }} />;
	} else if (selected) {
		bottom = (
			<>
				<SelectedItem
					index={selected.collection.index}
					button={({ stretched }) =>
						selected.state.sets > 0 ? (
							<FooterButton stretched={stretched} mode="commerce" loading={collecting} before={<Icon12Add />} onClick={() => void assemble(selected)}>
								Обменять
							</FooterButton>
						) : (
							<FooterButton stretched={stretched} mode="secondary" disabled>
								Не хватает частей
							</FooterButton>
						)
					}
				/>
				<Divider />
				<CollectionParts row={selected} />
			</>
		);
	} else {
		bottom = hint;
	}

	return (
		<WikiPanel {...base(id, 'Коллекции', 11)} top={top} bottom={bottom}>
			{ready ? (
				<LazyGrid
					items={list}
					step={30}
					height={372}
					resetKey={`${tab}-${stage}-${readiness}`}
					render={(row) => (
						<ItemCard
							key={row.collection.id}
							index={row.collection.index}
							selected={active === row.collection.id}
							onClick={() => setActive(active === row.collection.id ? null : row.collection.id)}
							end={<End row={row} />}
						/>
					)}
				/>
			) : loading ? (
				<ScrollBox height={372}>
					<ItemCardGrid>
						{Array.from({ length: 10 }, (_, index) => (
							<Skeleton key={index} height={68} />
						))}
					</ItemCardGrid>
				</ScrollBox>
			) : (
				<LoadFailed onRetry={() => void reload()} />
			)}
		</WikiPanel>
	);
}
