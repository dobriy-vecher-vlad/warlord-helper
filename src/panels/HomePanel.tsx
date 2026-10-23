import type { ReactNode } from 'react';
import { Gallery, Group, Panel, Tappable } from '@vkontakte/vkui';
import {
	Icon28GlobeOutline,
	Icon28GridSquareOutline,
	Icon28HelpOutline,
	Icon28IncognitoOutline,
	Icon28KeyOutline,
	Icon28LikeOutline,
	Icon28PawOutline,
	Icon28Smiles2Outline,
	Icon28UserCardOutline,
	Icon28Users3Outline,
} from '@vkontakte/icons';
import { useIsDesktop } from '../app/layout';
import { AppHeader } from '../components/AppHeader';
import { Divider } from '../components/Divider';
import { PATH_IMAGES, WIKI_VERSION } from '../config';
import dataMain from '../data/main.json';
import { isEmbedded } from '../lib/platform';
import { hasRating, useSession } from '../profile/session';
import { openModal } from '../store/modal';
import { openStory, type StoryId } from '../store/nav';
import { Preload } from '../components/Preload';
import styles from './HomePanel.module.css';

type News = (typeof dataMain.news)[number];

interface Tile {
	title: string;
	color: string;
	icon: ReactNode;
	story?: StoryId;
	href?: string;
	onClick?: () => void;
}

/** Плитки разделов на телефоне. Пустые ячейки дополняют ряд до четырёх, как в старом приложении. */
const SECTIONS: (Tile | null)[] = [
	{ story: 'map', title: 'Карта', color: 'var(--systemBlue)', icon: <Icon28GlobeOutline /> },
	{ story: 'bosses', title: 'Боссы', color: 'var(--systemRed)', icon: <Icon28PawOutline /> },
	{ story: 'arena', title: 'Арена', color: 'var(--systemOrange)', icon: <Icon28Smiles2Outline /> },
	{ story: 'character', title: 'Персонаж', color: 'var(--systemGreen)', icon: <Icon28IncognitoOutline /> },
	{ story: 'guild', title: 'Гильдия', color: 'var(--systemYellow)', icon: <Icon28Users3Outline /> },
	{ story: 'other', title: 'Разное', color: 'var(--systemPurple)', icon: <Icon28GridSquareOutline /> },
	{ story: 'rating', title: 'Рейтинг', color: 'var(--systemIndigo)', icon: <Icon28UserCardOutline /> },
	null,
];

const HELP: Tile = { href: 'https://vk.com/@wiki.warlord-faq', title: 'Помощь', color: 'var(--systemTeal)', icon: <Icon28HelpOutline /> };

/** Второй ряд: внутри ВК — акция, подписка и инструкция по входу, вне ВК — только помощь. */
const LINKS: (Tile | null)[] = isEmbedded()
	? [
			{ onClick: () => openModal('sales'), title: 'Акция', color: 'var(--systemRed)', icon: <Icon28LikeOutline /> },
			{ onClick: () => openModal('donut'), title: 'Подписка', color: 'var(--systemTeal)', icon: <Icon28LikeOutline /> },
			{ href: 'https://vk.com/@wiki.warlord-authorization', title: 'Вход', color: 'var(--systemTeal)', icon: <Icon28KeyOutline /> },
			HELP,
		]
	: [HELP, null, null, null];

function TileCell({ tile }: { tile: Tile | null }) {
	if (!tile) {
		return (
			<div className={`${styles.tile} ${styles.tileEmpty}`}>
				<span className={styles.tileIcon} style={{ ['--fill' as string]: '#505050' }} />
				<span className={styles.tileTitle}>&nbsp;</span>
			</div>
		);
	}
	const content = (
		<>
			<span className={styles.tileIcon} style={{ ['--fill' as string]: tile.color }}>
				{tile.icon}
			</span>
			<span className={styles.tileTitle}>{tile.title}</span>
		</>
	);
	return tile.href ? (
		<Tappable Component="a" href={tile.href} target="_blank" className={styles.tile}>
			{content}
		</Tappable>
	) : (
		<Tappable className={styles.tile} onClick={() => (tile.onClick ? tile.onClick() : tile.story && openStory(tile.story))}>
			{content}
		</Tappable>
	);
}

function NewsCard({ news, large = false }: { news: News; large?: boolean }) {
	return (
		<Tappable Component="a" href={news.link} target="_blank" className={`${styles.news} ${large ? styles.newsLarge : ''}`}>
			{/* Картинки новостей тяжёлые (PNG до 1 МБ): грузятся и декодируются, только когда видны */}
			<span className={`${styles.newsImage} ImageBorder`}>
				<img src={`${PATH_IMAGES}${news.icon}`} alt="" loading="lazy" decoding="async" />
			</span>
			<span className={styles.newsContent}>
				<span className={styles.newsTitle}>{news.title}</span>
				<span className={styles.newsDate}>{news.description}</span>
			</span>
		</Tappable>
	);
}

function Banners() {
	const isDesktop = useIsDesktop();
	return (
		<Gallery className={styles.banners} bullets={false} showArrows={isDesktop} looped dragDisabled={isDesktop} slideWidth={isDesktop ? 375 : 318 + 8} align="center" timeout={5000}>
			{dataMain.banners.map((banner) => (
				<div key={banner.icon} className={styles.bannerSlide}>
					<div className={`${styles.banner} BannerBorder`}>
						<Preload src={`${PATH_IMAGES}${banner.icon}`} size="xl" className={styles.bannerPreload} />
						<div className={styles.bannerImage} style={{ backgroundImage: `url(${PATH_IMAGES}${banner.icon})` }} />
						<div className={styles.bannerContent}>
							<a className={styles.bannerButton} href={banner.link} target="_blank" rel="noreferrer">
								{banner.action}
							</a>
						</div>
					</div>
				</div>
			))}
		</Gallery>
	);
}

/** Главная страница: баннеры, новости и (на телефоне) плитки разделов. */
export function HomePanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	// Приветствие: имя пользователя ВК из сессии (внутри ВК); рейтинг есть только у профилей на серверах ВКонтакте
	const firstName = useSession((s) => s.user?.first_name ?? null);
	const hasRatingTile = useSession((s) => s.status === 'ready' && hasRating(s));
	const header = <AppHeader center title="Warlord Helper" subtitle={`Версия ${WIKI_VERSION}`} />;

	if (isDesktop) {
		return (
			<Panel id={id}>
				<Group mode="plain" className="AppGroup">
					{header}
					<Banners />
					<div className={styles.newsGrid}>
						{dataMain.news.map((news) => (
							<NewsCard key={news.link} news={news} />
						))}
					</div>
				</Group>
			</Panel>
		);
	}

	return (
		<Panel id={id}>
			{header}
			<div className={styles.mobileTop}>
				<Banners />
				<div className={styles.tiles}>
					{SECTIONS.map((tile) => (tile?.story === 'rating' && !hasRatingTile ? null : tile)).map((tile, index) => (
						<TileCell key={index} tile={tile} />
					))}
				</div>
				<Divider size={16} />
				<div className={styles.tiles}>
					{LINKS.map((tile, index) => (
						<TileCell key={index} tile={tile} />
					))}
				</div>
			</div>
			<div className={styles.roundGap} />
			<div className={styles.mobileNews}>
				{isEmbedded() ? (
					<>
						<div className={styles.head}>Привет, {firstName ?? 'Пользователь'}</div>
						<div className={styles.subhead}>новости приложения для тебя</div>
					</>
				) : (
					<>
						<div className={styles.head}>Новости</div>
						<div className={styles.subhead}>новости приложения</div>
					</>
				)}
				<div className={styles.newsScroll}>
					{dataMain.news.map((news) => (
						<NewsCard key={news.link} news={news} large />
					))}
				</div>
			</div>
		</Panel>
	);
}
