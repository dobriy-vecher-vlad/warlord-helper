import { CardGrid, DescriptionCard, DescriptionCell, ItemList } from '../../components/wiki/Description';
import { Divider } from '../../components/Divider';
import type { OTHER_EVENTS } from '../../lib/data';

export type GameEvent = (typeof OTHER_EVENTS)[number]['items'][number];

export const OTHER_DESCRIPTIONS = {
	'other.event': (data: GameEvent) => ({
		head: { title: data.name, description: 'Разное — События', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание события" text={data.description} />
				<DescriptionCell label="Дата события" text={data.date} />
				{data.rewards.length !== 0 && (
					<>
						<Divider />
						<CardGrid>
							{data.rewards.map((reward, index) => (
								<DescriptionCard key={index} label={reward} text={`Награда ${data.rewards.length - index} уровня`} counter={index + 1} />
							))}
						</CardGrid>
					</>
				)}
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),
};
