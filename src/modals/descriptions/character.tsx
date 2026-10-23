import type dataCharacter from '../../data/character.json';
import { Divider } from '../../components/Divider';
import { CardGrid, DescriptionCard, DescriptionCell, ItemList, LinkCell, imageUrl } from '../../components/wiki/Description';
import { getTime, numberForm, numberSpaces } from '../../lib/format';

export type Talent = (typeof dataCharacter.talents)[number];
export type Achievement = (typeof dataCharacter.achievements)[number]['items'][number] & { sign: string | string[] };
export type Resource = (typeof dataCharacter.resources)[number];
export type Pet = (typeof dataCharacter.pets)[number];
export type Background = (typeof dataCharacter.backgrounds)[number];
export type Avatar = (typeof dataCharacter.avatars)[number];

export const CHARACTER_DESCRIPTIONS = {
	'character.talent': (data: Talent) => ({
		head: { title: data.title, description: 'Персонаж — Таланты', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Бонус" text={data.bonus} />
				<DescriptionCell label="Стоимость использования" text={`${data.point} ${numberForm(data.point, ['очко', 'очка', 'очков'])}`} />
				<DescriptionCell label="Валюта улучшения" text={data.currency === 1 ? 'Золото' : 'Серебро'} />
			</>
		),
	}),

	'character.achievement': (data: Achievement) => ({
		head: { title: data.name, description: 'Персонаж — Достижения', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<Divider />
				<CardGrid>
					{data.levels.map((level, index) => (
						<DescriptionCard
							key={index}
							label={`${numberSpaces(level)} ${Array.isArray(data.sign) ? numberForm(level, data.sign) : data.sign}`}
							text={`${index + 1} стадия`}
							counter={index + 1}
						/>
					))}
				</CardGrid>
			</>
		),
	}),

	'character.resource': (data: Resource) => ({
		head: { title: data.title, description: 'Персонаж — Ресурсы', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Получение" text={data.from} />
			</>
		),
	}),

	'character.pet': (data: Pet) => ({
		head: { title: data.title, description: 'Персонаж — Питомцы', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Получение" text={data.from} />
				<DescriptionCell label="Стоимость отправки на поиск" text={`${data.food} ${numberForm(data.food, ['еда', 'еды', 'еды'])}`} />
				<DescriptionCell label="Время поиска" text={getTime(data.time)} />
				<DescriptionCell label="Визуальных стадий" text={`${data.stages} ${numberForm(data.stages, ['стадия', 'стадии', 'стадий'])}`} />
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'character.background': (data: Background) => ({
		head: { title: data.title, description: 'Персонаж — Фоны', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<Divider />
				<LinkCell href={imageUrl(data.icon)}>Изображение фона</LinkCell>
			</>
		),
	}),

	'character.avatar': (data: Avatar) => ({
		head: { title: data.title, description: 'Персонаж — Аватары', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<Divider />
				<LinkCell href={imageUrl(data.icon)}>Изображение аватара</LinkCell>
			</>
		),
	}),
};
