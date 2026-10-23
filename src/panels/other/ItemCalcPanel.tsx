import { useMemo } from 'react';
import { PickSelect } from '../../components/form/PickSelect';
import { GameBanner, Parchment } from '../../components/GameBanner';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { numberSpaces } from '../../lib/format';
import { ITEMS } from '../../lib/items';
import { useCalcItem } from '../../store/itemCalc';
import { openPanel } from '../../store/nav';
import { ITEM_CALC_PANELS } from '../calcPanels';
import { sectionBase } from '../section';
import { enchantLevels } from './enchant';
import styles from './ItemCalcPanel.module.css';

const base = sectionBase('other', 'Разное');

/** 1. Калькулятор улучшения предмета: урон и здоровье на каждом уровне заточки. */
export function ItemCalcPanel({ id }: { id: string }) {
	const item = ITEMS[useCalcItem()] ?? ITEMS[0]!;
	const dmg = useMemo(() => enchantLevels(item.dmg), [item]);
	const hp = useMemo(() => enchantLevels(item.hp), [item]);
	return (
		<WikiPanel
			{...base(id, 'Калькулятор', 26)}
			info={
				<>
					Первые пять уровней предмет улучшается за свою валюту из магазина
					<br />
					Легендарные уровни предмета улучшаются за редкие жемчужины
				</>
			}
			bottom={
				<div className={styles.select}>
					<PickSelect image={item.icon} onClick={() => openPanel(ITEM_CALC_PANELS.item)}>
						{item.title}
					</PickSelect>
				</div>
			}
		>
			<GameBanner title={item.title} subtitle={item.description} background="bosses/backgrounds/20.png" item={`items/${item.id}b.png`}>
				{dmg.map((value, x) => (
					<Parchment
						key={x}
						badge={x + 1}
						label={
							<>
								<span className={styles.dmg}>
									{numberSpaces(value)} [+{numberSpaces(value - item.dmg)}]
								</span>
								<br />
								<span className={styles.hp}>
									{numberSpaces(hp[x])} [+{numberSpaces((hp[x] ?? 0) - item.hp)}]
								</span>
							</>
						}
					/>
				))}
			</GameBanner>
		</WikiPanel>
	);
}
