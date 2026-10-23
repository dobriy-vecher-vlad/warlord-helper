import bridge from '@vkontakte/vk-bridge';
import { isEmbedded } from '../lib/platform';
import { closeModal, getModalStack, subscribeModals } from '../store/modal';
import { getNav, initNav, subscribeNav } from '../store/nav';

/**
 * Текущий адрес `#view=…&panel=…&modal=…`. `modal` — ссылка нижнего окна в стеке (вложенные окна по ссылке
 * не открываются, как и в старом приложении); пока окно из ссылки ещё не открыто, остаётся исходное значение.
 * Прочие параметры (`promo` и старые отладочные `dev`, `mask`, `ref`) читаются при запуске и из адреса убираются.
 * На главной параметров нет — ссылка остаётся чистой. `null` — раздел ещё не определён.
 */
function currentHash(): string | null {
	const { story, panel: active, pendingModal, notFound } = getNav();
	// На странице 404 адрес не трогаем: пусть видно, какая ссылка не открылась
	if (!story || notFound) return null;
	if (story === 'home') return '';
	// «Назад» из подраздела ставит панель с id раздела — это его главная панель, в ссылке её нет
	const panel = active === story ? null : active;
	const root = getModalStack()[0];
	const modal = (root?.data.link as string | undefined) ?? pendingModal;
	const parts = [`view=${story}`];
	if (panel) parts.push(`panel=${panel}`);
	if (panel && modal) parts.push(`modal=${modal}`);
	return `#${parts.join('&')}`;
}

/**
 * Держит адрес в соответствии с открытым разделом, подразделом и окном. Адрес заменяется, а не добавляется
 * в историю: «назад» в приложении работает своими кнопками, как и раньше. Внутри ВК адрес обновляется и в строке ВК.
 */
export function startUrlSync() {
	// Пустой «#» в конце адреса location.hash не показывает, а убрать его тоже нужно
	let last = window.location.href.endsWith('#') ? '#' : window.location.hash;
	let scheduled = false;
	let stopped = false;
	const sync = () => {
		// Несколько изменений подряд (переход + закрытие окна) записываются один раз
		if (scheduled) return;
		scheduled = true;
		queueMicrotask(() => {
			scheduled = false;
			if (stopped) return;
			const hash = currentHash();
			if (hash === null || hash === last) return;
			last = hash;
			window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
			if (isEmbedded()) void bridge.send('VKWebAppSetLocation', { location: hash.slice(1), replace_state: true }).catch(() => undefined);
		});
	};
	// Адрес поправили руками (или перешли по ссылке внутри приложения): открываем то, что в нём записано.
	// Свои изменения адреса идут через replaceState и это событие не вызывают.
	const onHashChange = () => {
		last = window.location.hash;
		closeModal();
		initNav();
	};
	window.addEventListener('hashchange', onHashChange);
	const unsubscribeNav = subscribeNav(sync);
	const unsubscribeModals = subscribeModals(sync);
	sync();
	return () => {
		stopped = true;
		window.removeEventListener('hashchange', onHashChange);
		unsubscribeNav();
		unsubscribeModals();
	};
}
