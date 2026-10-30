/** Данные карточек бота ресурсов: названия, время, типы таймеров и режимов. Без React. */

/** Ресурсы в строке над карточками. */
export const RESOURCES = ['chest', 'en', 'm3', 'm1', 'm2', 'm4', 'm5', 'm6', 'pf1', 'm9', 'm7', 'item2', 'item1', 'item3', 'exp'];

/**
 * Значок ресурса строки: прозрачная иконка из `currency/all` без рамки и фона (имя по полю награды, расходники `itemN` лежат как `iN`).
 * Прозрачного сундука в наборе пока нет: он остаётся прежней плиткой `bot/resources/chest.png`, когда появится `currency/all/chest.png`, заменить здесь.
 */
export const resourceIcon = (key: string) => (key === 'chest' ? 'bot/resources/chest.png' : `currency/all/${key.replace(/^item/, 'i')}.png`);

export const CHEST_NAMES = ['', 'Деревянный сундук', 'Серебряный сундук', 'Золотой сундук', 'Магический сундук', 'Трофейный сундук', 'Сундук', 'Пиратский сундук'];
/** Время взлома сундука по типу, минуты: днём сначала быстрые, ночью долгие */
export const CHEST_TIME = [0, 15, 180, 480, 720, 300, 0, 300];
export const PET_NAMES = ['', 'Полярный Тигр', 'Северный Волк', 'Дух Воды', 'Панда', 'Грабоид'];
export const BUILD_NAMES = [
	'Магическая лавка',
	'Таверна',
	'Хижина отшельника',
	'Постоялый двор',
	'Лавка колдуньи Ванессы',
	'Шахта Растхельма',
	'Таверна',
	'Постоялый двор',
	'Постоялый двор',
	'Постоялый двор',
];
export const WAR_PLACES = ['', 'бандитскийлагерь', 'логовогоблинов', 'фортнежити'];

/** Карточки сбора на странице «Ресурсы» (по ним главная профиля считает их число). */
export const CARDS = ['map', 'chest', 'pet', 'lottery', 'energy', 'daily', 'vip', 'guildBuilds', 'guildReward', 'guildWars', 'search'] as const;
export type CardKey = (typeof CARDS)[number];

/** Таймер карточки: секунды, «clear» (готово к действию), строка «1/2», список набегов; null — карточка недоступна. */
export interface Times {
	map: string | null;
	chest: number | 'clear' | null;
	pet: number | 'clear' | null;
	lottery: number | null;
	energy: number | null;
	daily: number | null;
	vip: number | null;
	guildBuilds: number | null;
	guildReward: number | null;
	guildWars: War[] | null;
	search: number | null;
}

export interface BotProfile {
	main: boolean;
	login: string | number;
	auth: string | null | undefined;
	server: number;
}

export interface War {
	id: number;
	name?: string;
	enemy?: number;
	date: string | null;
}

/** Таймер идёт: осталось больше нуля секунд (у «clear» и пустого значения — нет). */
export const waiting = (value: unknown) => typeof value === 'number' && value > 0;

export const INITIAL_TIMES: Times = { map: '0/0', chest: 0, pet: 0, lottery: 0, energy: 0, daily: 0, vip: 0, guildBuilds: 0, guildReward: 0, guildWars: [], search: 0 };

export type Mode = '' | 'map' | 'chest' | 'pet' | 'lottery' | 'guildBuild' | 'guildReward' | 'guildWars' | 'energy' | 'daily' | 'vip' | 'search' | 'all' | 'all-in-all';
