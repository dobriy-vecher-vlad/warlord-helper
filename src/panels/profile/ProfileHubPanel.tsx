import { useMemo, useState, useSyncExternalStore } from 'react';
import { Group, Panel, PullToRefresh, Spacing } from '@vkontakte/vkui';
import { Icon28DonateCircleFillYellow, Icon56FaceIdOutline } from '@vkontakte/icons';
import { findServer } from '../../api/servers';
import { useIsDesktop } from '../../app/layout';
import { AppHeader, CopyButton, HeaderTextButton } from '../../components/AppHeader';
import { Divider } from '../../components/Divider';
import { Button } from '../../components/form/Form';
import { NavCell } from '../../components/wiki/NavCell';
import Collections from '../../data/collections.json';
import { GAME_BOSS_GROUPS, RAID_BOSSES } from '../bosses/bossCalcData';
import { CARDS } from './bots/resourcesData';
import { RAIDS } from './bots/raidData';
import ShopData from '../../data/shop.json';
import { numberForm, numberSpaces, type Forms } from '../../lib/format';
import { ADMIN_VK_ID, CAMERA_PHOTO } from '../../profile/constants';
import { hasPlayers } from '../../profile/invites/realms';
import { refreshProfiles, selectProfile } from '../../profile/profileActions';
import { openSettings, useSession, type ProfileView } from '../../profile/session';
import { getModalStack, openModal, subscribeModals } from '../../store/modal';
import { openPanel } from '../../store/nav';
import styles from './ProfileHubPanel.module.css';
import { ProfileCarousel } from './ProfileCarousel';
import { useOnChange } from '../../lib/useOnChange';

/** Аватар профиля в галерее: выбранный крупно с обводкой, остальные уменьшены. */
function ProfileAvatar({ profile, selected }: { profile: ProfileView; selected: boolean }) {
	const server = findServer(profile.server ?? 1);
	return (
		<div className={`${styles.slide} ${selected ? styles.selected : ''}`}>
			<span className={`${styles.avatar} ImageBorder`}>
				<img src={profile.photo_200 || CAMERA_PHOTO} alt="" />
				<span className={styles.badge} style={{ backgroundImage: `url(${server?.logo})` }} />
			</span>
		</div>
	);
}

/** Пустой слот: заглушка вместо аватара. */
function EmptyAvatar({ selected }: { selected: boolean }) {
	return (
		<div className={`${styles.slide} ${selected ? styles.selected : ''}`}>
			<span className={`${styles.avatar} ${styles.empty}`}>
				<Icon56FaceIdOutline />
			</span>
		</div>
	);
}

/** Имя, ссылка и сервер под аватаром. */
function ProfileName({ profile, selected }: { profile: ProfileView; selected: boolean }) {
	const server = findServer(profile.server ?? 1);
	return (
		<div className={`${styles.slide} ${styles.nameSlide} ${selected ? styles.selected : ''}`}>
			<div className={styles.name}>{profile.first_name ? `${profile.first_name}\n${profile.last_name}` : `Player\n${profile.id}`}</div>
			<a className={styles.link} href={`https://vk.ru/id${profile.id}`} target="_blank" rel="noreferrer">
				@id{profile.id}
			</a>
			<div className={styles.server}>
				{server?.name}, {server?.company}
			</div>
		</div>
	);
}

function EmptyName() {
	return (
		<div className={`${styles.slide} ${styles.nameSlide}`}>
			<div className={styles.name}>Профиль</div>
			<span className={styles.free}>Свободный слот</span>
		</div>
	);
}

/** Предметы, которые продаются в магазине (снимок каталога игры, как в панели «Магазин»): главная считает купленное из них, а не из всего каталога. */
const SHOP_IDS = new Set(ShopData.map(([id]) => id));

/** Предметы, которые вообще могут быть у персонажа и улучшаться в кузнице: из магазина и из коллекций. */
const FORGE_IDS = new Set<number>([...ShopData.map(([id]) => id!), ...Collections.items]);

/** Боссы, которых можно позвать в бой: временные, общие и одиночные (рейдовых боссов создать нельзя). */
const BOSS_COUNT = GAME_BOSS_GROUPS.filter((group) => group.title !== RAID_BOSSES).reduce((sum, group) => sum + group.items.length, 0);

/** «Мой профиль»: галерея профилей, настройки и разделы профиля. */
export function ProfileHubPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const isDonut = useSession((s) => s.isDonut);
	const profiles = useSession((s) => s.profiles);
	const profilesFull = useSession((s) => s.profilesFull);
	const index = useSession((s) => s.index);
	const fetching = useSession((s) => s.fetching);
	const game = useSession((s) => s.game);
	const items = useSession((s) => s.items);
	const server = useSession((s) => s.profiles[s.index]?.server);
	const donutCount = useSession((s) => s.donutUsers?.response?.count ?? 0);
	const draftId = useSession((s) => s.draft.id);
	const donutIcon = !isDonut ? <Icon28DonateCircleFillYellow width={24} height={24} /> : undefined;

	const header = (
		<AppHeader
			center
			title="Мой профиль"
			before={<HeaderTextButton onClick={() => openModal('settingsOrder')}>Изменить</HeaderTextButton>}
			after={isDesktop ? <CopyButton view="profile" /> : undefined}
		/>
	);

	// Без подписки в галерее только основной профиль
	const slides = isDonut
		? profiles.map((profile, x) => ({ profile, full: profilesFull[x] ?? profile, x }))
		: [{ profile: profiles[0], full: profilesFull[0] ?? profiles[0], x: 0 }];
	// Слот по центру карусели. Пустой слот открывает окно добавления; если его закрыли без добавления, карусель возвращается к выбранному профилю
	const [shown, setShown] = useState(index);
	const adding = useSyncExternalStore(subscribeModals, getModalStack).some((entry) => entry.data.mode === 'add');
	useOnChange([index], () => setShown(index));
	useOnChange([adding], () => {
		if (!adding && !profiles[shown]?.id) setShown(index);
	});
	const onSelect = (next: number) => {
		setShown(next);
		if (isDonut && next !== index) void selectProfile(next);
	};
	// Коллекций сотни, предметов у игрока тоже: пересчёт только при изменении набора, а не при каждой отрисовке
	const bought = useMemo(() => items.filter((id) => SHOP_IDS.has(id)).length, [items]);
	const forgeable = useMemo(() => items.filter((id) => FORGE_IDS.has(id)).length, [items]);
	const collected = useMemo(() => {
		const owned = new Set(items);
		return Collections.items.filter((item) => owned.has(item)).length;
	}, [items]);
	// Без подписки в галерее один слот: он и есть выбранный, как бы ни был сдвинут `shown`
	const current = isDonut ? shown : 0;
	/** Счётчик справа; без подписки вместо него значок VK Donut. */
	const indicatorProps = (count: number | string, total: number, forms: Forms) => (isDonut ? { count, countLabel: numberForm(total, forms) } : { count: donutIcon });

	return (
		<Panel id={id}>
			{!isDesktop && header}
			<Group mode="plain" className="AppGroup HubGroup">
				{isDesktop && header}
				<PullToRefresh className={styles.refresh} slotProps={{ controls: { zIndex: 0 } }} onRefresh={() => void refreshProfiles()} isFetching={fetching}>
					<Spacing size={6} />
					<ProfileCarousel
						count={slides.length}
						value={current}
						onSelect={onSelect}
						avatarWidth={isDesktop ? 25 : 35}
						avatar={(x) => {
							const { profile, full } = slides[x]!;
							return profile?.id ? <ProfileAvatar profile={full!} selected={x === current} /> : <EmptyAvatar selected={x === current} />;
						}}
						name={(x) => {
							const { profile, full } = slides[x]!;
							return profile?.id ? <ProfileName profile={full!} selected={x === current} /> : <EmptyName />;
						}}
					/>
					<Spacing size={12} />
					<Button stretched size="m" mode="tertiary" onClick={() => openSettings()}>
						Настройки профиля
					</Button>
					<Divider size={12} />
					{hasPlayers(server ?? 1) && (
						<NavCell
							profile
							title="Боссы"
							subtitle="Приглашения и бои"
							image="labels/29.png"
							{...indicatorProps(BOSS_COUNT, BOSS_COUNT, ['босс', 'босса', 'боссов'])}
							onClick={() => openPanel('11')}
						/>
					)}
					<NavCell
						profile
						title="Рейды"
						subtitle="Подземелья и награды"
						image="labels/4.png"
						{...indicatorProps(RAIDS.length, RAIDS.length, ['рейд', 'рейда', 'рейдов'])}
						onClick={() => openPanel('6')}
					/>
					<NavCell
						profile
						title="Арена"
						subtitle="Бои и сундуки"
						image="labels/30.png"
						{...indicatorProps(numberSpaces(Number(game?._ap ?? 0)), Number(game?._ap ?? 0), ['кубок', 'кубка', 'кубков'])}
						onClick={() => openPanel('7')}
					/>
					<NavCell
						profile
						title="Ресурсы"
						subtitle="Сбор наград и энергии"
						image="labels/14.png"
						{...indicatorProps(CARDS.length, CARDS.length, ['источник', 'источника', 'источников'])}
						onClick={() => openPanel('9')}
					/>
					<NavCell
						profile
						title="Магазин"
						subtitle="Ассортимент предметов"
						image="labels/12.png"
						{...indicatorProps(`${bought} из ${ShopData.length}`, ShopData.length, ['предмет', 'предмета', 'предметов'])}
						onClick={() => openPanel('1')}
					/>
					<NavCell
						profile
						title="Коллекции"
						subtitle="Ассортимент коллекций"
						image="labels/11.png"
						{...indicatorProps(`${collected} из ${Collections.items.length}`, Collections.items.length, ['коллекция', 'коллекции', 'коллекций'])}
						onClick={() => openPanel('2')}
					/>
					<NavCell
						profile
						title="Кузница"
						subtitle="Улучшение предметов"
						image="labels/20.png"
						{...indicatorProps(`${forgeable} из ${FORGE_IDS.size}`, FORGE_IDS.size, ['предмет', 'предмета', 'предметов'])}
						onClick={() => openPanel('10')}
					/>
					<NavCell
						profile
						title="Инкрустация"
						subtitle="Предметы и камни"
						image="labels/31.png"
						{...indicatorProps(items.length, items.length, ['предмет', 'предмета', 'предметов'])}
						onClick={() => openPanel('3')}
					/>
					<Divider size={12} />
					{(server === 1 || server === 2) && (
						<NavCell profile title="Друзья" subtitle="Друзья и характеристики" image="labels/23.png" count={donutIcon} onClick={() => openPanel('5')} />
					)}
					{Number(draftId) === ADMIN_VK_ID && (
						<NavCell
							profile
							title="Доны"
							subtitle="Список донов"
							image="labels/28.png"
							{...indicatorProps(donutCount, donutCount, ['дон', 'дона', 'донов'])}
							onClick={() => openPanel('4')}
						/>
					)}
				</PullToRefresh>
			</Group>
		</Panel>
	);
}
