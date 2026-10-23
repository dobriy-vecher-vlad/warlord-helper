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

/** Ресурсы награды: поле ответа, картинка и подпись (порядок как в старом логе). */
const RESOURCES: [`_${string}`, string, string][] = [
	['_m1', 'bot/raids/12.png', 'Серебро'],
	['_m2', 'bot/raids/13.png', 'Рубины'],
	['_m3', 'bot/raids/11.png', 'Золото'],
	['_m4', 'bot/raids/15.png', 'Аметисты'],
	['_m5', 'bot/raids/14.png', 'Топазы'],
	['_m6', 'bot/raids/21.png', 'Турмалины'],
	['_m7', 'bot/raids/22.png', 'Пергаменты'],
	['_m9', 'bot/raids/112.png', 'Редкие жемчужины'],
	['_i2', 'bot/raids/18.png', 'Целебные зелья'],
	['_i1', 'bot/raids/17.png', 'Свитки молнии'],
	['_i3', 'bot/raids/16.png', 'Свитки огня'],
	['_pf1', 'bot/raids/20.png', 'Еда'],
	['_en', 'bot/raids/19.png', 'Энергия'],
	['_exp', 'bot/raids/10.png', 'Опыт'],
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
