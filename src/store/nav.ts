import { parseHash } from '../lib/hash';
import { confirmLeave } from '../lib/leaveGuard';
import { HUB_STORIES } from '../stories/registry';
import { createStore, useStore } from './createStore';
import { resetItemFilter } from './itemFilter';

/** Разделы приложения (view в ссылках). Идентификаторы совпадают со старым приложением. */
export const STORIES = ['home', 'profile', 'rating', 'map', 'bosses', 'arena', 'character', 'guild', 'other'] as const;
export type StoryId = (typeof STORIES)[number];

interface NavState {
	/** null — приложение ещё не определило стартовый раздел */
	story: StoryId | null;
	/** null — главная панель раздела (id равен id раздела); иначе id подраздела, например '3' */
	panel: string | null;
	/** Значение `modal` из ссылки: открывается один раз, когда на экране появится нужная карточка */
	pendingModal: string | null;
	/** Ссылка ведёт на несуществующий раздел, подраздел или окно — показывается страница 404 */
	notFound: boolean;
}

const nav = createStore<NavState>({ story: null, panel: null, pendingModal: null, notFound: false });

export const useStory = () => useStore(nav, (s) => s.story);
export const usePanel = () => useStore(nav, (s) => s.panel);
export const usePendingModal = () => useStore(nav, (s) => s.pendingModal);
export const useNotFound = () => useStore(nav, (s) => s.notFound);
export const getNav = () => nav.get();
export const subscribeNav = nav.subscribe;

/** Разделы и их подразделы, которые можно открыть по ссылке. */
const ROUTES: Partial<Record<StoryId, readonly string[]>> = {
	home: [],
	// Профиль: панель 8 в старом приложении была отключена
	profile: ['1', '2', '3', '4', '5', '6', '7', '9', '10', '11', '12'],
	rating: ['1'],
	...Object.fromEntries(HUB_STORIES.map((hub) => [hub.id, [...hub.cells.map((cell) => cell.panel), ...(hub.extraPanels ?? [])]])),
};

/**
 * Доступность раздела и подраздела сейчас. Профиль, рейтинг и калькуляторы есть только внутри ВК при работающем
 * игровом сервере — правила задаёт сессия профиля (setRouteRules), здесь только значения по умолчанию.
 */
interface RouteRules {
	/** Раздел и подраздел существуют для этого пользователя (иначе 404) */
	available(story: StoryId, panel: string | null): boolean;
	/** Переход в подраздел разрешён; если нет — правило само показывает причину (окно подписки) */
	allowed(story: StoryId, panel: string): boolean;
}

let rules: RouteRules = {
	available: (story) => story !== 'profile' && story !== 'rating',
	allowed: () => true,
};

export function setRouteRules(next: RouteRules) {
	rules = next;
}

/**
 * Проверить открытый раздел заново (сессия профиля загрузилась): недоступный раздел — 404,
 * закрытый подпиской подраздел — главная панель раздела.
 */
export function revalidateNav() {
	const { story, panel } = nav.get();
	if (!story) return;
	if (!rules.available(story, panel)) {
		nav.set({ panel: null, pendingModal: null, notFound: true });
		return;
	}
	if (panel && !rules.allowed(story, panel)) nav.set({ panel: null, pendingModal: null });
}

const isStory = (value: string | undefined): value is StoryId => !!value && (STORIES as readonly string[]).includes(value);

/** Параметры перехода: `force` — переход делает само приложение (не человек), подтверждение не спрашивается. */
interface NavOptions {
	force?: boolean;
}

/**
 * Открыть раздел. Недоступный раздел (рейтинг с плитки на главной вне ВК) — страница 404. Пока работает бот или идёт действие,
 * которое уход прервёт, переход просит подтверждения браузера.
 */
export function openStory(story: StoryId, { force = false }: NavOptions = {}) {
	if (!force && !confirmLeave()) return;
	resetItemFilter();
	nav.set({ story, panel: null, pendingModal: null, notFound: !ROUTES[story] || !rules.available(story, null) });
}

/** Перейти в подраздел текущего раздела (или на его главную панель, если panel = null). */
export function openPanel(panel: string | null, { force = false }: NavOptions = {}) {
	const { story } = nav.get();
	if (!force && !confirmLeave()) return;
	if (story && panel && !rules.allowed(story, panel)) return;
	resetItemFilter();
	nav.set({ panel, pendingModal: null, notFound: false });
}

export function consumePendingModal() {
	nav.set({ pendingModal: null });
}

/** Окно из ссылки не нашлось на открытой странице. */
export function showNotFound() {
	nav.set({ pendingModal: null, notFound: true });
}

/**
 * Состояние по ссылке `#view=…&panel=…&modal=…` (при запуске и при ручной правке адреса).
 * Без `view` открывается главная; `panel` и `modal` без `view` игнорируются (как в старом приложении).
 * Неизвестный раздел или подраздел — страница 404; неизвестное окно проверяется, когда страница отрисуется.
 */
export function initNav(params = parseHash()) {
	resetItemFilter();
	if (params.view === undefined) {
		nav.set({ story: 'home', panel: null, pendingModal: null, notFound: false });
		return;
	}
	const story = isStory(params.view) ? params.view : null;
	const panels = story && ROUTES[story];
	// Подраздел с id раздела — это его главная панель (так ставит кнопка «назад»)
	const panel = params.panel && params.panel !== story ? params.panel : null;
	if (!story || !panels || (panel !== null && !panels.includes(panel)) || !rules.available(story, panel)) {
		nav.set({ story: story ?? 'home', panel: null, pendingModal: null, notFound: true });
		return;
	}
	// Закрытый подпиской подраздел по ссылке не открывается: остаётся главная панель раздела (правило само покажет причину)
	if (panel !== null && !rules.allowed(story, panel)) {
		nav.set({ story, panel: null, pendingModal: null, notFound: false });
		return;
	}
	nav.set({ story, panel, pendingModal: panel && params.modal ? params.modal : null, notFound: false });
}
