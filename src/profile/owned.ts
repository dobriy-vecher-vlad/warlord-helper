import { useSession } from './session';

/** Множества игровых id по массиву предметов: на странице сотни карточек, и множество строится один раз, а не в каждой. */
const sets = new WeakMap<readonly number[], ReadonlySet<number>>();

function setOf(items: readonly number[]): ReadonlySet<number> {
	let set = sets.get(items);
	if (!set) sets.set(items, (set = new Set(items)));
	return set;
}

/**
 * Наличие предмета у персонажа выбранного профиля (только с подпиской VK Donut).
 * Предмет определяется игровым id — он же номер картинки предмета.
 */
export function useOwned() {
	const isDonut = useSession((s) => s.isDonut);
	const items = useSession((s) => s.items);
	const set = setOf(items);
	return { isDonut, owns: (gameId: number) => set.has(gameId) };
}
