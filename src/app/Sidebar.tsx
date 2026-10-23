import type { ReactNode } from 'react';
import { findServer } from '../api/servers';
import { Tappable } from '@vkontakte/vkui';
import {
	Icon28GlobeOutline,
	Icon28GridSquareOutline,
	Icon28HomeOutline,
	Icon28IncognitoOutline,
	Icon28MoonOutline,
	Icon28PawOutline,
	Icon28Smiles2Outline,
	Icon28SunOutline,
	Icon28UserCardOutline,
	Icon28UserOutline,
	Icon28Users3Outline,
	Icon12OnlineVkmobile,
} from '@vkontakte/icons';
import { clickable } from '../lib/clickable';
import { isEmbedded } from '../lib/platform';
import { CAMERA_PHOTO } from '../profile/constants';
import { checkServer, currentProfile, hasRating, useSession } from '../profile/session';
import { openStory, useNotFound, useStory, type StoryId } from '../store/nav';
import { toggleTheme, useTheme } from '../store/theme';
import styles from './Sidebar.module.css';

interface MenuItem {
	story: StoryId;
	title: string;
	icon: ReactNode;
}

/** Пункты меню в том же порядке, что и в старом приложении. */
const HOME: MenuItem = { story: 'home', title: 'Главная', icon: <Icon28HomeOutline /> };
const PROFILE: MenuItem = { story: 'profile', title: 'Мой профиль', icon: <Icon28UserOutline /> };
const RATING: MenuItem = { story: 'rating', title: 'Рейтинг', icon: <Icon28UserCardOutline /> };

const WIKI: MenuItem[] = [
	{ story: 'map', title: 'Карта', icon: <Icon28GlobeOutline /> },
	{ story: 'bosses', title: 'Боссы', icon: <Icon28PawOutline /> },
	{ story: 'arena', title: 'Арена', icon: <Icon28Smiles2Outline /> },
	{ story: 'character', title: 'Персонаж', icon: <Icon28IncognitoOutline /> },
	{ story: 'guild', title: 'Гильдия', icon: <Icon28Users3Outline /> },
	{ story: 'other', title: 'Разное', icon: <Icon28GridSquareOutline /> },
];

function Item({ icon, title, active = false, onClick }: { icon: ReactNode; title: string; active?: boolean; onClick: () => void }) {
	return (
		<Tappable className={`${styles.item} ${active ? styles.active : ''}`} disabled={active} onClick={onClick}>
			<span className={styles.icon}>{icon}</span>
			<span className={styles.title}>{title}</span>
		</Tappable>
	);
}

/** Пользователь и сервер выбранного профиля над меню (внутри ВК, когда игровой сервер доступен). */
function ProfileHeader() {
	const user = useSession((s) => s.user);
	const isDonut = useSession((s) => s.isDonut);
	const server = useSession((s) => findServer(currentProfile(s)?.server ?? 1));
	return (
		<div className={styles.header}>
			<span className={`${styles.avatar} ImageBorder`}>
				<img src={user?.photo_200 ?? CAMERA_PHOTO} alt="" />
				<span className={styles.badge} style={{ backgroundImage: `url(${server?.logo})` }} />
			</span>
			<span className={styles.headerText}>
				<span className={styles.headerName}>{user?.first_name ? `${user.first_name} ${user.last_name}` : 'Пользователь'}</span>
				<span className={styles.headerCaption}>
					{server?.name}, {isDonut ? 'полный доступ' : 'обычный доступ'}
				</span>
			</span>
		</div>
	);
}

/** Задержка игрового сервера; по нажатию — проверить ещё раз. */
function Latency() {
	const latency = useSession((s) => s.latency);
	const color = latency < 50 ? 'var(--dynamic_green)' : latency < 150 ? 'var(--dynamic_orange)' : 'var(--dynamic_red)';
	return (
		<div className={styles.latency} style={{ color }} {...clickable(() => void checkServer())}>
			<Icon12OnlineVkmobile />
			Задержка сервера {latency} мс.
		</div>
	);
}

/** Левое меню (только десктоп). */
export function Sidebar() {
	const ready = useSession((s) => s.status === 'ready');
	const rating = useSession((s) => hasRating(s));
	const story = useStory();
	// На странице 404 ни один пункт не выбран — иначе по нему нельзя было бы уйти
	const notFound = useNotFound();
	const light = useTheme() === 'bright_light';
	const render = (item: MenuItem) => <Item key={item.story} icon={item.icon} title={item.title} active={!notFound && story === item.story} onClick={() => openStory(item.story)} />;
	return (
		<nav className={styles.sidebar}>
			{ready && <ProfileHeader />}
			{render(HOME)}
			{ready && render(PROFILE)}
			{ready && rating && render(RATING)}
			<div className={styles.separator} />
			{WIKI.map(render)}
			{!isEmbedded() && (
				<>
					<div className={styles.separator} />
					<Item icon={light ? <Icon28MoonOutline /> : <Icon28SunOutline />} title={light ? 'Тёмная тема' : 'Светлая тема'} onClick={toggleTheme} />
				</>
			)}
			{ready && <Latency />}
		</nav>
	);
}
