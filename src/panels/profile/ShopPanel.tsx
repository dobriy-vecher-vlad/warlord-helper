import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon12Add, Icon24Done, Icon56FragmentsOutline } from '@vkontakte/icons';
import type { ProfileResponse } from '../../api/gameTypes';
import { useIsDesktop } from '../../app/layout';
import { notify } from '../../app/notify';
import { Divider } from '../../components/Divider';
import { SelectedItem, MOBILE_ACTION_HEIGHT, type ActionLayout } from '../../components/profile/SelectedItem';
import { FooterButton } from '../../components/profile/BotBlocks';
import { LoadFailed } from '../../components/profile/LoadFailed';
import { Counter, Counters, FooterSkeleton } from '../../components/profile/Counters';
import { LazyGrid } from '../../components/profile/LazyGrid';
import { Placeholder } from '../../components/profile/Placeholder';
import { ScrollBox } from '../../components/profile/ScrollBox';
import { Tabs, TabsSkeleton } from '../../components/profile/ProfileBlocks';
import { Skeleton } from '../../components/Skeleton';
import { Currency } from '../../components/wiki/Currency';
import { ItemCard, ItemCardGrid } from '../../components/wiki/ItemCard';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { numberSpaces } from '../../lib/format';
import { ITEM_TYPES } from '../../lib/items';
import type { ShopBuyData } from '../../modals/profile/ShopBuyModal';
import { botAuth, loadBotProfile, type BotAuth } from '../../profile/bots/common';
import { setSession } from '../../profile/session';
import {
	balanceOf,
	CURRENCIES,
	currencyName,
	buyItem,
	characterOf,
	droppedIds,
	isExpensive,
	ownedIds,
	shopFromCatalog,
	shopStatus,
	sortShop,
	statGain,
	type ShopItem,
	type ShopStatus,
	type Wallet,
} from '../../profile/shop';
import { openModal } from '../../store/modal';
import { sectionBase } from '../section';
import styles from './ShopPanel.module.css';

const base = sectionBase('profile', 'Мой профиль');

/** Пока профиль игры не загружен, показывать нечего: страница рисует заглушку загрузки. */
const EMPTY_WALLET: Wallet = { level: 0, owned: new Set(), dropped: new Set(), balance: null, character: null };

/** «Открыто» — всё, что можно купить по условиям (уровень, выпало), хватает денег или нет. */
type Filter = 'all' | 'available' | 'owned' | 'lock' | 'drop';

const FILTERS: { value: Filter; title: string }[] = [
	{ value: 'all', title: 'Все' },
	{ value: 'available', title: 'Открыто' },
	{ value: 'owned', title: 'Куплено' },
	{ value: 'lock', title: 'Закрыто' },
	{ value: 'drop', title: 'Не выпало' },
];

/** К какому фильтру относится состояние покупки (кроме «Все»). */
const FILTER_OF: Record<ShopStatus, Exclude<Filter, 'all'>> = { buy: 'available', short: 'available', owned: 'owned', lock: 'lock', drop: 'drop' };

const TYPE_TABS = [{ value: 0, title: 'Все' }, ...ITEM_TYPES] as const;

/** Справа в карточке: купленное отмечено галочкой, остальное показывает цены друг под другом (красные, если не хватает; серые, если закрыто). */
function End({ entry, status, wallet }: { entry: ShopItem; status: ShopStatus; wallet: Wallet }) {
	if (status === 'owned') return <Icon24Done className={styles.owned} />;
	return (
		<span className={styles.prices}>
			{entry.prices.map(([currency, price]) => (
				<span
					key={currency}
					className={`${styles.price} ${wallet.balance && (wallet.balance[currency] ?? 0) < price && status === 'short' ? styles.short : ''} ${status === 'lock' || status === 'drop' ? styles.dim : ''}`}
				>
					{numberSpaces(price)} <Currency id={currency} />
				</span>
			))}
		</span>
	);
}

/**
 * Баланс валюты предмета (сколько спишется) и то, что предмет даёт: урон и здоровье (сколько прибавится к текущим). Ячейка без прибавки
 * не показывается.
 */
function ShopCounters({ entry, wallet }: { entry: ShopItem; wallet: Wallet }) {
	const gain = statGain(entry);
	return (
		<Counters>
			{entry.prices.map(([currency, price]) => (
				<Counter key={currency} title={currencyName(currency)} now={wallet.balance?.[currency]} change={wallet.balance ? -price : 0} suffix={<Currency id={currency} />} />
			))}
			{gain.dmg > 0 && <Counter title="Урон" now={wallet.character?.dmg} change={gain.dmg} suffix="DMG" />}
			{gain.hp > 0 && <Counter title="Здоровье" now={wallet.character?.hp} change={gain.hp} suffix="HP" />}
		</Counters>
	);
}

/**
 * 1. Магазин: предметы, которые покупаются за валюту, и покупка. Только с подпиской и паролем авторизации игры (как кузница и боссы): без пароля
 * открываются настройки профиля, а страница закрывается. Список, баланс, уровень, купленные и выпавшие предметы берутся из профиля игры:
 * каталог магазина игры сам говорит, что продаётся сразу, что только после выпадения с босса, из сундука или рейда, а что выдаётся иначе
 * (арена, ивенты, кузница гильдии) и в магазин не входит. Дорогие покупки (`isExpensive`) просят подтверждения. Удалась ли покупка,
 * определяется по обновлённому профилю.
 */
export function ShopPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const bot = useRef<BotAuth | null>(null);
	const lock = useRef(false);
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	// Покупка тратит валюту: пока она идёт, закрытие вкладки и уход со страницы просят подтверждения, а кнопка занята
	const [buying, setBuying] = useState(false);
	useLeaveGuard(buying);
	const [tab, setTab] = useState(0);
	const [filter, setFilter] = useState<Filter>('all');
	// Валюта цены: 0 — любая
	const [currency, setCurrency] = useState(0);
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

	const wallet = useMemo<Wallet>(
		() =>
			profile
				? { level: Number(profile.u._lvl) || 0, owned: ownedIds(profile), dropped: droppedIds(profile), balance: balanceOf(profile), character: characterOf(profile.u) }
				: EMPTY_WALLET,
		[profile],
	);
	// Каталог магазина игры лежит в профиле игры
	const catalog = useMemo(() => shopFromCatalog(profile) ?? [], [profile]);
	const byType = useMemo(() => catalog.filter((entry) => tab === 0 || entry.item.type === tab), [catalog, tab]);
	const byCurrency = useMemo(() => byType.filter((entry) => currency === 0 || entry.prices.some(([value]) => value === currency)), [byType, currency]);
	// Счётчики типов считают весь каталог, статусов — выбранные тип и валюту. Выбор в строках ниже счётчики не меняет
	const counts = useMemo(() => {
		const result: Record<Filter, number> = { all: byCurrency.length, available: 0, owned: 0, lock: 0, drop: 0 };
		for (const entry of byCurrency) result[FILTER_OF[shopStatus(entry, wallet)]]++;
		return result;
	}, [byCurrency, wallet]);
	const list = useMemo(
		() =>
			sortShop(
				byCurrency.filter((entry) => filter === 'all' || FILTER_OF[shopStatus(entry, wallet)] === filter),
				wallet,
			),
		[byCurrency, filter, wallet],
	);
	// Купленный предмет выбрать нельзя: если выбранный оказался купленным, выбор сбрасывается
	const found = list.find((entry) => entry.item.id === active);
	const selected = found && shopStatus(found, wallet) !== 'owned' ? found : null;

	const typeOptions = TYPE_TABS.map((type) => ({
		value: type.value,
		title: type.title,
		status: catalog.filter((entry) => type.value === 0 || entry.item.type === type.value).length,
	}));
	const filterOptions = FILTERS.map((option) => ({ value: option.value, title: option.title, status: counts[option.value] }));
	const currencyOptions = [{ value: 0, title: 'Все' }, ...CURRENCIES.map(({ id: value, name }) => ({ value, title: name, status: numberSpaces(wallet.balance?.[value] ?? 0) }))];

	// Любой выбор в строках фильтров сбрасывает выбранный предмет, как и смена типа
	const changeTab = (value: number) => {
		setTab(value);
		setActive(null);
	};

	const changeCurrency = (value: number) => {
		setCurrency(value);
		setActive(null);
	};

	const changeFilter = (value: Filter) => {
		setFilter(value);
		setActive(null);
	};

	const purchase = async (entry: ShopItem) => {
		// Второе нажатие, пока идёт первое, потратило бы валюту ещё раз
		if (!bot.current || lock.current) return;
		lock.current = true;
		setBuying(true);
		try {
			const { message } = await buyItem(bot.current, entry.item.id);
			const data = await reload();
			if (message) notify({ text: message, icon: 'error' });
			else if (!data) notify({ text: 'Не удалось обновить данные, проверьте покупку позже', icon: 'error' });
			else if (ownedIds(data).has(entry.item.id)) {
				notify({ text: `Куплено: ${entry.item.title}`, icon: 'done' });
				setActive(null);
				// Остальные разделы берут купленное из сессии
				setSession((state) => ({
					...state,
					items: state.items.includes(entry.item.id) ? state.items : [...state.items, entry.item.id],
					itemsFull: state.itemsFull.some((owned) => owned.id === entry.item.id)
						? state.itemsFull
						: [
								...state.itemsFull,
								{
									id: entry.item.id,
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
			} else notify({ text: 'Не удалось купить предмет', icon: 'error' });
		} finally {
			// Метка снимается всегда: иначе охранник выхода остался бы включённым, а кнопка заблокированной
			lock.current = false;
			setBuying(false);
		}
	};

	const requestPurchase = (entry: ShopItem) => {
		if (!isExpensive(entry)) return void purchase(entry);
		openModal('shopBuy', {
			index: entry.index,
			prices: entry.prices.map(([currency, price]) => ({ currency, price, balance: wallet.balance?.[currency] ?? 0 })),
			onConfirm: () => void purchase(entry),
		} satisfies ShopBuyData);
	};

	const placeholderSize = 68 + 16 + 56 + (isDesktop ? 0 : MOBILE_ACTION_HEIGHT) - (20 + 56 + 12);
	const hint = (
		<Placeholder className={styles.hint} icon={<Icon56FragmentsOutline />} style={{ padding: `${placeholderSize / 2 + 1}px 32px ${placeholderSize / 2}px` }}>
			Выберите предмет для покупки
		</Placeholder>
	);

	const ready = !!profile;
	const top = ready ? (
		<>
			<Tabs options={typeOptions} value={tab} onChange={changeTab} />
			<Divider size={8} />
			<Tabs options={currencyOptions} value={currency} onChange={changeCurrency} />
			<Divider size={8} />
			<Tabs options={filterOptions} value={filter} onChange={changeFilter} />
		</>
	) : (
		<TabsSkeleton rows={3} />
	);

	let bottom;
	if (!ready) {
		bottom = <FooterSkeleton />;
	} else if (selected) {
		const status = shopStatus(selected, wallet);
		const button = ({ stretched }: ActionLayout) =>
			status === 'lock' ? (
				<FooterButton stretched={stretched} mode="secondary" disabled>
					С {selected.level} уровня
				</FooterButton>
			) : status === 'drop' ? (
				<FooterButton stretched={stretched} mode="secondary" disabled>
					Недоступно
				</FooterButton>
			) : status === 'short' ? (
				<FooterButton stretched={stretched} mode="secondary" disabled>
					Не хватает ресурсов
				</FooterButton>
			) : (
				<FooterButton stretched={stretched} mode="commerce" loading={buying} before={<Icon12Add />} onClick={() => requestPurchase(selected)}>
					Купить
				</FooterButton>
			);
		bottom = (
			<>
				<SelectedItem index={selected.index} button={button} />
				<Divider />
				<ShopCounters entry={selected} wallet={wallet} />
			</>
		);
	} else {
		bottom = hint;
	}

	return (
		<WikiPanel {...base(id, 'Магазин', 12)} top={top} bottom={bottom}>
			{ready ? (
				<LazyGrid
					items={list}
					step={30}
					height={372}
					resetKey={`${tab}-${filter}-${currency}`}
					render={(entry) => (
						<ItemCard
							key={entry.item.id}
							index={entry.index}
							selected={active === entry.item.id}
							disabled={shopStatus(entry, wallet) === 'owned'}
							onClick={() => setActive(active === entry.item.id ? null : entry.item.id)}
							end={<End entry={entry} status={shopStatus(entry, wallet)} wallet={wallet} />}
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
