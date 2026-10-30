import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UsersStack } from '@vkontakte/vkui';
import { Icon12Add, Icon16Add, Icon24Add, Icon56FragmentsOutline } from '@vkontakte/icons';
import type { ProfileResponse } from '../../api/gameTypes';
import { useIsDesktop } from '../../app/layout';
import { notify } from '../../app/notify';
import { askConfirm } from '../../lib/confirmAction';
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
import { Currency } from '../../components/wiki/Currency';
import { ItemCard, ItemCardGrid } from '../../components/wiki/ItemCard';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../config';
import { preferLarge } from '../../lib/largeImage';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { ITEM_TYPES } from '../../lib/items';
import type { InlayModalData, InlayStone } from '../../modals/profile/InlayModal';
import { botAuth, loadBotProfile, type BotAuth } from '../../profile/bots/common';
import {
	REMOVE_PRICE,
	PARCHMENTS,
	RUBIES,
	STONE_CURRENCY_NAMES,
	STONE_KINDS,
	createState,
	createStone,
	insertPrice,
	insertStone,
	inlayItems,
	hasFreeSlot,
	hasStones,
	removeStone,
	stoneBonusText,
	stoneCounts,
	stoneIcon,
	stoneKey,
	stonesFromProfile,
	walletOf,
	type CreateState,
	type InlayItem,
	type Stone,
} from '../../profile/inlay';
import { setSession } from '../../profile/session';
import { openModal } from '../../store/modal';
import { sectionBase } from '../section';
import styles from './InlayPanel.module.css';

const base = sectionBase('profile', 'Мой профиль');

/** Сторона плитки в футере, px (как аватарка предмета в карточке). */
const TILE = 60;

type Mode = 'items' | 'stones';
const MODES: { value: Mode; title: string }[] = [
	{ value: 'items', title: 'Предметы' },
	{ value: 'stones', title: 'Камни' },
];

const ITEM_TYPE_TABS = [{ value: 0, title: 'Все' }, ...ITEM_TYPES] as const;
const STONE_KIND_TABS = [{ value: 0, title: 'Все' }, ...STONE_KINDS.map((kind) => ({ value: kind.type, title: kind.name }))] as const;

type ItemFilter = 'all' | 'with' | 'free' | 'full';
const ITEM_FILTERS: { value: ItemFilter; title: string }[] = [
	{ value: 'all', title: 'Все' },
	{ value: 'with', title: 'С камнями' },
	{ value: 'free', title: 'Есть слот' },
	{ value: 'full', title: 'Заполнены' },
];

/** Подходит ли предмет под фильтр: «с камнями» — и заполненные, и частично заполненные. */
const matches = (entry: InlayItem, filter: ItemFilter) =>
	filter === 'all' || (filter === 'with' ? hasStones(entry) : filter === 'free' ? hasFreeSlot(entry) : hasStones(entry) && !hasFreeSlot(entry));

type StoneFilter = 'all' | CreateState;
const STONE_FILTERS: { value: StoneFilter; title: string }[] = [
	{ value: 'all', title: 'Все' },
	{ value: 'can', title: 'Можно создать' },
	{ value: 'short', title: 'Не хватает' },
];

interface StoneRow {
	stone: Stone;
	count: number;
	state: CreateState;
}

/** Картинка камня в списке и футере: рамка со срезом вшитой обводки. */
const StoneImage = ({ type, level, className }: { type: number; level: number; className?: string }) => <BorderedImage src={stoneIcon(type, level)} className={className} />;

/** Пустой слот в стопке: прозрачная картинка, фон круга убирает класс обёртки, остаётся одна обводка. */
const EMPTY_SLOT = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

/** Справа в карточке предмета: слоты стопкой аватарок (UsersStack VKUI, размер l): камень или пустой кружок с пунктирной обводкой и плюсом. */
function SlotsEnd({ entry }: { entry: InlayItem }) {
	return (
		<UsersStack
			className={styles.stack}
			size="l"
			visibleCount={entry.slots}
			photos={entry.stones.map((stone) =>
				stone
					? { src: `${PATH_IMAGES}${preferLarge(stoneIcon(stone[0], stone[1]))}` }
					: {
							src: EMPTY_SLOT,
							renderWrapper: ({ children }) => (
								<span className={styles.emptyCircle}>
									{children}
									<Icon16Add className={styles.plus} />
								</span>
							),
						},
			)}
		/>
	);
}

/** Слот предмета в футере: камень с числом таких камней в запасе или пустой с плюсом; нажатие сразу открывает окно (вставка или снятие). */
function SlotTile({ stone, count, onClick }: { stone: [number, number] | null; count: number; onClick: () => void }) {
	return (
		<div className={styles.tile} role="button" tabIndex={0} onClick={onClick}>
			{stone ? (
				<>
					<StoneImage type={stone[0]} level={stone[1]} className={styles.tileImage} />
					<span className={styles.tileCount}>{count}</span>
				</>
			) : (
				<span className={`${styles.tileImage} ${styles.emptyTile}`}>
					<Icon24Add />
				</span>
			)}
		</div>
	);
}

/**
 * 3. Инкрустация: камни в предметах и создание камней. Только с подпиской и паролем авторизации игры (как магазин и кузница).
 * Режим «Предметы»: купленные предметы со слотами, вставка камня из запаса и платное снятие (рубины). Режим «Камни»: все 21 камень, сколько их в запасе
 * и создание (из трёх камней предыдущего уровня и ресурсов). Удалась ли операция, определяется по обновлённому профилю.
 */
export function InlayPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const bot = useRef<BotAuth | null>(null);
	const lock = useRef(false);
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	// Операции тратят ресурсы или рубины: пока идёт запрос, закрытие вкладки и уход со страницы просят подтверждения, а кнопка занята
	const [busy, setBusy] = useState(false);
	useLeaveGuard(busy);
	const [mode, setMode] = useState<Mode>('items');
	const [itemType, setItemType] = useState(0);
	const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
	const [stoneKind, setStoneKind] = useState(0);
	const [stoneFilter, setStoneFilter] = useState<StoneFilter>('all');
	const [activeItem, setActiveItem] = useState<number | null>(null);
	const [activeStone, setActiveStone] = useState<string | null>(null);

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

	const items = useMemo(() => inlayItems(profile) ?? [], [profile]);
	const catalog = useMemo(() => stonesFromProfile(profile) ?? [], [profile]);
	const counts = useMemo(() => stoneCounts(profile), [profile]);
	const wallet = useMemo(() => walletOf(profile), [profile]);

	// Предметы: счётчики строк зависят только от строк выше (тип считает все предметы, состояние — выбранный тип)
	const itemsByType = useMemo(() => items.filter((entry) => itemType === 0 || entry.item.type === itemType), [items, itemType]);
	const itemList = useMemo(() => {
		const score = (entry: InlayItem) => entry.bonus.dmg + entry.bonus.en + entry.bonus.end * 15;
		return (
			itemsByType
				.filter((entry) => matches(entry, itemFilter))
				// Сначала предметы с пустым слотом, затем выше уровень улучшения и сумма бонусов камней
				.sort((a, b) => Number(hasFreeSlot(b)) - Number(hasFreeSlot(a)) || b.upgrade - a.upgrade || score(b) - score(a))
		);
	}, [itemsByType, itemFilter]);
	const selectedItem = itemList.find((entry) => entry.item.id === activeItem) ?? null;

	// Камни: то же самое по виду камня и возможности создания
	const stoneRows = useMemo<StoneRow[]>(
		() => catalog.map((stone) => ({ stone, count: counts.get(stoneKey(stone.type, stone.level)) ?? 0, state: createState(stone, counts, wallet) })),
		[catalog, counts, wallet],
	);
	const stonesByKind = useMemo(() => stoneRows.filter((row) => stoneKind === 0 || row.stone.type === stoneKind), [stoneRows, stoneKind]);
	const stoneList = useMemo(() => stonesByKind.filter((row) => stoneFilter === 'all' || row.state === stoneFilter), [stonesByKind, stoneFilter]);
	const selectedStone = stoneList.find((row) => stoneKey(row.stone.type, row.stone.level) === activeStone) ?? null;

	const modeOptions = MODES.map((option) => ({ value: option.value, title: option.title, status: option.value === 'items' ? items.length : catalog.length }));
	const typeOptions =
		mode === 'items'
			? ITEM_TYPE_TABS.map((option) => ({
					value: option.value,
					title: option.title,
					status: items.filter((entry) => option.value === 0 || entry.item.type === option.value).length,
				}))
			: STONE_KIND_TABS.map((option) => ({
					value: option.value,
					title: option.title,
					status: stoneRows.filter((row) => option.value === 0 || row.stone.type === option.value).length,
				}));
	const itemFilterOptions = ITEM_FILTERS.map((option) => ({
		value: option.value,
		title: option.title,
		status: itemsByType.filter((entry) => matches(entry, option.value)).length,
	}));
	const stoneFilterOptions = STONE_FILTERS.map((option) => ({
		value: option.value,
		title: option.title,
		status: stonesByKind.filter((row) => option.value === 'all' || row.state === option.value).length,
	}));

	// Любой выбор в строках фильтров сбрасывает выбранный предмет и камень
	const reset = () => {
		setActiveItem(null);
		setActiveStone(null);
	};
	const changeMode = (value: Mode) => {
		setMode(value);
		reset();
	};
	const changeType = (value: number) => {
		if (mode === 'items') setItemType(value);
		else setStoneKind(value);
		reset();
	};
	const changeItemFilter = (value: ItemFilter) => {
		setItemFilter(value);
		reset();
	};
	const changeStoneFilter = (value: StoneFilter) => {
		setStoneFilter(value);
		reset();
	};

	/** Операция с запросом: метка от повторного нажатия, обновление профиля и сообщение по его результату. */
	const run = async (send: (auth: BotAuth) => Promise<{ message: string | null; sent: boolean }>, verify: (data: ProfileResponse) => boolean, done: string, fail: string) => {
		if (!bot.current || lock.current) return;
		lock.current = true;
		setBusy(true);
		try {
			const { message } = await send(bot.current);
			const data = await reload();
			if (message) notify({ text: message, icon: 'error' });
			else if (!data) notify({ text: 'Не удалось обновить данные, проверьте результат позже', icon: 'error' });
			else if (verify(data)) {
				notify({ text: done, icon: 'done' });
				// Остальные разделы берут бонусы предметов из сессии
				const fresh = inlayItems(data) ?? [];
				setSession((state) => ({
					...state,
					itemsFull: state.itemsFull.map((owned) => {
						const entry = fresh.find((candidate) => candidate.item.id === owned.id);
						if (!entry) return owned;
						return {
							...owned,
							stones: [0, 1, 2].map((position) => entry.stones[position] ?? [0, 0]) as typeof owned.stones,
							bonus: [entry.bonus.dmg, entry.bonus.en, entry.bonus.end],
						};
					}),
				}));
			} else notify({ text: fail, icon: 'error' });
		} finally {
			// Метка снимается всегда: иначе охранник выхода остался бы включённым, а кнопка заблокированной
			lock.current = false;
			setBusy(false);
		}
	};

	const create = (row: StoneRow) => {
		const before = row.count;
		void run(
			(auth) => createStone(auth, row.stone.type, row.stone.level),
			(data) => (stoneCounts(data).get(stoneKey(row.stone.type, row.stone.level)) ?? 0) > before,
			`Создан камень: ${row.stone.name}`,
			'Не удалось создать камень',
		);
	};

	const insert = (entry: InlayItem, position: number, stone: InlayStone) =>
		void run(
			(auth) => insertStone(auth, entry.item.id, position, stone.type, stone.level),
			(data) => !!inlayItems(data)?.find((candidate) => candidate.item.id === entry.item.id)?.stones[position - 1],
			`Камень вставлен: ${stone.name}`,
			'Не удалось вставить камень',
		);

	const remove = (entry: InlayItem, position: number) =>
		void run(
			(auth) => removeStone(auth, entry.item.id, position),
			(data) => !inlayItems(data)?.find((candidate) => candidate.item.id === entry.item.id)?.stones[position - 1],
			'Камень достали и вернули в запас',
			'Не удалось достать камень',
		);

	/** Камни из запаса, которые можно вставить в слот. */
	const freeStones = (): InlayStone[] =>
		stoneRows
			.filter((row) => row.count > 0)
			.map((row) => ({
				type: row.stone.type,
				level: row.stone.level,
				name: row.stone.name,
				value: row.stone.value,
				count: row.count,
				price: insertPrice(row.stone.type, row.stone.value),
			}));

	const openPick = (entry: InlayItem, position: number) =>
		openModal('inlay', { stones: freeStones(), balance: wallet[PARCHMENTS] ?? 0, onPick: (stone) => insert(entry, position, stone) } satisfies InlayModalData);

	const openRemove = (entry: InlayItem, position: number) => {
		const placed = entry.stones[position - 1];
		const stone = placed && catalog.find((candidate) => candidate.type === placed[0] && candidate.level === placed[1]);
		if (!stone) return;
		if ((wallet[RUBIES] ?? 0) < REMOVE_PRICE) return notify({ text: `Не хватает рубинов, нужно ${REMOVE_PRICE}`, icon: 'error' });
		askConfirm({
			title: 'Достать камень?',
			description: `${stone.name} вернётся в запас, это стоит ${REMOVE_PRICE} рубинов`,
			confirm: 'Достать',
			destructive: true,
			onConfirm: () => remove(entry, position),
		});
	};

	// В «Предметах» кнопки в футере нет, в «Камнях» на телефоне она второй строкой
	const placeholderSize = 68 + 16 + TILE + (isDesktop || mode === 'items' ? 0 : MOBILE_ACTION_HEIGHT) - (20 + 56 + 12);
	const hint = (
		<Placeholder className={styles.hint} icon={<Icon56FragmentsOutline />} style={{ padding: `${placeholderSize / 2 + 1}px 32px ${placeholderSize / 2}px` }}>
			{mode === 'items' ? 'Выберите предмет' : 'Выберите камень'}
		</Placeholder>
	);

	const ready = !!profile;
	const top = ready ? (
		<>
			<Tabs options={modeOptions} value={mode} onChange={changeMode} />
			<Divider size={8} />
			<Tabs options={typeOptions} value={mode === 'items' ? itemType : stoneKind} onChange={changeType} />
			<Divider size={8} />
			{mode === 'items' ? (
				<Tabs options={itemFilterOptions} value={itemFilter} onChange={changeItemFilter} />
			) : (
				<Tabs options={stoneFilterOptions} value={stoneFilter} onChange={changeStoneFilter} />
			)}
		</>
	) : (
		<TabsSkeleton rows={3} />
	);

	let bottom;
	if (!ready) {
		bottom = <FooterSkeleton cell={{ count: 4, width: TILE, height: TILE }} />;
	} else if (mode === 'items' && selectedItem) {
		bottom = (
			<>
				<SelectedItem index={selectedItem.index} />
				<Divider />
				<Counters>
					{selectedItem.stones.map((stone, position) => (
						<SlotTile
							key={position}
							stone={stone}
							count={stone ? (counts.get(stoneKey(stone[0], stone[1])) ?? 0) : 0}
							onClick={() => (stone ? openRemove(selectedItem, position + 1) : openPick(selectedItem, position + 1))}
						/>
					))}
					{selectedItem.bonus.dmg > 0 && <Counter title="Урон" now={selectedItem.bonus.dmg} suffix="DMG" />}
					{selectedItem.bonus.end > 0 && <Counter title="Здоровье" now={selectedItem.bonus.end * 15} suffix="HP" />}
					{selectedItem.bonus.en > 0 && <Counter title="Энергия" now={selectedItem.bonus.en} />}
				</Counters>
			</>
		);
	} else if (mode === 'stones' && selectedStone) {
		const { stone, count, state } = selectedStone;
		const need = stone.need;
		const button = ({ stretched }: { stretched: boolean }) =>
			state === 'base' ? (
				<FooterButton stretched={stretched} mode="secondary" disabled>
					Только находят
				</FooterButton>
			) : state === 'short' ? (
				<FooterButton stretched={stretched} mode="secondary" disabled>
					Не хватает ресурсов
				</FooterButton>
			) : (
				<FooterButton stretched={stretched} mode="commerce" loading={busy} before={<Icon12Add />} onClick={() => create(selectedStone)}>
					Создать
				</FooterButton>
			);
		bottom = (
			<>
				<SelectedItem index={0} custom={{ title: stone.name, icon: stoneIcon(stone.type, stone.level), description: stoneBonusText(stone.type, stone.value) }} button={button} />
				<Divider />
				<Counters>
					{need && (
						<Counter
							title="Камни"
							now={counts.get(stoneKey(need.type, need.level)) ?? 0}
							change={-need.count}
							suffix={<StoneImage type={need.type} level={need.level} className={styles.suffixStone} />}
						/>
					)}
					{stone.cost.map(([currency, amount]) => (
						<Counter key={currency} title={STONE_CURRENCY_NAMES[currency] ?? 'Ресурс'} now={wallet[currency] ?? 0} change={-amount} suffix={<Currency id={currency} />} />
					))}
					<Counter title="В запасе" now={count} change={need ? 1 : 0} />
				</Counters>
			</>
		);
	} else {
		bottom = hint;
	}

	return (
		<WikiPanel {...base(id, 'Инкрустация', 31)} top={top} bottom={bottom}>
			{ready ? (
				mode === 'items' ? (
					<LazyGrid
						items={itemList}
						step={30}
						height={372}
						resetKey={`items-${itemType}-${itemFilter}`}
						render={(entry) => (
							<ItemCard
								key={entry.item.id}
								index={entry.index}
								selected={activeItem === entry.item.id}
								onClick={() => setActiveItem(activeItem === entry.item.id ? null : entry.item.id)}
								end={<SlotsEnd entry={entry} />}
							/>
						)}
					/>
				) : (
					<LazyGrid
						items={stoneList}
						step={30}
						height={372}
						resetKey={`stones-${stoneKind}-${stoneFilter}`}
						render={(row) => {
							const key = stoneKey(row.stone.type, row.stone.level);
							return (
								<ItemCard
									key={key}
									index={0}
									custom={{ title: row.stone.name, icon: stoneIcon(row.stone.type, row.stone.level), description: stoneBonusText(row.stone.type, row.stone.value) }}
									selected={activeStone === key}
									onClick={() => setActiveStone(activeStone === key ? null : key)}
									end={<span className={`${styles.count} ${row.count === 0 ? styles.dim : ''}`}>{row.count}</span>}
								/>
							);
						}}
					/>
				)
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
