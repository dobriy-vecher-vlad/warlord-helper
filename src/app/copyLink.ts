import bridge from '@vkontakte/vk-bridge';
import { VK_APP_URL } from '../config';
import { buildLink } from '../lib/hash';
import { isEmbedded } from '../lib/platform';
import { useNotify } from './notify';

/** Копирование ссылки на раздел (`#view=…&panel=…&modal=…`): через VK Bridge внутри ВК, иначе через буфер обмена. */
export function useCopyLink(view?: string | null, panel?: string | null, modal?: string | number | null) {
	const notify = useNotify();
	return async () => {
		const base = isEmbedded() ? VK_APP_URL : window.location.origin;
		const href = buildLink(base, view, panel, modal);
		try {
			if (isEmbedded()) await bridge.send('VKWebAppCopyText', { text: href });
			else await navigator.clipboard.writeText(href);
			notify({ text: 'Ссылка скопирована', icon: 'done', action: href });
		} catch {
			notify({ text: 'Не удалось скопировать ссылку', icon: 'error' });
		}
	};
}
