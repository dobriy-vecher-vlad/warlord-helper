import { useMemo, useState } from 'react';
import {
	Icon28CancelCircleOutline,
	Icon28CheckCircleOutline,
	Icon28CoinsOutline,
	Icon28DiamondOutline,
	Icon28FavoriteOutline,
	Icon28GiftOutline,
	Icon28StatisticsOutline,
} from '@vkontakte/icons';
import { StatCards, type StatCardData } from '../../components/StatCards';
import { Tabs } from '../../components/profile/ProfileBlocks';
import { LazyGrid } from '../../components/profile/LazyGrid';
import { ItemCard } from '../../components/wiki/ItemCard';
import { FilterCards } from '../../components/wiki/ItemFilterBar';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../config';
import Collections from '../../data/collections.json';
import { numberForm, numberSpaces } from '../../lib/format';
import { ITEMS, ITEM_TYPES } from '../../lib/items';
import { useSession, type OwnedItem } from '../../profile/session';
import styles from './ItemsPanels.module.css';
import { sectionBase } from '../section';

/** Типы предметов на вкладках (номер — тип в каталоге, 1 — все). */
const TYPE_TABS = [{ value: 1, title: 'Все' }, ...ITEM_TYPES] as const;

const base = sectionBase('profile', 'Мой профиль');

interface StockPanelProps {
	id: string;
	title: string;
	label: number;
	/** Предметы раздела (индексы каталога) */
	source: readonly number[];
	forms: [string, string, string];
	/** «куплен / куплены» и т. п. */
	owned: [string, string, string];
	yesTitle: string;
	noTitle: string;
}

/** Магазин и коллекции: какие предметы раздела есть у персонажа. */
function StockPanel({ id, title, label, source, forms, owned, yesTitle, noTitle }: StockPanelProps) {
	const items = useSession((s) => s.items);
	const [tab, setTab] = useState<number>(1);
	const [mode, setMode] = useState({ yesStock: true, noStock: true });

	const { list, has, missing } = useMemo(() => {
		const set = new Set(items);
		const all = source.filter((index) => tab === 1 || ITEMS[index]!.type === tab);
		const bought = (index: number) => set.has(ITEMS[index]!.id);
		const has = all.filter(bought).length;
		let list = all;
		if (!mode.yesStock) list = list.filter((index) => !bought(index));
		if (!mode.noStock) list = list.filter(bought);
		return { list, has, missing: all.length - has };
	}, [items, source, tab, mode]);

	const total = has + missing;
	const cards: StatCardData[] = [
		{ value: `${total} ${numberForm(total, forms)}`, label: 'всего', icon: <Icon28FavoriteOutline />, color: 'var(--systemOrange)' },
		{ value: `${has} ${numberForm(has, forms)}`, label: numberForm(has, owned), icon: <Icon28CheckCircleOutline />, color: 'var(--systemGreen)' },
		{ value: `${missing} ${numberForm(missing, forms)}`, label: `не ${numberForm(missing, owned)}`, icon: <Icon28CancelCircleOutline />, color: 'var(--systemRed)' },
	];

	return (
		<WikiPanel
			{...base(id, title, label)}
			top={
				<>
					<Tabs options={TYPE_TABS} value={tab} onChange={setTab} />
					<StatCards cards={cards} />
				</>
			}
			bottom={
				<FilterCards
					options={[
						{ key: 'yesStock', title: yesTitle, icon: <Icon28CheckCircleOutline width={24} height={24} />, color: 'var(--dynamic_green)', checked: mode.yesStock },
						{ key: 'noStock', title: noTitle, icon: <Icon28CancelCircleOutline width={24} height={24} />, color: 'var(--destructive)', checked: mode.noStock },
					]}
					onToggle={(key, checked) => setMode((value) => ({ ...value, [key]: checked }))}
				/>
			}
		>
			<LazyGrid
				wide
				items={list}
				step={30}
				height={372}
				resetKey={`${tab}-${mode.yesStock}-${mode.noStock}`}
				render={(index) => <ItemCard key={index} index={index} kind="item" />}
			/>
		</WikiPanel>
	);
}

const ALL_ITEMS = ITEMS.map((_, index) => index);
const COLLECTION_ITEMS = ALL_ITEMS.filter((index) => Collections.items.includes(ITEMS[index]!.id));

/** 1. Магазин: все предметы игры и какие из них куплены. */
export function ShopPanel({ id }: { id: string }) {
	return (
		<StockPanel
			id={id}
			title="Магазин"
			label={12}
			source={ALL_ITEMS}
			forms={['предмет', 'предмета', 'предметов']}
			owned={['куплен', 'куплены', 'куплены']}
			yesTitle="Купленные предметы"
			noTitle="Не купленные предметы"
		/>
	);
}

/** 2. Коллекции: предметы-коллекции и какие из них собраны. */
export function CollectionsPanel({ id }: { id: string }) {
	return (
		<StockPanel
			id={id}
			title="Коллекции"
			label={20}
			source={COLLECTION_ITEMS}
			forms={['коллекция', 'коллекции', 'коллекций']}
			owned={['собрана', 'собраны', 'собрано']}
			yesTitle="Собранные предметы"
			noTitle="Не собранные предметы"
		/>
	);
}

/** Камни предмета: всегда три кружка внахлёст, пустой слот — серый круг (UsersStack в старом приложении). */
function Stones({ stones }: { stones: OwnedItem['stones'] }) {
	return (
		<span className={styles.stones}>
			{stones.map(([section, level], index) => (
				<span key={index} className={styles.stone}>
					{section !== 0 && <img src={`${PATH_IMAGES}stones/${(section - 1) * 7 + level}.png`} alt="" />}
				</span>
			))}
		</span>
	);
}

/** 3. Инкрустация: купленные предметы с уровнями и камнями. */
export function InlayPanel({ id }: { id: string }) {
	const itemsFull = useSession((s) => s.itemsFull);
	const [tab, setTab] = useState<number>(1);

	const list = useMemo(() => {
		const owned = new Map(itemsFull.map((item) => [item.id, item]));
		const rows = ALL_ITEMS.filter((index) => tab === 1 || ITEMS[index]!.type === tab)
			.map((index) => ({ index, data: owned.get(ITEMS[index]!.id) }))
			.filter((row): row is { index: number; data: OwnedItem } => !!row.data);
		// Сначала уровень, затем сумма бонусов камней (здоровье ×15), как в старом приложении
		const score = (item: OwnedItem) => item.bonus[0]! + item.bonus[1]! + item.bonus[2]! * 15;
		return rows.sort((a, b) => {
			if (b.data.lvl < a.data.lvl) return -1;
			if (b.data.lvl > a.data.lvl) return 1;
			if (score(b.data) < score(a.data)) return -1;
			if (score(b.data) > score(a.data)) return 1;
			return 0;
		});
	}, [itemsFull, tab]);

	const sum = (pick: (item: OwnedItem) => number) => list.reduce((total, row) => total + pick(row.data), 0);
	const count = list.length;
	const stones = sum((item) => item.stones.filter(([section]) => section !== 0).length);
	const levels = sum((item) => item.lvl);
	const damage = sum((item) => item.bonus[0]!);
	const health = sum((item) => item.bonus[2]!) * 15;
	const energy = sum((item) => item.bonus[1]!);
	const cards: StatCardData[] = [
		{
			value: `${numberSpaces(count)} ${numberForm(count, ['предмет', 'предмета', 'предметов'])}`,
			label: numberForm(count, ['куплен', 'куплены', 'куплены']),
			icon: <Icon28CoinsOutline />,
			color: 'var(--systemOrange)',
		},
		{
			value: `${numberSpaces(stones)} ${numberForm(stones, ['камень', 'камня', 'камней'])}`,
			label: numberForm(stones, ['вставлен', 'вставлено', 'вставлено']),
			icon: <Icon28DiamondOutline />,
			color: 'var(--systemRed)',
		},
		{
			value: `${numberSpaces(levels)} ${numberForm(levels, ['уровень', 'уровня', 'уровней'])}`,
			label: numberForm(levels, ['улучшен', 'улучшено', 'улучшено']),
			icon: <Icon28StatisticsOutline />,
			color: 'var(--systemBlue)',
		},
		{ value: `${numberSpaces(damage)} ${numberForm(damage, ['урон', 'урона', 'урона'])}`, label: 'бонус от камней', icon: <Icon28GiftOutline />, color: 'var(--systemGreen)' },
		{
			value: `${numberSpaces(health)} ${numberForm(health, ['здоровье', 'здоровья', 'здоровья'])}`,
			label: 'бонус от камней',
			icon: <Icon28GiftOutline />,
			color: 'var(--systemGreen)',
		},
		{
			value: `${numberSpaces(energy)} ${numberForm(energy, ['энергия', 'энергии', 'энергии'])}`,
			label: 'бонус от камней',
			icon: <Icon28GiftOutline />,
			color: 'var(--systemGreen)',
		},
	];

	return (
		<WikiPanel
			{...base(id, 'Инкрустация', 31)}
			top={
				<>
					<Tabs options={TYPE_TABS} value={tab} onChange={setTab} />
					<StatCards cards={cards} />
				</>
			}
		>
			<LazyGrid
				wide
				items={list}
				step={24}
				height={437}
				resetKey={tab}
				render={({ index, data }) => <ItemCard key={index} index={index} plain caption={`${data.lvl} уровень`} bottom={<Stones stones={data.stones} />} />}
			/>
		</WikiPanel>
	);
}
