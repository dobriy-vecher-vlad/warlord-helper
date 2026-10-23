import { openModal } from '../store/modal';
import { revalidateNav, setRouteRules, type StoryId } from '../store/nav';
import { getSession, hasRating, subscribeSession } from './session';

/**
 * Подразделы, которые есть только при работающем профиле и открываются только с подпиской VK Donut
 * (в старом приложении — проверка в setActivePanel): весь профиль, калькуляторы и «Новые предметы».
 */
const DONUT_PANELS: Partial<Record<StoryId, readonly string[] | 'all'>> = {
	profile: 'all',
	bosses: ['1'],
	arena: ['1'],
	guild: ['1'],
	other: ['1', '5'],
};

const isDonutPanel = (story: StoryId, panel: string | null) => {
	const panels = DONUT_PANELS[story];
	return !!panel && !!panels && (panels === 'all' || panels.includes(panel));
};

/** Правила доступности разделов для навигации: профиль, рейтинг и калькуляторы — только внутри ВК. */
export function installRouteRules() {
	setRouteRules({
		available(story, panel) {
			const state = getSession();
			const on = state.status !== 'off';
			if (story === 'profile') return on;
			// Пока профиль загружается, сервер профиля ещё неизвестен — рейтинг проверится после загрузки
			if (story === 'rating') return on && (state.status === 'loading' || hasRating(state));
			if (isDonutPanel(story, panel)) return on;
			return true;
		},
		allowed(story, panel) {
			const state = getSession();
			if (!isDonutPanel(story, panel) || state.status !== 'ready' || state.isDonut) return true;
			openModal('donut');
			return false;
		},
	});
	// Профиль загрузился (или оказался недоступен) — открытый по ссылке раздел проверяется заново
	let last = getSession().status;
	subscribeSession(() => {
		const status = getSession().status;
		if (status !== last && status !== 'loading') revalidateNav();
		last = status;
	});
}
