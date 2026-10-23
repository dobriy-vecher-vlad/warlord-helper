import { useState } from 'react';
import { Icon20MoneyCircleOutline, Icon20SkullOutline, Icon20StatisticsOutline } from '@vkontakte/icons';
import { SliderField, SliderGrid } from '../../components/form/Form';
import { StatCards, type StatCardData } from '../../components/StatCards';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { numberSpaces } from '../../lib/format';
import { sectionBase } from '../section';
import { CUPS_PER_WIN, fightPrice, winsBetween } from './arenaMath';

const base = sectionBase('arena', 'Арена');

/** 1. Калькулятор арены: сколько побед и золота нужно до цели по кубкам. */
export function ArenaCalcPanel({ id }: { id: string }) {
	const [current, setCurrent] = useState(200);
	const [target, setTarget] = useState(200);
	const wins = winsBetween(current, target);
	const cards: StatCardData[] = [
		{ value: `${numberSpaces(wins)} шт.`, label: 'Победные бои', icon: <Icon20SkullOutline />, color: 'var(--systemRed)' },
		{ value: `${numberSpaces(wins * CUPS_PER_WIN)} ед.`, label: 'Кубки', icon: <Icon20StatisticsOutline />, color: 'var(--systemYellow)' },
		{ value: `${numberSpaces(fightPrice(current, target))} ед.`, label: 'Золото', icon: <Icon20MoneyCircleOutline />, color: 'var(--systemOrange)' },
	];
	return (
		<WikiPanel
			{...base(id, 'Калькулятор', 8)}
			info={
				<>
					На арене идёт состязание двух игроков с примерно одинаковыми характеристиками
					<br />В качестве награды за победу игрок получает: случайный сундук, 19 кубков и опыт
				</>
			}
		>
			<SliderGrid>
				<SliderField label="Текущее количество кубков" value={current} min={0} max={10000} onChange={setCurrent} />
				<SliderField label="Конечное количество кубков" value={target} min={0} max={10000} onChange={setTarget} />
			</SliderGrid>
			<StatCards plain cards={cards} />
		</WikiPanel>
	);
}
