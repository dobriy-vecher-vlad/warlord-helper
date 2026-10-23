import { openModal } from '../../store/modal';
import type { ARENA_DESCRIPTIONS } from './arena';
import type { BOSSES_DESCRIPTIONS } from './bosses';
import type { CHARACTER_DESCRIPTIONS } from './character';
import type { GUILD_DESCRIPTIONS } from './guild';
import type { MAP_DESCRIPTIONS } from './map';
import type { OTHER_DESCRIPTIONS } from './other';
import type { DescriptionContent } from './types';

/**
 * Все варианты окна описания. Сами варианты лежат в модулях разделов и регистрируются
 * при загрузке раздела (разделы грузятся лениво), здесь — только их типы.
 */
type Descriptions = typeof MAP_DESCRIPTIONS &
	typeof BOSSES_DESCRIPTIONS &
	typeof ARENA_DESCRIPTIONS &
	typeof CHARACTER_DESCRIPTIONS &
	typeof GUILD_DESCRIPTIONS &
	typeof OTHER_DESCRIPTIONS;

export type DescriptionKind = keyof Descriptions;
type PayloadOf<K extends DescriptionKind> = Parameters<Descriptions[K]>[0];

const registry: Partial<Record<DescriptionKind, (payload: never) => DescriptionContent>> = {};

/** Зарегистрировать варианты раздела. Вызывается модулем раздела при загрузке. */
export function registerDescriptions(variants: Partial<Descriptions>) {
	Object.assign(registry, variants);
}

export interface DescriptionData {
	kind: DescriptionKind;
	payload: unknown;
	/** Значение `modal=` для ссылки на окно */
	link?: string;
}

/**
 * Открыть окно описания. Ключ стека — вид окна: повторное открытие того же вида
 * (например, через ссылку внутри окна) возвращает стек к нему, как в старом приложении.
 */
export function openDescription<K extends DescriptionKind>(kind: K, payload: PayloadOf<K>, link?: string) {
	const data: DescriptionData = { kind, payload, link };
	openModal('description', { ...data }, kind);
}

/** Содержимое окна. Окно открывается только из загруженного раздела, поэтому вариант уже зарегистрирован. */
export function renderDescription(data: DescriptionData): DescriptionContent | null {
	const variant = registry[data.kind] as ((payload: unknown) => DescriptionContent) | undefined;
	return variant ? variant(data.payload) : null;
}
