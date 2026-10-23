import { isEmbedded } from '../lib/platform';
import { openPanel, openStory, type StoryId } from '../store/nav';
import { useIsDesktop } from '../app/layout';
import { AppHeader, CopyButton } from './AppHeader';

interface PageHeaderProps {
	title: string;
	description?: string;
	/** Иконка, путь внутри media/images/ */
	avatar?: string;
	/** Раздел, которому принадлежит подраздел */
	parent: StoryId;
	/** id подраздела — для ссылки «копировать» */
	panel: string;
	/** Панель для «назад» вместо главной панели раздела; такая страница без ссылки «копировать» */
	back?: string;
}

/**
 * Шапка подраздела: «назад» к главной панели раздела и копирование ссылки
 * (на телефоне внутри ВК кнопки копирования нет — там есть своё меню).
 */
export function PageHeader({ title, description, avatar, parent, panel, back }: PageHeaderProps) {
	const isDesktop = useIsDesktop();
	return (
		<AppHeader
			title={title}
			subtitle={description}
			avatar={avatar}
			onBack={() => openPanel(back ?? parent)}
			after={!back && !(isEmbedded() && !isDesktop) && <CopyButton view={parent} panel={panel} />}
		/>
	);
}

/** Шапка главной панели раздела: название по центру, «назад» на главную (только на телефоне). */
export function HubHeader({ title, story }: { title: string; story: StoryId }) {
	const isDesktop = useIsDesktop();
	return <AppHeader center title={title} onBack={isDesktop ? undefined : () => openStory('home')} after={(isDesktop || !isEmbedded()) && <CopyButton view={story} />} />;
}
