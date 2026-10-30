import Resources from '../../data/resources.json';
import Stones from '../../data/stones.json';
import { numberSpaces } from '../../lib/format';
import { ITEMS } from '../../lib/items';
import type { Reward, RewardFields, RewardItem } from '../../api/gameTypes';
import { asArray } from './common';

/** Строка награды в логе: картинка (путь в media/images), подпись и значение. */
export interface RewardLine {
	avatar: string;
	title: string;
	message: string;
}

/** Награда в ответе сервера: узел или список узлов (предметы с `_type` и остальные поля по отдельности). */
export type RawReward = Reward | Reward[];

/** Награда, в которой предметы уже собраны в список `i`. */
type Joined = RewardFields & { i: RewardItem[] };

/** Награда из узлов ответа: предметы (с `_type`) собираются в `i`, остальные поля объединяются. */
function normalize(reward: RawReward): Reward {
	if (!Array.isArray(reward)) return reward;
	let result: Joined = { i: [] };
	for (const part of reward) {
		if (part && Object.prototype.hasOwnProperty.call(part, '_type')) result.i.push({ ...(part as RewardItem), _id: (part as RewardItem)._item });
		else result = { ...result, ...part } as Joined;
	}
	return result;
}

/** Сложить несколько наград в одну: предметы списком, ресурсы суммой (joinReward). */
export function joinRewards(rewards: readonly RawReward[]): Joined {
	const result: Joined = { i: [] };
	for (const raw of rewards) {
		const { i, ...fields } = normalize(raw);
		if (i) result.i.push(...asArray(i));
		for (const key of Object.keys(fields) as `_${string}`[]) result[key] = (Number(result[key]) || 0) + Number(fields[key]);
	}
	return result;
}

/**
 * Предметы для улучшения зданий на карте (поля `_k1…_k10`): названия те же, что в `map.json` (`builds[].item`). Список здесь, а не импорт карты:
 * `map.json` весит 53 КБ, а этот файл входит в главный чанк.
 */
const BUILD_ITEMS = [
	'Хвост Крысюка',
	'Паучье жало',
	'Яд паука',
	'Череп скелета',
	'Украденный свиток',
	'Ожерелье тролля',
	'Лапа Болотника',
	'Свиток Некроманта',
	'Золотые дублоны',
	'Руна',
];

/** Ресурсы награды: поле ответа, картинка и подпись (порядок как в старом логе). */
const RESOURCES: [`_${string}`, string, string][] = [
	['_m1', 'currency/all/m1_big.png', 'Серебро'],
	['_m2', 'currency/all/m2_big.png', 'Рубины'],
	['_m3', 'currency/all/m3_big.png', 'Золото'],
	['_m4', 'currency/all/m4_big.png', 'Аметисты'],
	['_m5', 'currency/all/m5_big.png', 'Топазы'],
	['_m6', 'currency/all/m6_big.png', 'Турмалины'],
	['_m7', 'currency/all/m7_big.png', 'Пергаменты'],
	['_m9', 'currency/all/m9_big.png', 'Редкие жемчужины'],
	['_i2', 'currency/all/i2_big.png', 'Целебные зелья'],
	['_i1', 'currency/all/i1_big.png', 'Свитки молнии'],
	['_i3', 'currency/all/i3_big.png', 'Свитки огня'],
	['_pf1', 'currency/all/pf1_big.png', 'Еда'],
	['_en', 'currency/all/en_big.png', 'Энергия'],
	['_exp', 'currency/all/exp_big.png', 'Опыт'],
	['_ap', 'currency/all/ap_big.png', 'Кубки арены'],
	// Ключи 1…10: предметы для улучшения зданий на карте (картинка из currency/all)
	...BUILD_ITEMS.map((title, index): [`_${string}`, string, string] => [`_k${index + 1}`, `currency/all/k${index + 1}_big.png`, title]),
	// Ивентовые валюты: клиент считает только 2…6 и 8…10 (event8 — повтор значка защитника)
	['_event2', 'currency/all/event2_big.png', 'Тыквы'],
	['_event3', 'currency/all/event3_big.png', 'Конфеты'],
	['_event4', 'currency/all/event4_big.png', 'Значки защитника'],
	['_event5', 'currency/all/event5_big.png', 'Самоцветы'],
	['_event6', 'currency/all/event6_big.png', 'Значки обороны'],
	['_event8', 'currency/all/event8_big.png', 'Значки защитника'],
	['_event9', 'currency/all/event9_big.png', 'Футбольные мячи'],
	['_event10', 'currency/all/event10_big.png', 'Осколки'],
];

/** Предмет награды -> строка лога; неизвестный предмет пропускается (как в старом приложении). */
export function rewardItem(item: RewardItem): RewardLine | null {
	const id = Number(item._id);
	const type = Number(item._type);
	if (type === 6) {
		const full = ITEMS.find((x) => x.fragments.includes(id)) ?? Resources.find((x) => x.fragments.includes(id));
		return full ? { avatar: `collections/${id}.png`, title: 'Коллекция', message: full.title } : null;
	}
	if (type === 11) {
		const stone = Stones.find((x) => x.id === id);
		return stone ? { avatar: `stones/${id}.png`, title: 'Камень', message: stone.title } : null;
	}
	if (type === 1) return { avatar: `rooms/${id}.png`, title: 'Новый фон', message: 'Окружение' };
	const full = ITEMS.find((x) => x.id === id);
	if (!full) return null;
	return { avatar: full.icon, title: type === 8 ? 'Заточка' : 'Предмет', message: full.title };
}

/** Награда -> строки лога: предметы, затем ресурсы (parseReward). */
export function parseReward(raw: RawReward | null | undefined): RewardLine[] {
	if (!raw) return [];
	const reward = { ...normalize(raw) };
	const lines: RewardLine[] = [];
	let items: RewardItem[] = reward.i ? asArray(reward.i) : [];
	if (Object.prototype.hasOwnProperty.call(reward, '_item') && Number(reward._item) !== 0 && Object.prototype.hasOwnProperty.call(reward, '_type')) {
		items = [...items, { _type: Number(reward._type), _id: Number(reward._item) }];
	}
	for (const item of items) {
		const line = rewardItem(item);
		if (line) lines.push(line);
	}
	for (const [key, avatar, title] of RESOURCES) {
		if (Object.prototype.hasOwnProperty.call(reward, key) && Number(reward[key]) !== 0) lines.push({ avatar, title, message: `${numberSpaces(Number(reward[key]))} ед.` });
	}
	return lines;
}
