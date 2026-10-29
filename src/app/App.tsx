import { useEffect, useState } from 'react';
import { AdaptivityProvider, AppRoot, ConfigProvider, Badge, Epic, ScreenSpinner, SplitCol, SplitLayout, Tabbar, TabbarItem, View } from '@vkontakte/vkui';
import { Icon28NewsfeedOutline } from '@vkontakte/icons';
import bridge from '@vkontakte/vk-bridge';
import { useConfirm } from '../lib/confirmAction';
import { useLeaveRequest } from '../lib/leaveGuard';
import { isEmbedded } from '../lib/platform';
import { CAMERA_PHOTO } from '../profile/constants';
import { installRouteRules } from '../profile/routes';
import { useSession } from '../profile/session';
import { startSession } from '../profile/sessionLoad';
import { ProfileHubPanel } from '../panels/profile/ProfileHubPanel';
import { HomePanel } from '../panels/HomePanel';
import { HubPanel } from '../panels/HubPanel';
import { NotFoundPanel } from '../panels/NotFoundPanel';
import { SectionPanel, preloadRouteSection, preloadSectionsWhenIdle } from '../panels/sections';
import { getNav, initNav, openStory, useNotFound, usePanel, useStory } from '../store/nav';
import { PROFILE_PANELS, RATING_PANELS } from '../stories/profile';
import { initTheme, useTheme, useThemeKnown } from '../store/theme';
import { HUB_STORIES } from '../stories/registry';
import { useIsDesktop } from './layout';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfirmAlert } from './ConfirmAlert';
import { LeaveAlert } from './LeaveAlert';
import { NotifyProvider } from './notify';
import { Modals, preloadAnalysisModals } from './Modals';
import { Sidebar } from './Sidebar';
import { startUrlSync } from './urlSync';
import { Photo } from '../components/Photo';
import { Splash } from './Splash';

/** Разделы, при которых на нижней панели подсвечена «Главная». */
const HOME_GROUP = ['home', 'map', 'bosses', 'arena', 'character', 'guild', 'other'];

function Layout() {
	const isDesktop = useIsDesktop();
	const story = useStory();

	useEffect(() => {
		document.documentElement.dataset.layout = isDesktop ? 'desktop' : 'mobile';
	}, [isDesktop]);
	const panel = usePanel();
	const notFound = useNotFound();
	const busy = useSession((s) => s.busy);
	// Внутри ВК, пока грузятся профиль и данные игры и раздел из ссылки, показывается только заставка, а не приложение с загрузкой поверх
	const loading = useSession((s) => s.status === 'loading');
	const [built, setBuilt] = useState(!isEmbedded());
	// Подтверждение ухода, пока идёт действие, которое уход прервёт
	const leaving = useLeaveRequest();
	// Подтверждение необратимого или платного действия (удаление профиля, выход из рейда и другие)
	const asked = useConfirm();
	useEffect(() => {
		if (loading || built) return;
		let alive = true;
		const { story: target, panel: targetPanel } = getNav();
		void preloadRouteSection(target, targetPanel).then(() => alive && setBuilt(true));
		return () => {
			alive = false;
		};
	}, [loading, built]);
	const starting = loading || !built;
	const profileOn = useSession((s) => s.status === 'ready');
	const user = useSession((s) => s.user);
	const isDonut = useSession((s) => s.isDonut);

	if (starting) {
		return <Splash />;
	}

	const views = [
		<View key="home" id="home" activePanel={panel ?? 'home'}>
			<HomePanel id="home" />
		</View>,
		...HUB_STORIES.map((hub) => (
			<View key={hub.id} id={hub.id} activePanel={panel ?? hub.id}>
				{[
					<HubPanel key="hub" id={hub.id} story={hub} />,
					...[...hub.cells.map((cell) => cell.panel), ...(hub.extraPanels ?? [])].map((panelId) => <SectionPanel key={panelId} id={panelId} section={hub.id} />),
				]}
			</View>
		)),
		<View key="profile" id="profile" activePanel={panel ?? 'profile'}>
			{[<ProfileHubPanel key="hub" id="profile" />, ...PROFILE_PANELS.map((id) => <SectionPanel key={id} id={id} section="profile" />)]}
		</View>,
		<View key="rating" id="rating" activePanel={panel ?? 'rating'}>
			{[<SectionPanel key="rating" id="rating" section="rating" />, ...RATING_PANELS.map((id) => <SectionPanel key={id} id={id} section="rating" />)]}
		</View>,
		<View key="notFound" id="notFound" activePanel="notFound">
			<NotFoundPanel id="notFound" />
		</View>,
	];

	return (
		<SplitLayout center popout={leaving ? <LeaveAlert /> : asked ? <ConfirmAlert options={asked} /> : busy ? <ScreenSpinner /> : null}>
			{isDesktop && story && (
				<SplitCol fixed width="280px" maxWidth="280px" minWidth="280px">
					<Sidebar />
				</SplitCol>
			)}
			<SplitCol width={isDesktop && story ? '560px' : '100%'} maxWidth={isDesktop && story ? '560px' : '100%'}>
				{story && (
					<Epic
						activeStory={notFound ? 'notFound' : story}
						tabbar={
							!isDesktop && (
								<Tabbar className="AppTabbar">
									<TabbarItem onClick={() => openStory('home')} selected={!notFound && HOME_GROUP.includes(story)} label="Главная">
										<Icon28NewsfeedOutline />
									</TabbarItem>
									{profileOn && (
										<TabbarItem
											onClick={() => openStory('profile')}
											selected={!notFound && story === 'profile'}
											label={user ? `${user.first_name} ${user.last_name}` : 'Пользователь'}
											indicator={isDonut ? <Badge className="DonutBadge" /> : undefined}
										>
											<Photo src={user?.photo_200 ?? CAMERA_PHOTO} size={28} />
										</TabbarItem>
									)}
								</Tabbar>
							)
						}
					>
						{views}
					</Epic>
				)}
			</SplitCol>
		</SplitLayout>
	);
}

export function App() {
	const theme = useTheme();
	const themeKnown = useThemeKnown();

	useEffect(() => {
		// Инициализация нужна только внутри ВК; вне его запрос не имеет адресата
		if (isEmbedded()) bridge.send('VKWebAppInit').catch(() => undefined);
		installRouteRules();
		initNav();
		void startSession();
		void initTheme();
		preloadSectionsWhenIdle();
		const preloadModals = window.setTimeout(preloadAnalysisModals, 8000);
		const stopUrlSync = startUrlSync();
		return () => {
			window.clearTimeout(preloadModals);
			stopUrlSync();
		};
	}, []);

	return (
		<ConfigProvider colorScheme={theme === 'space_gray' ? 'dark' : 'light'} platform="ios" isWebView={isEmbedded()}>
			<AdaptivityProvider>
				<AppRoot userSelectMode="enabled">
					{themeKnown && (
						<ErrorBoundary>
							<NotifyProvider>
								<Layout />
								<Modals />
							</NotifyProvider>
						</ErrorBoundary>
					)}
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
}
