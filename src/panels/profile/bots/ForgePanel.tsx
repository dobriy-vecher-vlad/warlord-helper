import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLeaveGuard } from '../../../lib/leaveGuard';
import { Icon12Add, Icon56FragmentsOutline } from '@vkontakte/icons';
import type { ProfileResponse } from '../../../api/gameTypes';
import { getGame } from '../../../api/game';
import { useIsDesktop } from '../../../app/layout';
import { notify } from '../../../app/notify';
import { SelectedItem, MOBILE_ACTION_HEIGHT } from '../../../components/profile/SelectedItem';
import { FooterButton } from '../../../components/profile/BotBlocks';
import { LoadFailed } from '../../../components/profile/LoadFailed';
import { Counter, Counters, FooterSkeleton } from '../../../components/profile/Counters';
import { Divider } from '../../../components/Divider';
import { LazyGrid } from '../../../components/profile/LazyGrid';
import { Placeholder } from '../../../components/profile/Placeholder';
import { Tabs, TabsSkeleton } from '../../../components/profile/ProfileBlocks';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { Currency } from '../../../components/wiki/Currency';
import { ItemCard, ItemCardGrid } from '../../../components/wiki/ItemCard';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { numberSpaces, type Forms } from '../../../lib/format';
import { ITEMS, ITEM_INDEX, ITEM_TYPES, type Item } from '../../../lib/items';
import { asArray, botAuth, loadBotProfile, type BotAuth } from '../../../profile/bots/common';
import { setSession } from '../../../profile/session';
import styles from './ForgePanel.module.css';

/** Доля характеристик предмета, которую даёт каждый уровень улучшения (1–10). */
const MULTIPLIER = [0.1, 0.15, 0.2, 0.25, 0.3, 0.1, 0.15, 0.2, 0.25, 0.3];
/** Шанс улучшения на каждом уровне, % */
const CHANCE = [100, 70, 35, 25, 10, 10, 10, 10, 10, 10];
/** Заточек (уровни 1–5) или жемчужин (6–10) на улучшение */
const SCROLLS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 20];

interface Resource {
	id: string;
	name: string;
	forms: Forms;
	/** Цена улучшения = характеристики × доля × множитель валюты */
	multiplier: number;
}

const RESOURCES: Resource[] = [
	{ id: 'm1', name: 'Серебро', forms: ['серебро', 'серебра', 'серебра'], multiplier: 120 },
	{ id: 'm3', name: 'Золото', forms: ['золото', 'золота', 'золота'], multiplier: 120 },
	{ id: 'm2', name: 'Рубины', forms: ['рубин', 'рубина', 'рубинов'], multiplier: 1 },
	{ id: 'm6', name: 'Турмалины', forms: ['турмалин', 'турмалина', 'турмалинов'], multiplier: 5 },
	{ id: 'm4', name: 'Аметисты', forms: ['аметист', 'аметиста', 'аметистов'], multiplier: 7 },
	{ id: 'm5', name: 'Топазы', forms: ['топаз', 'топаза', 'топазов'], multiplier: 8 },
	{ id: 'm9', name: 'Редкие жемчужины', forms: ['жемчужина', 'жемчужины', 'жемчужин'], multiplier: 0 },
];

/** Вкладка «Все» в строке ресурсов */
const ALL = 'all';

const TYPE_TABS = [{ value: 0, title: 'Все' }, ...ITEM_TYPES] as const;

const resourceOf = (currency: number) => RESOURCES.find((resource) => resource.id === `m${currency}`);

/** Улучшение списывает ресурс на каждую цену предмета: у предметов кузницы гильдии это аметисты и топазы сразу. */
const currenciesOf = (item: Item) => item.prices.map(([currency]) => currency);

/** Предмет персонажа, который можно улучшить сейчас. */
interface ForgeItem {
	index: number;
	item: Item;
	lvl: number;
	/** Заточек этого предмета у персонажа (для жемчужин — 0) */
	scrolls: number;
	/** Цена улучшения в каждой валюте предмета по уровням */
	costs: { currency: number; prices: number[] }[];
	/** Не хватает хотя бы одной валюты на следующий уровень */
	blocked: boolean;
	dmg: number[];
	hp: number[];
}

/** Предметы персонажа, которые можно улучшить за ресурс вкладки (как updateItems в старом приложении). */
function forgeItems(profile: ProfileResponse | null, tab: string, counts: Record<string, number>): ForgeItem[] {
	const upgrades = asArray(profile?.iupgrade?.i);
	const result: ForgeItem[] = [];
	for (const owned of asArray(profile?.i).filter((entry) => Number(entry._o) === 1)) {
		const index = ITEM_INDEX.get(Number(owned._id));
		const item = index === undefined ? undefined : ITEMS[index];
		if (index === undefined || !item) continue;
		const lvl = Number(owned._u) || 0;
		let scrolls = 0;
		if (tab === 'm9') {
			if (lvl < 5 || lvl >= 10 || (counts.m9 ?? 0) < SCROLLS[lvl]!) continue;
		} else {
			if (!currenciesOf(item).some((currency) => `m${currency}` === tab)) continue;
			scrolls = Number(upgrades.find((entry) => Number(entry._id) === item.id)?._cnt) || 0;
			if (lvl >= 5 || scrolls < SCROLLS[lvl]!) continue;
		}
		// Прибавка урона и здоровья за уровень (каждая округляется вверх отдельно, как в игре) и по ней цена в каждой валюте
		const dmg = MULTIPLIER.map((share) => Math.ceil(item.dmg * share || 0));
		const hp = MULTIPLIER.map((share) => Math.ceil(item.hp * share || 0));
		const costs = currenciesOf(item).map((currency) => {
			const multiplier = resourceOf(currency)?.multiplier || 1;
			return { currency, prices: MULTIPLIER.map((_, level) => (dmg[level]! + hp[level]!) * multiplier) };
		});
		result.push({
			index,
			item,
			lvl,
			scrolls,
			costs,
			blocked: costs.some((cost) => (counts[`m${cost.currency}`] ?? 0) < cost.prices[lvl]!),
			dmg,
			hp,
		});
	}
	return result.sort((a, b) => b.lvl - a.lvl);
}

const sumTo = (values: number[], count: number) => values.slice(0, count).reduce((a, b) => a + b, 0);

/**
 * Футер выбранного предмета: сначала что прибавится к урону и здоровью (ячейка без прибавки не показывается), затем сколько спишется (валюта
 * предмета, заточки или жемчужины) и в конце шанс с прибавкой от навыка гильдии.
 */
function ForgeCounters({ data, counts, clanBonus }: { data: ForgeItem; counts: Record<string, number>; clanBonus: number }) {
	const currentDmg = sumTo(data.dmg, data.lvl);
	const currentHp = sumTo(data.hp, data.lvl);
	const pearls = data.lvl >= 5;
	// Шанс улучшения: базовый по уровню плюс прибавка от навыка гильдии, но не больше 100% (как в клиенте игры)
	const base = CHANCE[data.lvl]!;
	const chance = Math.min(100, base + clanBonus);
	return (
		<Counters>
			{data.dmg[data.lvl]! > 0 && <Counter title="Урон" now={data.item.dmg + currentDmg} change={data.dmg[data.lvl]} suffix="DMG" />}
			{data.hp[data.lvl]! > 0 && <Counter title="Здоровье" now={(data.item.hp + currentHp) * 15} change={data.hp[data.lvl]! * 15} suffix="HP" />}
			{data.costs.map((cost) => (
				<Counter
					key={cost.currency}
					title={resourceOf(cost.currency)?.name ?? ''}
					now={counts[`m${cost.currency}`]}
					change={-cost.prices[data.lvl]!}
					suffix={<Currency id={cost.currency} />}
				/>
			))}
			<Counter title={pearls ? 'Жемчужины' : 'Заточки'} now={pearls ? counts.m9 : data.scrolls} change={-SCROLLS[data.lvl]!} suffix={<Currency id={pearls ? 9 : 7} />} />
			<Counter title="Шанс" now={base} change={chance - base} suffix="%" tight />
		</Counters>
	);
}

/** Уровень улучшения справа в карточке: 0 серым, 1–5 оранжевым, 6–10 фиолетовым. */
function Level({ lvl }: { lvl: number }) {
	return <span className={`${styles.level} ${lvl === 0 ? styles.dim : lvl <= 5 ? styles.orange : styles.purple}`}>{lvl}</span>;
}

/** 10. Кузница: улучшение предметов персонажа за серебро, золото, камни или жемчужины. */
export function ForgePanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const bot = useRef<BotAuth | null>(null);
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState(ALL);
	const [type, setType] = useState(0);
	const [active, setActive] = useState<number | null>(null);
	// Улучшение тратит ресурсы игры: пока оно идёт, закрытие вкладки и уход со страницы просят подтверждения
	const [upgrading, setUpgrading] = useState(false);
	// Метка в ref срабатывает сразу, а состояние только после перерисовки: два быстрых нажатия иначе потратили бы ресурсы дважды
	const lock = useRef(false);
	useLeaveGuard(upgrading);

	/** Профиль с сервера; null — бот не запустился (нет пароля или он неверный). */
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

	const counts = useMemo(() => Object.fromEntries(RESOURCES.map((resource) => [resource.id, Number(profile?.u?.[`_${resource.id}`]) || 0])), [profile]);
	// Все улучшаемые предметы по всем ресурсам: из них строится вкладка «Все» и счётчики типов (они не зависят от выбранного ресурса).
	// Предмет с двумя валютами лежит на двух вкладках, но в общем списке он один
	const everything = useMemo(() => {
		if (!profile) return [];
		const byId = new Map<number, ForgeItem>();
		for (const resource of RESOURCES) for (const data of forgeItems(profile, resource.id, counts)) if (!byId.has(data.item.id)) byId.set(data.item.id, data);
		return [...byId.values()].sort((x, y) => y.lvl - x.lvl);
	}, [profile, counts]);
	const items = useMemo(
		() => (profile ? (tab === ALL ? everything : forgeItems(profile, tab, counts)).filter((data) => type === 0 || data.item.type === type) : null),
		[profile, tab, counts, type, everything],
	);
	const typeOptions = useMemo(
		() =>
			TYPE_TABS.map((option) => ({ value: option.value, title: option.title, status: everything.filter((data) => option.value === 0 || data.item.type === option.value).length })),
		[everything],
	);
	const selected = items?.find((data) => data.item.id === active) ?? null;

	const changeTab = (value: string) => {
		setTab(value);
		setActive(null);
	};

	const changeType = (value: number) => {
		setType(value);
		setActive(null);
	};

	const upgrade = async (data: ForgeItem) => {
		// Второе нажатие, пока идёт первое, потратило бы ресурсы ещё раз
		if (!bot.current || lock.current) return;
		lock.current = true;
		setLoading(true);
		setUpgrading(true);
		try {
			const result = await getGame(bot.current.server, { i: 26, t1: data.item.id }, bot.current.auth);
			if (result?.a?._res) {
				if (result.msg === 'Недостаточно ресурсов.') notify({ text: 'Недостаточно ресурсов для улучшения предмета', icon: 'error' });
				else if (Number(result.a._res) === 1) notify({ text: 'Удачная попытка улучшения предмета', icon: 'done' });
				else if (Number(result.a._res) === 2) notify({ text: 'Неудачная попытка улучшения предмета', icon: 'error' });
				else notify({ text: 'Неизвестная ошибка при улучшении предмета', icon: 'error' });
			} else {
				notify({ text: result?.msg ?? (typeof result === 'string' ? result : 'Неизвестная ошибка при улучшении предмета'), icon: 'error' });
			}
			const fresh = await reload();
			const lvl = Number(asArray(fresh?.i).find((entry) => Number(entry._id) === data.item.id)?._u);
			// Остальные разделы берут уровни предметов из сессии
			if (Number.isFinite(lvl)) setSession((state) => ({ ...state, itemsFull: state.itemsFull.map((owned) => (owned.id === data.item.id ? { ...owned, lvl } : owned)) }));
			setActive(data.item.id);
		} finally {
			// Метка снимается всегда: иначе охранник выхода остался бы включённым, а кнопка заблокированной
			lock.current = false;
			setUpgrading(false);
			setLoading(false);
		}
	};

	// Подсказка внизу той же высоты, что и выбранный предмет с характеристиками
	const placeholderSize = 68 + 16 + 56 + (isDesktop ? 0 : MOBILE_ACTION_HEIGHT) - (20 + 56 + 12);
	const hint = (
		<Placeholder className={styles.hint} icon={<Icon56FragmentsOutline />} style={{ padding: `${placeholderSize / 2 + 1}px 32px ${placeholderSize / 2}px` }}>
			Выберите предмет для улучшения
		</Placeholder>
	);

	const ready = !!profile;
	const top = ready ? (
		<>
			<Tabs options={typeOptions} value={type} onChange={changeType} />
			<Divider size={8} />
			<Tabs
				options={[{ value: ALL, title: 'Все' }, ...RESOURCES.map((resource) => ({ value: resource.id, title: resource.name, status: numberSpaces(counts[resource.id]) }))]}
				value={tab}
				onChange={changeTab}
			/>
		</>
	) : (
		<TabsSkeleton rows={2} />
	);

	let bottom;
	if (!ready) {
		bottom = <FooterSkeleton />;
	} else if (selected) {
		bottom = (
			<>
				<SelectedItem
					index={selected.index}
					button={({ stretched }) =>
						selected.blocked ? (
							<FooterButton stretched={stretched} mode="secondary" disabled>
								Не хватает ресурсов
							</FooterButton>
						) : (
							<FooterButton stretched={stretched} mode="commerce" loading={loading} before={<Icon12Add />} onClick={() => void upgrade(selected)}>
								Улучшить
							</FooterButton>
						)
					}
				/>
				<Divider />
				<ForgeCounters data={selected} counts={counts} clanBonus={Number(profile?.clan?._u4) || 0} />
			</>
		);
	} else {
		bottom = hint;
	}

	return (
		<WikiPanel id={id} parent="profile" title="Кузница" description="Мой профиль" avatar="labels/20.png" top={top} bottom={bottom}>
			{ready ? (
				<LazyGrid
					items={items ?? []}
					step={30}
					height={372}
					resetKey={`${tab}-${type}`}
					render={(data) => (
						<ItemCard
							key={data.item.id}
							index={data.index}
							selected={active === data.item.id}
							onClick={() => setActive(active === data.item.id ? null : data.item.id)}
							end={<Level lvl={data.lvl} />}
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
