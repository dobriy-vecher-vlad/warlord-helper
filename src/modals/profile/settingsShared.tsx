import { Icon28DocumentTextOutline } from '@vkontakte/icons';
import { ActionCell } from '../../components/form/Form';

/** Общее для окон настроек профиля. */

const ARTICLE = 'https://vk.com/@wiki.warlord-authorization';

/** Ссылка на статью о входе. */
export function ArticleCell({ title, anchor }: { title: string; anchor: string }) {
	return <ActionCell icon={<Icon28DocumentTextOutline />} title={title} subtitle="Статья" href={`${ARTICLE}?anchor=${anchor}`} />;
}

/** Обрезка длинных значений справа: «установить», если пусто. */
export const short = (value: string | number | null | undefined, length = 9) => {
	if (!value) return 'установить';
	const text = String(value);
	return text.length > length ? `${text.substring(0, length)}...` : text;
};
