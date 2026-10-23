import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import { afterEach, beforeAll } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** В jsdom нет части браузерных интерфейсов, которые нужны VKUI. */
export function installBrowserStubs() {
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
}

let root: Root | null = null;
let container: HTMLElement | null = null;

afterEach(() => {
	act(() => root?.unmount());
	container?.remove();
	root = null;
	container = null;
});

/** Отрисовать содержимое в окружении VKUI, как в приложении; окна ModalPage рисуются в `document.body`. */
export async function render(content: ReactElement) {
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	await act(async () =>
		root!.render(
			<ConfigProvider platform="ios">
				<AdaptivityProvider>
					<AppRoot>{content}</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>,
		),
	);
	return container;
}

/** Дать выполниться ожидающим промисам и таймерам React. */
export const flush = () => act(async () => {});

/** Нажать на элемент (React слушает события на корне). */
export const click = (element: Element) => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));

/** Кнопка по тексту. */
export const button = (text: string) => [...document.body.querySelectorAll('button')].find((item) => item.textContent?.trim() === text) as HTMLButtonElement | undefined;
