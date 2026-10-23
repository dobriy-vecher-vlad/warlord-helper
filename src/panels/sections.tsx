import { Suspense, use } from 'react';
import { Panel, Spinner } from '@vkontakte/vkui';
import { loadItemModalBody } from '../modals/itemModalBody';
import type { HubData } from '../stories/hubData';
import type { HubStory } from '../stories/registry';
import type { SectionPanels } from './section';
import styles from './sections.module.css';

type SectionId = HubStory['id'] | 'profile' | 'rating';

/** Модули разделов: каждый раздел вместе со своими данными грузится отдельно. */
const LOADERS: Record<SectionId, () => Promise<SectionPanels>> = {
	map: () => import('./map/MapPanels').then((module) => module.MAP_PANELS),
	bosses: () => import('./bosses/BossesPanels').then((module) => module.BOSSES_PANELS),
	arena: () => import('./arena/ArenaPanels').then((module) => module.ARENA_PANELS),
	character: () => import('./character/CharacterPanels').then((module) => module.CHARACTER_PANELS),
	guild: () => import('./guild/GuildPanels').then((module) => module.GUILD_PANELS),
	other: () => import('./other/OtherPanels').then((module) => module.OTHER_PANELS),
	profile: () => import('./profile/ProfilePanels').then((module) => module.PROFILE_SECTION),
	rating: () => import('./rating/RatingPanels').then((module) => module.RATING_SECTION),
};

/** Данные главных панелей (картинки баннера и счётчики) лежат в модулях разделов и грузятся вместе с ними. */
const HUB_LOADERS: Record<HubStory['id'], () => Promise<HubData>> = {
	map: () => import('./map/MapPanels').then((module) => module.MAP_HUB),
	bosses: () => import('./bosses/BossesPanels').then((module) => module.BOSSES_HUB),
	arena: () => import('./arena/ArenaPanels').then((module) => module.ARENA_HUB),
	character: () => import('./character/CharacterPanels').then((module) => module.CHARACTER_HUB),
	guild: () => import('./guild/GuildPanels').then((module) => module.GUILD_HUB),
	other: () => import('./other/OtherPanels').then((module) => module.OTHER_HUB),
};

const hubData: Partial<Record<HubStory['id'], HubData>> = {};

/** Данные главной панели раздела, если раздел уже загружался: без ожидания и без скелетона при повторном заходе. */
export const loadedHubData = (section: HubStory['id']) => hubData[section] ?? null;

/** Загрузить данные главной панели раздела (модуль раздела при этом тоже загружается). */
export async function loadHubData(section: HubStory['id']): Promise<HubData> {
	const data = hubData[section] ?? (await HUB_LOADERS[section]());
	hubData[section] = data;
	return data;
}

/** Промис с отметкой о готовности: `use()` у готового промиса возвращает значение сразу, без загрузчика. */
type TrackedPromise<T> = Promise<T> & { status?: 'fulfilled'; value?: T };

const cache: Partial<Record<SectionId, TrackedPromise<SectionPanels>>> = {};

/** Загрузить раздел (повторные вызовы возвращают тот же промис). Окно предмета грузится вместе с первым разделом. */
export function preloadSection(section: SectionId): TrackedPromise<SectionPanels> {
	let promise = cache[section];
	if (!promise) {
		const created: TrackedPromise<SectionPanels> = Promise.all([LOADERS[section](), loadItemModalBody()]).then(([panels]) => panels);
		created.then(
			(panels) => {
				created.status = 'fulfilled';
				created.value = panels;
			},
			// Неудачная загрузка (например, обрыв сети) не запоминается: следующий заход попробует снова
			() => delete cache[section],
		);
		cache[section] = promise = created;
	}
	return promise;
}

/** Загрузить раздел, в который ведёт ссылка (подраздел грузится вместе с модулем раздела); ошибка загрузки не мешает запуску. */
export async function preloadRouteSection(story: string | null, panel: string | null): Promise<void> {
	if (!story || panel === null || !(story in LOADERS)) return;
	await preloadSection(story as SectionId).then(
		() => undefined,
		() => undefined,
	);
}

/**
 * Фоновая загрузка всех разделов, когда браузер свободен: потом переход в любой раздел мгновенный.
 * Начинается через несколько секунд после старта, разделы грузятся по одному, чтобы не мешать анимациям.
 */
export function preloadSectionsWhenIdle() {
	const idle = (callback: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(callback, { timeout: 5000 }) : setTimeout(callback, 1000));
	const queue = Object.keys(LOADERS) as SectionId[];
	const next = () => {
		const section = queue.shift();
		if (section)
			idle(
				() =>
					void preloadSection(section)
						.catch(() => undefined)
						.finally(next),
			);
	};
	window.setTimeout(next, 3000);
}

function Section({ id, section }: { id: string; section: SectionId }) {
	// Отметка status/value на промисе — тот же приём, что использует сам React для уже прочитанных промисов
	const panels = use(preloadSection(section) as Promise<SectionPanels>);
	const Ready = panels[id];
	return Ready ? <Ready id={id} /> : <Panel id={id} />;
}

/** Подраздел вики. Пока модуль раздела грузится, показывается спиннер. */
export function SectionPanel({ id, section }: { id: string; section: SectionId }) {
	return (
		<Suspense
			fallback={
				<Panel id={id}>
					<div className={styles.loading}>
						<Spinner size="l" />
					</div>
				</Panel>
			}
		>
			<Section id={id} section={section} />
		</Suspense>
	);
}
