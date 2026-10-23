import type dataArena from '../../data/arena.json';
import { Divider } from '../../components/Divider';
import { DescriptionCell, ItemList } from '../../components/wiki/Description';
import { getTime, numberForm, numberSpaces } from '../../lib/format';

export type ArenaMonth = (typeof dataArena.season)[number]['month'][number];
export type ArenaLeague = (typeof dataArena.league)[number];
export type ArenaChest = (typeof dataArena.chest)[number];

export const ARENA_DESCRIPTIONS = {
	'arena.season': (data: ArenaMonth) => ({
		head: { title: data.name, description: 'Арена — Сезоны', avatar: data.icon },
		body: <ItemList items={data.items} />,
	}),

	'arena.league': (data: ArenaLeague) => {
		const fights = Math.ceil((data.to - data.from) / 19);
		return {
			head: { title: data.title, description: 'Арена — Лиги', avatar: data.icon },
			body: (
				<>
					<DescriptionCell label="Диапазон кубков для вступления в лигу" text={`${numberSpaces(data.from)}${data.to === 0 ? '+' : ` - ${numberSpaces(data.to)}`} кубков`} />
					<DescriptionCell label="Стоимость одного боя в лиге" text={`${numberSpaces(data.price)} золота`} />
					{data.to !== 0 && (
						<>
							<Divider />
							<DescriptionCell label="Количество боёв для прохождения всей лиги" text={`${numberSpaces(fights)} ${numberForm(fights, ['бой', 'боя', 'боёв'])}`} />
							<DescriptionCell label="Затраты золота для прохождения всей лиги" text={`${numberSpaces(fights * data.price)} золота`} />
						</>
					)}
				</>
			),
		};
	},

	'arena.chest': (data: ArenaChest) => ({
		head: { title: data.title, description: 'Арена — Сундуки', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Время, требуемое на открытие сундука" text={getTime(data.time)} />
				<DescriptionCell label="Стоимость моментального открытия сундука" text={`${numberSpaces(data.skip)} ${numberForm(data.skip, ['рубин', 'рубина', 'рубинов'])}`} />
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),
};
