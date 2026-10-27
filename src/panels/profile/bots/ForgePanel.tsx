import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLeaveGuard } from '../../../lib/leaveGuard';
import { Icon12ArrowUp, Icon16Up, Icon56FragmentsOutline } from '@vkontakte/icons';
import type { ProfileResponse } from '../../../api/gameTypes';
import { getGame } from '../../../api/game';
import { useIsDesktop } from '../../../app/layout';
import { notify } from '../../../app/notify';
import { Divider } from '../../../components/Divider';
import { Button } from '../../../components/form/Form';
import { LazyGrid } from '../../../components/profile/LazyGrid';
import { Placeholder } from '../../../components/profile/Placeholder';
import { Tabs } from '../../../components/profile/ProfileBlocks';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { ItemCard, ItemCardGrid } from '../../../components/wiki/ItemCard';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { numberForm, numberSpaces, type Forms } from '../../../lib/format';
import { ITEMS, type Item } from '../../../lib/items';
import { asArray, botAuth, loadBotProfile, type BotAuth } from '../../../profile/bots/common';
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

const resourceOf = (item: Item) => RESOURCES.find((resource) => resource.id === `m${item.currency}`);

/** Предмет персонажа, который можно улучшить сейчас. */
interface ForgeItem {
	index: number;
	item: Item;
	lvl: number;
	/** Заточек этого предмета у персонажа (для жемчужин — 0) */
	scrolls: number;
	/** Цена улучшения на каждом уровне */
	prices: number[];
	/** Не хватает валюты на следующий уровень */
	blocked: boolean;
	dmg: number[];
	hp: number[];
}

/** Предметы персонажа, которые можно улучшить за ресурс вкладки (как updateItems в старом приложении). */
function forgeItems(profile: ProfileResponse | null, tab: string, counts: Record<string, number>): ForgeItem[] {
	const upgrades = asArray(profile?.iupgrade?.i);
	const result: ForgeItem[] = [];
	for (const owned of asArray(profile?.i).filter((entry) => Number(entry._o) === 1)) {
		const index = ITEMS.findIndex((entry) => entry.id === Number(owned._id));
		const item = ITEMS[index];
		if (!item) continue;
		const lvl = Number(owned._u) || 0;
		let scrolls = 0;
		if (tab === 'm9') {
			if (lvl < 5 || lvl >= 10 || (counts.m9 ?? 0) < SCROLLS[lvl]!) continue;
		} else {
			if (`m${item.currency}` !== tab) continue;
			scrolls = Number(upgrades.find((entry) => Number(entry._id) === item.id)?._cnt) || 0;
			if (lvl >= 5 || scrolls < SCROLLS[lvl]!) continue;
		}
		const multiplier = resourceOf(item)?.multiplier || 1;
		const prices = MULTIPLIER.map((share) => Math.ceil((item.dmg + item.hp) * share) * multiplier);
		result.push({
			index,
			item,
			lvl,
			scrolls,
			prices,
			blocked: (counts[`m${item.currency}`] ?? 0) < prices[lvl]!,
			dmg: MULTIPLIER.map((share) => Math.ceil(item.dmg * share || 0)),
			hp: MULTIPLIER.map((share) => Math.ceil(item.hp * share || 0)),
		});
	}
	return result.sort((a, b) => b.lvl - a.lvl);
}

const sumTo = (values: number[], count: number) => values.slice(0, count).reduce((a, b) => a + b, 0);

/** Характеристики выбранного предмета: сейчас и прибавка за улучшение (CounterCell). */
function Counters({ data }: { data: ForgeItem }) {
	const currentDmg = sumTo(data.dmg, data.lvl);
	const currentHp = sumTo(data.hp, data.lvl);
	return (
		<div className={styles.counters}>
			<div className={styles.counter}>
				<div className={styles.counterTitle}>Урон</div>
				<div className={styles.counterContent}>
					<div className={styles.counterText}>{numberSpaces(data.item.dmg + currentDmg)} DMG</div>
					<div className={styles.counterText}>
						<Icon16Up /> {numberSpaces(data.dmg[data.lvl])} DMG
					</div>
				</div>
			</div>
			<div className={styles.counter}>
				<div className={styles.counterTitle}>Здоровье</div>
				<div className={styles.counterContent}>
					<div className={styles.counterText}>{numberSpaces((data.item.hp + currentHp) * 15)} HP</div>
					<div className={styles.counterText}>
						<Icon16Up /> {numberSpaces(data.hp[data.lvl]! * 15)} HP
					</div>
				</div>
			</div>
			<div className={styles.counter}>
				<div className={styles.counterTitle}>Шанс</div>
				<div className={styles.counterContent}>
					<div className={styles.counterText}>{CHANCE[data.lvl]}%</div>
				</div>
			</div>
		</div>
	);
}

/** 10. Кузница: улучшение предметов персонажа за серебро, золото, камни или жемчужины. */
export function ForgePanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const bot = useRef<BotAuth | null>(null);
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('m1');
	const [active, setActive] = useState<number | null>(null);
	// Улучшение тратит ресурсы игры: пока оно идёт, закрытие вкладки и уход со страницы просят подтверждения
	const [upgrading, setUpgrading] = useState(false);
	useLeaveGuard(upgrading);

	/** Профиль с сервера; null — бот не запустился (нет пароля или он неверный). */
	const reload = useCallback(async () => {
		const auth = bot.current ?? botAuth();
		if (!auth) return null;
		bot.current = auth;
		setLoading(true);
		const data = await loadBotProfile(auth, (value) => !!value?.u && asArray(value.i).length > 0);
		if (data) setProfile(data);
		setLoading(false);
		return data;
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const counts = useMemo(() => Object.fromEntries(RESOURCES.map((resource) => [resource.id, Number(profile?.u?.[`_${resource.id}`]) || 0])), [profile]);
	const items = useMemo(() => (profile ? forgeItems(profile, tab, counts) : null), [profile, tab, counts]);
	const selected = items?.find((data) => data.item.id === active) ?? null;

	const changeTab = (value: string) => {
		setTab(value);
		setActive(null);
	};

	const upgrade = async (data: ForgeItem) => {
		if (!bot.current) return;
		setLoading(true);
		setUpgrading(true);
		const result = await getGame(bot.current.server, { i: 26, t1: data.item.id }, bot.current.auth);
		if (result?.a?._res) {
			if (result.msg === 'Недостаточно ресурсов.') notify({ text: 'Недостаточно ресурсов для улучшения предмета', icon: 'error' });
			else if (Number(result.a._res) === 1) notify({ text: 'Удачная попытка улучшения предмета', icon: 'done' });
			else if (Number(result.a._res) === 2) notify({ text: 'Неудачная попытка улучшения предмета', icon: 'error' });
			else notify({ text: 'Неизвестная ошибка при улучшении предмета', icon: 'error' });
		} else {
			notify({ text: result?.msg ?? (typeof result === 'string' ? result : 'Неизвестная ошибка при улучшении предмета'), icon: 'error' });
		}
		await reload();
		setUpgrading(false);
		setActive(data.item.id);
	};

	// Подсказка внизу той же высоты, что и выбранный предмет с характеристиками
	const placeholderSize = 68 + 16 + (isDesktop ? 56 : 100) - (20 + 56 + 12);
	const hint = (
		<Placeholder className={styles.hint} icon={<Icon56FragmentsOutline />} style={{ padding: `${placeholderSize / 2 + 1}px 32px ${placeholderSize / 2}px` }}>
			Выберите предмет для улучшения
		</Placeholder>
	);

	const ready = !loading || items;
	const top = ready ? (
		<Tabs options={RESOURCES.map((resource) => ({ value: resource.id, title: resource.name, status: numberSpaces(counts[resource.id]) }))} value={tab} onChange={changeTab} />
	) : (
		<Skeleton height={isDesktop ? 44 : 48} style={isDesktop ? undefined : { margin: '0 8px', width: 'auto' }} />
	);

	let bottom;
	if (!ready) {
		bottom = (
			<>
				<Skeleton height={68} style={isDesktop ? undefined : { margin: '0 8px', width: 'auto' }} />
				<Divider />
				<div className={styles.counters}>
					<Skeleton height={56} width={isDesktop ? '30%' : '40%'} />
					<Skeleton height={56} width={isDesktop ? '30%' : '40%'} />
					<Skeleton height={isDesktop ? 56 : 36} width={isDesktop ? '30%' : '40%'} />
				</div>
			</>
		);
	} else if (selected) {
		const resource = resourceOf(selected.item);
		const price = selected.prices[selected.lvl]!;
		const scrolls = SCROLLS[selected.lvl]!;
		bottom = (
			<>
				<div className={styles.selected}>
					<ItemCard
						index={selected.index}
						caption={`Необходимо ${numberSpaces(price)} ${resource ? numberForm(price, resource.forms) : ''} и ${scrolls} ${numberForm(scrolls, selected.lvl >= 5 ? ['жемчужина', 'жемчужины', 'жемчужин'] : ['заточка', 'заточки', 'заточек'])}`}
						after={
							selected.blocked ? (
								<Button size="s" mode="secondary" disabled>
									Не хватает ресурсов
								</Button>
							) : (
								<Button size="s" mode="commerce" loading={loading} before={<Icon12ArrowUp />} onClick={() => void upgrade(selected)}>
									Улучшить
								</Button>
							)
						}
					/>
				</div>
				<Divider />
				<Counters data={selected} />
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
					resetKey={tab}
					render={(data) => (
						<ItemCard
							key={data.item.id}
							index={data.index}
							selected={active === data.item.id}
							onClick={() => setActive(active === data.item.id ? null : data.item.id)}
							caption={`${data.lvl} уровень${data.scrolls ? `, ${data.scrolls} ${numberForm(data.scrolls, ['заточка', 'заточки', 'заточек'])}` : ''}`}
						/>
					)}
				/>
			) : (
				<ScrollBox height={372}>
					<ItemCardGrid>
						{Array.from({ length: 10 }, (_, index) => (
							<Skeleton key={index} height={68} />
						))}
					</ItemCardGrid>
				</ScrollBox>
			)}
		</WikiPanel>
	);
}
