import { useEffect, useMemo } from 'react';
import { Icon56UsersOutline } from '@vkontakte/icons';
import { FooterButton } from '../../components/profile/BotBlocks';
import { Placeholder } from '../../components/profile/Placeholder';
import { ScrollBox } from '../../components/profile/ScrollBox';
import { Skeleton } from '../../components/Skeleton';
import { NavCell } from '../../components/wiki/NavCell';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { compactNumber, numberSpaces } from '../../lib/format';
import { Divider } from '../../components/Divider';
import type { InviteModalData } from '../../modals/profile/InviteModal';
import { preloadBattleModals } from '../../app/Modals';
import { loadBossesWhitelist } from '../../profile/invites/killAccess';
import { SoloSlot } from '../../modals/profile/BattleParts';
import { canKillAlone } from '../../profile/invites/battle';
import { openCurrentBattle, useInvitesContext } from '../../profile/invites/battleStore';
import { useBosses } from '../../profile/invites/bosses';
import type { Invite } from '../../profile/invites/invites';
import { hasPlayers } from '../../profile/invites/realms';
import { useInvites } from '../../profile/invites/useInvites';
import { currentProfile, useSession } from '../../profile/session';
import { openModal } from '../../store/modal';
import { notify } from '../../app/notify';
import { openPanel } from '../../store/nav';
import { sectionBase } from '../section';
import styles from './InvitesPanel.module.css';

const base = sectionBase('profile', 'Мой профиль');

/** 11. Приглашения: друзья зовут на помощь в бою с боссом. Работает только на серверах ВКонтакте (кооперативные бои). */
export function InvitesPanel({ id }: { id: string }) {
	const server = useSession((state) => currentProfile(state)?.server ?? 1);
	if (!hasPlayers(server)) {
		return (
			<WikiPanel {...base(id, 'Боссы', 29)}>
				<Placeholder icon={<Icon56UsersOutline />} title="Недоступно">
					Приглашения в бой есть только на серверах ВКонтакте: на остальных боссы одиночные
				</Placeholder>
			</WikiPanel>
		);
	}
	return <InvitesList id={id} />;
}

function InvitesList({ id }: { id: string }) {
	// Окна боёв подгружаются заранее, пока открыта страница
	useEffect(preloadBattleModals, []);
	// Белый список для Kill нужен только в бою: запрашивается при открытии страницы боссов, к бою он уже готов
	useEffect(() => void loadBossesWhitelist(), []);
	const { invites, failed, loading, players, refresh } = useInvites();
	const bosses = useBosses();
	const context = useInvitesContext();
	const current = context?.current;
	const battle = current?.battle;
	const me = context?.player;
	const fightId = battle?.fightId;
	// Строки списка пересчитываются только когда изменились приглашения, боссы, игроки, персонаж или бой: переключение «загрузки» их не трогает
	const list = useMemo(() => {
		if (invites === null || bosses === null) return null;
		// Приглашение в бой, в котором игрок уже участвует, из списка уходит
		const visible = invites.filter((invite) => invite.fightId !== fightId);
		// Метка SOLO у части строк: у остальных на её месте пустое поле, чтобы число игроков справа не гуляло
		const isSolo = (invite: Invite) => {
			const boss = bosses.get(invite.npc);
			return !!boss && !!me && canKillAlone(boss, me.fighter, me.maxHp);
		};
		const anySolo = visible.some(isSolo);
		const nodes = visible.map((invite) => {
			const boss = bosses.get(invite.npc);
			const nameOf = (uid: number, own = '') => own || players?.byId.get(uid)?.name || `Player${uid}`;
			const first = nameOf(invite.uid, invite.name);
			// На один бой могут звать несколько игроков: показываем одного и сколько ещё
			const inviter = invite.others.length ? `Позвали ${first} и ещё ${invite.others.length}` : `Позвал ${first}`;
			return (
				<NavCell
					key={invite.id}
					image={boss?.icon ?? 'bosses/icons/0.png'}
					title={boss?.name ?? `Босс №${invite.npc}`}
					subtitle={inviter}
					badge={<SoloSlot solo={isSolo(invite)} reserve={anySolo} />}
					count={numberSpaces(invite.players)}
					countLabel="в бою"
					onClick={() => openModal('invite', { invite, boss: boss ?? null, inviter } satisfies InviteModalData, invite.id)}
				/>
			);
		});
		return { count: visible.length, nodes };
	}, [invites, bosses, players, me, fightId]);

	// О сбое опроса сообщает уведомление (один раз при переходе в сбой), а не подпись на странице
	useEffect(() => {
		if (failed) notify({ text: 'Не удалось обновить список приглашений, повторим через минуту', icon: 'error' });
	}, [failed]);

	return (
		<WikiPanel
			{...base(id, 'Боссы', 29)}
			bottom={
				<div className={styles.footer}>
					<div className={styles.buttons}>
						<FooterButton stretched mode="primary" onClick={() => openPanel('12')}>
							Создать
						</FooterButton>
						<FooterButton stretched mode="secondary" loading={loading} disabled={loading} onClick={() => void refresh()}>
							Обновить
						</FooterButton>
					</div>
				</div>
			}
		>
			{battle && (
				<>
					<NavCell
						image={bosses?.get(battle.npc)?.icon ?? 'bosses/icons/0.png'}
						title={bosses?.get(battle.npc)?.name ?? `Босс №${battle.npc}`}
						subtitle={`Текущий бой · ${compactNumber(Math.max(battle.hp, 0))} / ${compactNumber(battle.maxHp)}`}
						badge={<SoloSlot solo={!!current && !!me && canKillAlone({ hp: battle.maxHp, dmg: battle.bossDmg }, current.fighter, me.maxHp)} reserve={false} />}
						count={numberSpaces(battle.participants.length)}
						countLabel="в бою"
						onClick={() => void openCurrentBattle()}
					/>
					<Divider />
				</>
			)}
			{list === null ? (
				<div data-fill className={`${styles.emptyBox} ${styles.skeletonBox}`}>
					{Array.from({ length: 6 }, (_, index) => (
						<div key={index} className={styles.skeletonRow}>
							<Skeleton width={48} height={48} borderRadius={10} />
							<div className={styles.skeletonText}>
								<Skeleton width="46%" height={16} borderRadius={6} />
								<Skeleton width="30%" height={12} borderRadius={6} />
							</div>
						</div>
					))}
				</div>
			) : list.count === 0 ? (
				<Placeholder fill className={styles.emptyBox} icon={<Icon56UsersOutline />} title="Приглашений нет">
					Сейчас никто не зовёт в бой
				</Placeholder>
			) : (
				<ScrollBox height={battle ? 300 : 372}>{list.nodes}</ScrollBox>
			)}
		</WikiPanel>
	);
}
