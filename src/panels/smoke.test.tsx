import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AdaptivityProvider, AppRoot, ConfigProvider, View } from '@vkontakte/vkui';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HUB_STORIES } from '../stories/registry';
import { initNav } from '../store/nav';
import { ARENA_PANELS } from './arena/ArenaPanels';
import { BOSSES_PANELS } from './bosses/BossesPanels';
import { CHARACTER_PANELS } from './character/CharacterPanels';
import { GUILD_PANELS } from './guild/GuildPanels';
import { HubPanel } from './HubPanel';
import { MAP_PANELS } from './map/MapPanels';
import { OTHER_PANELS } from './other/OtherPanels';
import { PROFILE_SECTION } from './profile/ProfilePanels';
import { RATING_SECTION } from './rating/RatingPanels';
import type { SectionPanels } from './section';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SECTIONS: Record<string, SectionPanels> = {
	map: MAP_PANELS,
	bosses: BOSSES_PANELS,
	arena: ARENA_PANELS,
	character: CHARACTER_PANELS,
	guild: GUILD_PANELS,
	other: OTHER_PANELS,
	profile: PROFILE_SECTION,
	rating: RATING_SECTION,
};

/** В jsdom нет части браузерных интерфейсов, которые нужны VKUI. */
beforeAll(() => {
	window.matchMedia ??= ((query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		onchange: null,
		dispatchEvent: () => false,
	})) as typeof window.matchMedia;
	const Observer = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	globalThis.IntersectionObserver ??= Observer as unknown as typeof IntersectionObserver;
	globalThis.ResizeObserver ??= Observer as unknown as typeof ResizeObserver;
	Element.prototype.scrollTo ??= () => {};
});

let root: Root | null = null;
afterEach(() => act(() => root?.unmount()));

/** Страница внутри окружения VKUI, как в приложении. */
async function renderPanel(id: string, content: ReactElement) {
	const container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	await act(async () =>
		root!.render(
			<ConfigProvider platform="ios">
				<AdaptivityProvider>
					<AppRoot>
						<View id="smoke" activePanel={id}>
							{content}
						</View>
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>,
		),
	);
	return container;
}

describe('страницы разделов отрисовываются без ошибок', () => {
	for (const [section, panels] of Object.entries(SECTIONS)) {
		for (const [id, Panel] of Object.entries(panels)) {
			it(`${section}/${id}`, async () => {
				initNav({ view: section, panel: id });
				const container = await renderPanel(id, <Panel id={id} />);
				// Профиль и рейтинг зависят от сессии и выбранного блока: достаточно, что страница не падает
				if (section !== 'profile' && section !== 'rating') expect(container.textContent?.length).toBeGreaterThan(0);
			});
		}
	}

	for (const story of HUB_STORIES) {
		it(`главная панель раздела «${story.id}»`, async () => {
			initNav({ view: story.id });
			const container = await renderPanel(story.id, <HubPanel id={story.id} story={story} />);
			expect(container.textContent).toContain(story.cells[0]!.title);
		});
	}
});

vi.setConfig({ testTimeout: 20000 });
