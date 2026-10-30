import { Group, Panel, Placeholder } from '@vkontakte/vkui';
import { Icon56GhostOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../app/layout';
import { AppHeader } from '../components/AppHeader';
import { openStory } from '../store/nav';
import { FooterButton } from '../components/form/FooterButton';

/** Страница 404: ссылка ведёт на несуществующий раздел, подраздел или окно. */
export function NotFoundPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const header = <AppHeader center title="Ошибка" />;
	return (
		<Panel id={id}>
			{!isDesktop && header}
			<Group mode="plain" className="AppGroup">
				{isDesktop && header}
				<Placeholder icon={<Icon56GhostOutline />} title="Такой страницы нет" action={<FooterButton onClick={() => openStory('home')}>На главную</FooterButton>}>
					Ссылка устарела или в ней ошибка
				</Placeholder>
			</Group>
		</Panel>
	);
}
