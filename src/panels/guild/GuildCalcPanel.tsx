import { useState } from 'react';
import { Icon20DiamondOutline, Icon20ShareExternalOutline } from '@vkontakte/icons';
import { SliderField, SliderGrid } from '../../components/form/Form';
import { StatGrid, type StatCardData } from '../../components/StatCards';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { numberForm, numberSpaces } from '../../lib/format';
import { sectionBase } from '../section';
import { AMETHYST_PRICE, TOPAZ_PRICE, guildCost } from './guildMath';

const base = sectionBase('guild', 'Гильдия');

/** Сколько камней показано в таблице цен. */
const PRICE_COUNTS = [1, 5, 25, 50];

const PRICES: StatCardData[] = PRICE_COUNTS.flatMap((count) => [
	{
		value: `${numberSpaces(TOPAZ_PRICE * count)} золота`,
		label: `${numberSpaces(count)} ${numberForm(count, ['топаз', 'топаза', 'топазов'])}`,
		icon: <Icon20DiamondOutline />,
		color: 'var(--systemOrange)',
	},
	{
		value: `${numberSpaces(AMETHYST_PRICE * count)} серебра`,
		label: `${numberSpaces(count)} ${numberForm(count, ['аметист', 'аметиста', 'аметистов'])}`,
		icon: <Icon20DiamondOutline />,
		color: 'var(--systemIndigo)',
	},
]);

/** 1. Калькулятор гильдии: сколько золота и серебра уйдёт на топазы и аметисты и сколько раз пополнять казну. */
export function GuildCalcPanel({ id }: { id: string }) {
	const [topaz, setTopaz] = useState(1);
	const [amethyst, setAmethyst] = useState(1);
	const cost = guildCost(topaz, amethyst);
	const totals: StatCardData[] = [
		{ value: `${numberSpaces(cost.topazCost)} ед.`, label: 'Необходимо золота', icon: <Icon20DiamondOutline />, color: 'var(--systemOrange)' },
		{ value: `${numberSpaces(cost.amethystCost)} ед.`, label: 'Необходимо серебра', icon: <Icon20DiamondOutline />, color: 'var(--systemCyan)' },
		{ value: `${numberSpaces(cost.topazRefills)} раз`, label: 'Пополнение казны', icon: <Icon20ShareExternalOutline />, color: 'var(--systemYellow)' },
		{ value: `${numberSpaces(cost.amethystRefills)} раз`, label: 'Пополнение казны', icon: <Icon20ShareExternalOutline />, color: 'var(--systemYellow)' },
	];
	return (
		<WikiPanel
			{...base(id, 'Калькулятор', 18)}
			info={
				<>
					Аметисты и Топазы можно получить только вкладываясь в улучшения навыков гильдии и при пополнении казны
					<br />
					Пополнять казну гильдии можно только в определённом количестве
				</>
			}
		>
			<StatGrid cards={PRICES} />
			<SliderGrid>
				<SliderField label="Необходимое количество Топазов" value={topaz} min={0} max={50000} onChange={setTopaz} />
				<SliderField label="Необходимое количество Аметистов" value={amethyst} min={0} max={50000} onChange={setAmethyst} />
			</SliderGrid>
			<StatGrid cards={totals} />
		</WikiPanel>
	);
}
