import type { StoryId } from '../store/nav';

import { BOSS_CALC_PANELS, ITEM_CALC_PANELS } from '../panels/calcPanels';
import type { Forms } from '../lib/format';

export interface HubCell {
	/** id подраздела (в ссылках `panel=`) */
	panel: string;
	title: string;
	subtitle: string;
	/** Номер иконки в media/images/labels/ */
	label: number;
	forms: Forms;
	/**
	 * Есть только при работающем профиле (внутри ВК) и открывается с подпиской VK Donut:
	 * 'icon' — справа значок подписки без неё, 'count' — с подпиской счётчик, без неё значок.
	 */
	profile?: 'icon' | 'count';
}

/** «Анализ сезонов» / «Анализ ивентов»: окно по профилю на серверах ВКонтакте, над ячейками раздела. */
export interface HubAnalysis {
	title: string;
	modal: 'arenaItems' | 'eventsItems';
}

export interface HubStory {
	id: Exclude<StoryId, 'home' | 'profile' | 'rating'>;
	title: string;
	/** Заголовок и подпись на баннерах */
	banner: { title: string; subtitle: string };
	analysis?: HubAnalysis;
	cells: HubCell[];
	/** Панели раздела без ячейки на главной (например, выбор предмета); по ссылке не открываются */
	extraPanels?: string[];
}

/**
 * Главные панели вики-разделов. Порядок ячеек совпадает со старым приложением.
 * Калькуляторы и анализ (доступны только внутри ВК) добавятся вместе с профилем.
 */
export const HUB_STORIES: readonly HubStory[] = [
	{
		id: 'map',
		title: 'Карта',
		banner: { title: 'Информация карты', subtitle: 'Мустафа, обыск, походы, рейды, приключения, районы, захват' },
		cells: [
			{ panel: '1', title: 'Мустафа', subtitle: 'Предметы и цены', label: 1, forms: ['предмет', 'предмета', 'предметов'] },
			{ panel: '2', title: 'Обыск', subtitle: 'Постройки для обыска', label: 2, forms: ['постройка', 'постройки', 'построек'] },
			{ panel: '3', title: 'Походы', subtitle: 'Походы и награды', label: 3, forms: ['поход', 'похода', 'походов'] },
			{ panel: '4', title: 'Рейды', subtitle: 'Рейды и награды', label: 4, forms: ['рейд', 'рейда', 'рейдов'] },
			{ panel: '5', title: 'Приключения', subtitle: 'Приключения и награды', label: 5, forms: ['приключение', 'приключения', 'приключений'] },
			{ panel: '6', title: 'Районы', subtitle: 'Описания районов', label: 6, forms: ['район', 'района', 'районов'] },
			{ panel: '7', title: 'Захват', subtitle: 'Районы для захвата', label: 7, forms: ['район', 'района', 'районов'] },
		],
	},
	{
		id: 'bosses',
		title: 'Боссы',
		banner: { title: 'Информация боссов', subtitle: 'Калькулятор, список боссов' },
		extraPanels: [BOSS_CALC_PANELS.boss, BOSS_CALC_PANELS.power],
		cells: [
			{ panel: '1', title: 'Калькулятор', subtitle: 'Затраты на убийство боссов', label: 8, forms: ['', '', ''], profile: 'icon' },
			{ panel: '2', title: 'Список боссов', subtitle: 'Боссы и награды', label: 29, forms: ['босс', 'босса', 'боссов'] },
		],
	},
	{
		id: 'arena',
		title: 'Арена',
		banner: { title: 'Информация арены', subtitle: 'Калькулятор, сезоны, лиги, сундуки' },
		analysis: { title: 'Анализ сезонов', modal: 'arenaItems' },
		cells: [
			{ panel: '1', title: 'Калькулятор', subtitle: 'Затраты на прохождение арены', label: 8, forms: ['', '', ''], profile: 'icon' },
			{ panel: '2', title: 'Сезоны', subtitle: 'Сезоны и награды', label: 9, forms: ['сезон', 'сезона', 'сезонов'] },
			{ panel: '3', title: 'Лиги', subtitle: 'Лиги и награды', label: 10, forms: ['лига', 'лиги', 'лиг'] },
			{ panel: '4', title: 'Сундуки', subtitle: 'Сундуки и награды', label: 11, forms: ['сундук', 'сундука', 'сундуков'] },
		],
	},
	{
		id: 'character',
		title: 'Персонаж',
		banner: { title: 'Информация персонажа', subtitle: 'Таланты, достижения, ресурсы, питомцы, аватары, фоны' },
		cells: [
			{ panel: '1', title: 'Таланты', subtitle: 'Таланты персонажа', label: 12, forms: ['талант', 'таланта', 'талантов'] },
			{ panel: '2', title: 'Достижения', subtitle: 'Достижения и их условия', label: 13, forms: ['достижение', 'достижения', 'достижений'] },
			{ panel: '3', title: 'Ресурсы', subtitle: 'Ресурсы и их получение', label: 14, forms: ['ресурс', 'ресурса', 'ресурсов'] },
			{ panel: '4', title: 'Питомцы', subtitle: 'Питомцы и награды', label: 15, forms: ['питомец', 'питомца', 'питомцев'] },
			{ panel: '6', title: 'Аватары', subtitle: 'Аватары и их получение', label: 16, forms: ['аватар', 'аватара', 'аватаров'] },
			{ panel: '5', title: 'Фоны', subtitle: 'Фоны и их получение', label: 17, forms: ['фон', 'фона', 'фонов'] },
		],
	},
	{
		id: 'guild',
		title: 'Гильдия',
		banner: { title: 'Информация гильдии', subtitle: 'Калькулятор, улучшения, кузница, академия, набеги, рейды' },
		cells: [
			{ panel: '1', title: 'Калькулятор', subtitle: 'Затраты на казну гильдии', label: 18, forms: ['', '', ''], profile: 'icon' },
			{ panel: '7', title: 'Звания', subtitle: 'Значение званий', label: 28, forms: ['звание', 'звания', 'званий'] },
			{ panel: '2', title: 'Улучшения', subtitle: 'Улучшения и их уровни', label: 19, forms: ['постройка', 'постройки', 'построек'] },
			{ panel: '3', title: 'Кузница', subtitle: 'Экипировка и цены', label: 20, forms: ['предмет', 'предмета', 'предметов'] },
			{ panel: '4', title: 'Академия', subtitle: 'Навыки и их уровни', label: 21, forms: ['навык', 'навыка', 'навыков'] },
			{ panel: '5', title: 'Набеги', subtitle: 'Набеги и награды', label: 22, forms: ['набег', 'набега', 'набегов'] },
			{ panel: '6', title: 'Рейды', subtitle: 'Рейды и награды', label: 23, forms: ['рейд', 'рейда', 'рейдов'] },
		],
	},
	{
		id: 'other',
		title: 'Разное',
		banner: { title: 'Прочая информация', subtitle: 'Калькулятор, новые предметы, события, лотерея, обыск друзей' },
		analysis: { title: 'Анализ ивентов', modal: 'eventsItems' },
		extraPanels: [ITEM_CALC_PANELS.item],
		cells: [
			{ panel: '1', title: 'Калькулятор', subtitle: 'Затраты на улучшение предмета', label: 26, forms: ['', '', ''], profile: 'icon' },
			{ panel: '5', title: 'Новые предметы', subtitle: 'Последние добавленные предметы', label: 20, forms: ['предмет', 'предмета', 'предметов'], profile: 'count' },
			{ panel: '3', title: 'События', subtitle: 'Ивенты и награды', label: 28, forms: ['событие', 'события', 'событий'] },
			{ panel: '2', title: 'Лотерея', subtitle: 'Награды с лото', label: 27, forms: ['предмет', 'предмета', 'предметов'] },
			{ panel: '4', title: 'Обыск друзей', subtitle: 'Награды с обыска', label: 30, forms: ['предмет', 'предмета', 'предметов'] },
		],
	},
];
