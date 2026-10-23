import type dataGuild from '../../data/guild.json';
import { Divider } from '../../components/Divider';
import { CardGrid, DescriptionCard, DescriptionCell, ItemList } from '../../components/wiki/Description';
import { Currency } from '../../components/wiki/Currency';
import { ItemCell } from '../../components/wiki/ItemCell';
import { numberForm, numberSpaces } from '../../lib/format';
import { ITEMS } from '../../lib/items';
import { useItemFilter } from '../../store/itemFilter';

export type GuildBuild = (typeof dataGuild.builds)[number];
export type GuildItem = (typeof dataGuild.items)[number];
export type GuildSkill = (typeof dataGuild.academy)[number];
export type GuildRaid = (typeof dataGuild.raids)[number];
export type GuildBoss = (typeof dataGuild.bosses)[number];
export type GuildRang = (typeof dataGuild.rangs)[number];

/** Сумма в двух валютах на двух строках: «2 000 [золото]» / «5 000 [серебро]». */
function TwoPrices({ first, second, firstCurrency = 1, secondCurrency = 3 }: { first: number | string; second: number | string; firstCurrency?: number; secondCurrency?: number }) {
	return (
		<>
			{first}
			<Currency id={firstCurrency} />
			<br />
			{second}
			<Currency id={secondCurrency} />
		</>
	);
}

/** Цена кузницы: «аметисты или золото» / «топазы или серебро». */
function ForgePrice({ price }: { price: [number, number] }) {
	return (
		<>
			{numberSpaces(price[0])}
			<Currency id={4} /> или {numberSpaces(price[0] * 55)}
			<Currency id={1} />
			<br />
			{numberSpaces(price[1])}
			<Currency id={5} /> или {numberSpaces(price[1] * 75)}
			<Currency id={3} />
		</>
	);
}

/** Предмет кузницы: показывается, если в фильтре включены предметы или заточки (как в старом приложении). */
function ForgeItem({ title }: { title: string }) {
	const filter = useItemFilter();
	const index = ITEMS.findIndex((item) => item.title === title);
	if (!(filter.item || filter.scroll) || index < 0) return <ItemList items={[]} />;
	return <ItemCell data={{ id: index, item: true, scroll: true }} />;
}

export const GUILD_DESCRIPTIONS = {
	'guild.build': (data: GuildBuild) => ({
		head: { title: data.title, description: 'Гильдия — Улучшения', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Бонус за каждый уровень" text={data.bonus} />
				<Divider />
				<CardGrid>
					{data.levels.map((level, index) =>
						// У «Стражи Форта» и «Тарана» уровни бесконечны: последняя карточка — прирост за каждый уровень
						(data.title === 'Стража Форта' || data.title === 'Таран') && index === data.levels.length - 1 ? (
							<DescriptionCard key={index} label={<TwoPrices first="+2 000" second="+5 000" />} text="За каждый уровень" counter={index + 1} />
						) : (
							<DescriptionCard key={index} label={<TwoPrices first={numberSpaces(level[0])} second={numberSpaces(level[1])} />} text={`${index + 1} уровень`} counter={index + 1} />
						),
					)}
				</CardGrid>
			</>
		),
	}),

	'guild.forge': (data: GuildItem) => {
		const price = data.price as [number, number];
		const scroll: [number, number] = [Math.ceil(price[0] / 10), Math.ceil(price[1] / 10)];
		return {
			head: { title: data.title, description: 'Гильдия — Кузница', avatar: data.icon },
			body: (
				<>
					<DescriptionCell label="Требуемый стаж" text={`${data.days} ${numberForm(data.days, ['день', 'дня', 'дней'])}`} />
					<DescriptionCell label="Требуемый уровень Кузницы" text={`${data.build} уровень`} />
					<Divider />
					<DescriptionCell label="Стоимость предмета" text={<ForgePrice price={price} />} />
					<DescriptionCell label="Стоимость заточки" text={<ForgePrice price={scroll} />} />
					<Divider />
					<ForgeItem title={data.title} />
				</>
			),
		};
	},

	'guild.academy': (data: GuildSkill) => ({
		head: { title: data.title, description: 'Гильдия — Академия', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Бонус за каждый уровень" text={data.bonus} />
				<Divider />
				<CardGrid>
					{data.levels.map((level, index) => (
						<DescriptionCard
							key={index}
							label={
								<>
									{numberSpaces(level)}
									<Currency id={data.currency === 1 ? 5 : 4} />
								</>
							}
							text={`${index + 1} уровень`}
							counter={index + 1}
						/>
					))}
				</CardGrid>
			</>
		),
	}),

	'guild.raid': (data: GuildRaid) => ({
		head: { title: data.title, description: 'Гильдия — Набеги', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'guild.boss': (data: GuildBoss) => ({
		head: { title: data.title, description: 'Гильдия — Рейды', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Требуемый стаж" text={`${data.days} дней`} />
				<DescriptionCell
					label="Характеристики"
					text={
						<>
							{numberSpaces(data.hp)} здоровья
							<br />
							{numberSpaces(data.dmg)} атаки
						</>
					}
				/>
				<DescriptionCell label="Стоимость создания" text={<TwoPrices first={numberSpaces(data.price[0])} second={numberSpaces(data.price[1])} />} />
				<Divider />
				<ItemList items={data.items} />
			</>
		),
	}),

	'guild.rang': (data: GuildRang) => ({
		head: { title: data.title, description: 'Гильдия — Звания', avatar: data.icon },
		body: (
			<>
				<DescriptionCell label="Описание" text={data.description} />
				<DescriptionCell label="Доступ" text={data.bonus} />
			</>
		),
	}),
};
