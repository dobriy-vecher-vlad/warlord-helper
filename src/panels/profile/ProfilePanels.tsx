import type { ReactElement } from 'react';
import { Panel, PanelSpinner } from '@vkontakte/vkui';
import { useSession } from '../../profile/session';
import type { SectionPanels } from '../section';
import { CollectionsPanel, InlayPanel, ShopPanel } from './ItemsPanels';
import { ArenaBotPanel } from './bots/ArenaBotPanel';
import { ForgePanel } from './bots/ForgePanel';
import { RaidsBotPanel } from './bots/RaidsBotPanel';
import { ResourcesBotPanel } from './bots/ResourcesBotPanel';
import { CreateBossPanel } from './CreateBossPanel';
import { InvitesPanel } from './InvitesPanel';
import { DonorsPanel, FriendsPanel } from './PeoplePanels';

/**
 * Подраздел профиля показывается, когда профили и персонаж загружены: по ссылке панель открывается раньше,
 * и боты, не найдя пароль, ложно открывали окно настроек с ошибкой авторизации.
 */
type PanelComponent = (props: { id: string }) => ReactElement;

function afterSessionLoaded(Component: PanelComponent): PanelComponent {
	return function SessionGate({ id }) {
		const ready = useSession((state) => state.status === 'ready');
		return ready ? (
			<Component id={id} />
		) : (
			<Panel id={id}>
				<PanelSpinner />
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
