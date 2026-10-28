import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Icon16ChevronOutline, Icon24SadFaceOutline, Icon56DonateOutline } from '@vkontakte/icons';
import { getGame } from '../../api/game';
import { useIsDesktop } from '../../app/layout';
import { Button } from '../../components/form/Form';
import { ScrollBox } from '../../components/profile/ScrollBox';
import { Placeholder } from '../../components/profile/Placeholder';
import { Skeleton } from '../../components/Skeleton';
import { Pager, TableHead, TableRow, TableStatic } from '../../components/profile/Table';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { mapLimit } from '../../lib/async';
import { numberSpaces } from '../../lib/format';
import { DEFAULT_AUTHORIZATION, VK_APP_ID } from '../../profile/constants';
import { currentProfile, getSession, useSession } from '../../profile/session';
import { getBridge, type VKResponse, type VKUser } from '../../profile/vk';
import { openModal } from '../../store/modal';
import { openPanel } from '../../store/nav';
import styles from './PeoplePanels.module.css';
import { Photo } from '../../components/Photo';
import { CAMERA_PHOTO } from '../../profile/constants';
import { sectionBase } from '../section';

const base = sectionBase('profile', 'Мой профиль');

export interface Friend {
	id: number;
	name: string;
	photo?: string;
	dmg: number;
	hp: number;
	lvl: number;
	exp: number;
	/** Время регистрации и последнего входа, мс */
	active: [number, number];
	/** Место по урону */
	x: number;
}

/** Сколько друзей отправляется в игровой сервер за один запрос. */
const FRIENDS_CHUNK = 300;
/** Запросов одновременно: сервер ограничивает частоту (при превышении getData сам ждёт и повторяет), поэтому немного. */
const FRIENDS_PARALLEL = 2;

/** Друзья ВК, которые играют: их персонажи через служебный профиль сервера, по 300 за запрос. */
export async function scanFriends(): Promise<Friend[] | { error: string }> {
	const session = getSession();
	const token = await getBridge('VKWebAppGetAuthToken', { app_id: VK_APP_ID, scope: 'friends' });
	if (token?.error_data) return { error: String(token.error_data.error_reason) };
	if (!token?.access_token) return { error: String(token) };
	const data = await getBridge<VKResponse<{ items: { id: number; photo_50?: string }[] }>>('VKWebAppCallAPIMethod', {
		method: 'friends.get',
		params: { user_id: session.user?.id, fields: 'photo_50', count: 5000, v: '5.130', access_token: token.access_token },
	});
	// Ответа нет — это сбой, а не отсутствие друзей: иначе пользователю скажут «у вас нет друзей»
	if (!data?.response) return { error: 'ВКонтакте не вернул список друзей, попробуйте позже' };
	const list: { id: number; photo_50?: string }[] = data.response.items ?? [];
	if (!list.length) return [];
	const server = currentProfile()?.server ?? 1;
	const photos = new Map(list.map((item) => [item.id, item.photo_50]));
	const chunks = Array.from({ length: Math.ceil(list.length / FRIENDS_CHUNK) }, (_, page) => list.slice(page * FRIENDS_CHUNK, (page + 1) * FRIENDS_CHUNK));
	let pages: unknown[][];
	try {
		pages = await mapLimit(chunks, FRIENDS_PARALLEL, async (chunk) => {
			const game = await getGame(server, { i: 7, f_data: `<data>${chunk.map((item) => `<u>${item.id}</u>`).join('')}</data>` }, DEFAULT_AUTHORIZATION[server - 1]);
			if (!game?.u) throw new Error('Игровой сервер не ответил');
			return Array.isArray(game.u) ? game.u : [game.u];
		});
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Не удалось получить друзей' };
	}
	const now = Date.now();
	const friends: Omit<Friend, 'x'>[] = [];
	for (const user of pages.flat() as Record<string, string>[]) {
		const id = Number(user._vkId);
		// Себя в списке друзей быть не должно, но если сервер вернул — убираем
		if (id === session.user?.id) continue;
		friends.push({
			id,
			name: !user._name ? `Player${user._id}` : user._name,
			photo: photos.get(id),
			dmg: Number(user._dmgi),
			hp: (Number(user._endi) + Number(user._end)) * 15,
			lvl: Number(user._lvl),
			exp: Number(user._exp),
			active: [now - Number(user._bd) * 1000, now - Number(user._l_t) * 1000],
		});
	}
	return friends.sort((a, b) => b.dmg - a.dmg || a.id - b.id).map((friend, index) => ({ ...friend, x: index + 1 }));
}

const PAGE = 50;
type SortKey = 1 | 2 | 3 | 4;

/** 5. Друзья: персонажи друзей ВК с сортировкой по урону, здоровью, уровню и последнему входу. */
export function FriendsPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const [friends, setFriends] = useState<Friend[] | null>(null);
	const [mode, setMode] = useState<[SortKey, boolean]>([1, true]);
	const [page, setPage] = useState(0);

	useEffect(() => {
		let alive = true;
		void scanFriends().then((result) => {
			if (!alive) return;
			if (Array.isArray(result)) {
				setFriends(result);
				return;
			}
			openModal('alert', { header: 'Ошибка при получении друзей', subheader: result.error });
			openPanel('profile');
		});
		return () => {
			alive = false;
		};
	}, []);

	const grid: CSSProperties = isDesktop
		? { gridTemplateColumns: '32px 32px 20% repeat(3, calc(80% / 3 - (32px + 32px + 110px) / 3)) 110px', width: 'calc(100% - 8px * 6)', gap: 8 }
		: { gridTemplateColumns: '32px 32px 20% repeat(3, calc(80% / 3 - (32px + 32px) / 3))', width: 'calc(100% - 16px * 5)', gap: 16 };

	const sorted = useMemo(() => {
		if (!friends) return [];
		const field = (friend: Friend) => [friend.dmg, friend.hp, friend.exp, friend.active[1]][mode[0] - 1] ?? 0;
		return [...friends].sort((a, b) => (mode[1] ? (field(b) < field(a) ? -1 : 1) : field(a) < field(b) ? -1 : 1));
	}, [friends, mode]);

	const toggle = (key: SortKey) => setMode(([current, desc]) => [key, current === key ? !desc : true]);
	const arrow = (key: SortKey) => (mode[0] === key ? <Icon16ChevronOutline style={{ transform: mode[1] ? 'rotate(-90deg)' : 'rotate(90deg)' }} /> : null);
	const pages = Math.ceil(sorted.length / PAGE);

	if (friends && !friends.length) {
		return (
			<WikiPanel {...base(id, 'Друзья', 23)}>
				<Placeholder icon={<Icon24SadFaceOutline width={56} height={56} />} title="Друзья">
					У вас нет друзей,
					<br />
					обязательно добавьте кого-нибудь
					<br />и попробуйте снова
				</Placeholder>
			</WikiPanel>
		);
	}

	return (
		<WikiPanel
			{...base(id, 'Друзья', 23)}
			top={
				<div className={styles.head}>
					<TableStatic grid={grid}>
						<div />
						<div className={styles.avatarSpace} />
						<div />
						{friends ? (
							<>
								<TableHead onClick={() => toggle(1)} sort={arrow(1)}>
									урон
								</TableHead>
								<TableHead onClick={() => toggle(2)} sort={arrow(2)}>
									здоровье
								</TableHead>
								<TableHead onClick={() => toggle(3)} sort={arrow(3)}>
									уровень
								</TableHead>
								{isDesktop && (
									<TableHead onClick={() => toggle(4)} sort={arrow(4)}>
										последний вход
									</TableHead>
								)}
							</>
						) : (
							<>
								<Skeleton height={16} />
								<Skeleton height={16} />
								<Skeleton height={16} />
								{isDesktop && <Skeleton height={16} />}
							</>
						)}
					</TableStatic>
				</div>
			}
			bottom={
				<div className={styles.bottom}>
					{friends ? (
						<Pager page={page} pages={pages} onChange={setPage} />
					) : (
						<TableStatic>
							<div className={styles.pagerSkeleton}>
								<Skeleton height={16} width="35%" />
								<Skeleton height={30} width="20%" />
							</div>
						</TableStatic>
					)}
				</div>
			}
		>
			<ScrollBox height={392} minHeight={friends ? undefined : 'calc(100vh - 216px)'}>
				{friends
					? sorted.slice(page * PAGE, (page + 1) * PAGE).map((friend) => (
							<TableRow
								key={friend.id}
								grid={grid}
								count={numberSpaces(friend.x)}
								href={`https://vk.ru/id${friend.id}`}
								avatar={<Photo src={friend.photo ?? CAMERA_PHOTO} size={32} />}
								columns={[
									{ title: friend.name },
									{ title: numberSpaces(friend.dmg) },
									{ title: numberSpaces(friend.hp) },
									{ title: numberSpaces(friend.lvl) },
									...(isDesktop
										? [
												{
													title: new Date(friend.active[1]).toLocaleString('ru', {
														year: 'numeric',
														month: 'numeric',
														day: 'numeric',
														hour: 'numeric',
														minute: 'numeric',
													}),
												},
											]
										: []),
								]}
							/>
						))
					: Array.from({ length: isDesktop ? 10 : 50 }, (_, x) => (
							<TableStatic key={x} grid={grid}>
								<Skeleton height={16} />
								<Skeleton height={32} borderRadius="50%" />
								<Skeleton height={16} />
								<Skeleton height={16} />
								<Skeleton height={16} />
								<Skeleton height={16} />
								{isDesktop && <Skeleton height={16} />}
							</TableStatic>
						))}
			</ScrollBox>
		</WikiPanel>
	);
}

/** Один и тот же пустой список: селектор, каждый раз возвращающий новый `[]`, зациклил бы перерисовку. */
const NO_USERS: VKUser[] = [];

interface Donor extends VKUser {
	fromDonut: boolean;
	fromService: boolean;
}

/** 4. Доны: подписчики VK Donut (только для владельца приложения). */
export function DonorsPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const raw: VKUser[] = useSession((s) => s.donutUsers?.response?.items ?? NO_USERS);

	// Один пользователь может быть в списке дважды (обычная подписка и через сервис); у подписчиков сервиса есть пол
	const donors = useMemo(() => {
		// Записи одного пользователя собираются за один проход, а не поиском по всему списку для каждого
		const groups = new Map<string | number, VKUser[]>();
		for (const user of raw) groups.set(user.id, [...(groups.get(user.id) ?? []), user]);
		const list: Donor[] = [];
		for (const same of groups.values()) {
			const user = same[0]!;
			const both = same.length === 2;
			list.push({ ...user, fromDonut: both || !('sex' in user), fromService: both || 'sex' in user });
		}
		const rank = (user: Donor) => (user.fromDonut && user.fromService ? 1 : user.fromService ? 2 : 3);
		return list.sort((a, b) => (rank(a) < rank(b) ? -1 : 1));
	}, [raw]);

	const grid: CSSProperties = isDesktop
		? { gridTemplateColumns: '32px 32px 30% calc(75% - 30% - 32px - 32px) auto', gap: 8 }
		: { gridTemplateColumns: '32px 32px 30% auto', gap: 16 };
	const kind = (user: Donor) => `${user.fromDonut ? 'стандартная' : ''}${user.fromDonut && user.fromService ? ' + ' : ''}${user.fromService ? 'системная' : ''}`;

	if (!donors.length) {
		return (
			<WikiPanel {...base(id, 'Доны', 28)}>
				<Placeholder
					icon={<Icon56DonateOutline width={56} height={56} style={{ color: '#ffae26' }} />}
					title="VK Donut"
					action={
						<Button href="https://vk.ru/donut/wiki.warlord" size="m" mode="commerce">
							Узнать подробнее
						</Button>
					}
				>
					Донов пока нет,
					<br />
					но ты можешь быть первым
				</Placeholder>
			</WikiPanel>
		);
	}

	return (
		<WikiPanel
			{...base(id, 'Доны', 28)}
			top={
				<div className={styles.head}>
					<TableStatic grid={grid}>
						<TableHead>#</TableHead>
						<div className={styles.avatarSpace} />
						<TableHead>имя</TableHead>
						<TableHead right>подписка</TableHead>
						{/* Как в старом: заголовок «id» есть и на телефоне, хотя колонки там нет */}
						<TableHead right>id</TableHead>
					</TableStatic>
				</div>
			}
		>
			<ScrollBox height={392}>
				{donors.map((user, x) => (
					<TableRow
						key={user.id}
						grid={grid}
						count={numberSpaces(x + 1)}
						href={`https://vk.ru/id${user.id}`}
						avatar={<Photo src={user.photo_200 ?? CAMERA_PHOTO} size={32} />}
						columns={[{ title: `${user.first_name} ${user.last_name}` }, { title: kind(user), right: true }, ...(isDesktop ? [{ title: user.id, right: true }] : [])]}
					/>
				))}
			</ScrollBox>
		</WikiPanel>
	);
}
