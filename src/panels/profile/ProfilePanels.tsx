import type { ReactElement } from 'react';
import { Panel, PanelSpinner } from '@vkontakte/vkui';
import { Icon56ErrorTriangleOutline } from '@vkontakte/icons';
import { Placeholder } from '../../components/profile/Placeholder';
import { isEmbedded } from '../../lib/platform';
import { useSession } from '../../profile/session';
import { startSession } from '../../profile/sessionLoad';
import { openPanel } from '../../store/nav';
import type { SectionPanels } from '../section';
import { CollectionsPanel } from './CollectionsPanel';
import { InlayPanel } from './InlayPanel';
import { ShopPanel } from './ShopPanel';
import { ArenaBotPanel } from './bots/ArenaBotPanel';
import { ForgePanel } from './bots/ForgePanel';
import { RaidsBotPanel } from './bots/RaidsBotPanel';
import { ResourcesBotPanel } from './bots/ResourcesBotPanel';
import { CreateBossPanel } from './CreateBossPanel';
import { InvitesPanel } from './InvitesPanel';
import { DonorsPanel, FriendsPanel } from './PeoplePanels';
import { FooterButton } from '../../components/form/FooterButton';

/**
 * Подраздел профиля показывается, когда профили и персонаж загружены: по ссылке панель открывается раньше,
 * и боты, не найдя пароль, ложно открывали окно настроек с ошибкой авторизации.
 */
type PanelComponent = (props: { id: string }) => ReactElement;

function afterSessionLoaded(Component: PanelComponent): PanelComponent {
	return function SessionGate({ id }) {
		const status = useSession((state) => state.status);
		if (status === 'ready') return <Component id={id} />;
		if (status === 'loading')
			return (
				<Panel id={id}>
					<PanelSpinner />
				</Panel>
			);
		// Профиль не загрузился (нет ВК или игровой сервер недоступен): вместо вечной загрузки — выход и, внутри ВК, повтор
		return (
			<Panel id={id}>
				<Placeholder
					icon={<Icon56ErrorTriangleOutline />}
					title="Профиль недоступен"
					action={
						<>
							{isEmbedded() && (
								<FooterButton mode="primary" onClick={() => void startSession()}>
									Повторить
								</FooterButton>
							)}
							<FooterButton mode="tertiary" onClick={() => openPanel(null, { force: true })}>
								Назад
							</FooterButton>
						</>
					}
				>
					Профиль загружается только внутри ВКонтакте при доступном игровом сервере
				</Placeholder>
			</Panel>
		);
	};
}

/** Подразделы профиля. */
export const PROFILE_SECTION: SectionPanels = {
	'1': afterSessionLoaded(ShopPanel),
	'2': afterSessionLoaded(CollectionsPanel),
	'3': afterSessionLoaded(InlayPanel),
	'4': afterSessionLoaded(DonorsPanel),
	'5': afterSessionLoaded(FriendsPanel),
	'6': afterSessionLoaded(RaidsBotPanel),
	'7': afterSessionLoaded(ArenaBotPanel),
	'9': afterSessionLoaded(ResourcesBotPanel),
	'10': afterSessionLoaded(ForgePanel),
	'11': afterSessionLoaded(InvitesPanel),
	'12': afterSessionLoaded(CreateBossPanel),
};
