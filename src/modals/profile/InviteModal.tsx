import { useRef, useState } from 'react';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { FormStatus } from '../../components/form/Form';
import { FooterButton } from '../../components/form/FooterButton';
import { ATTEMPTS_FROM, getTime, numberForm, numberSpaces } from '../../lib/format';
import { canKillAlone } from '../../profile/invites/battle';
import { acceptInvite, fetchInviteFight, requestInvitesRefresh, showBattle, useInvitesContext } from '../../profile/invites/battleStore';
import type { InviteBoss } from '../../profile/invites/bosses';
import type { Invite } from '../../profile/invites/invites';
import { backModal, backModalIf, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import { Bar, BossCell, Stat, partStyles as styles } from './BattleParts';
import { useFightStats } from './useBossStats';

/** Сколько игроков вмещает один бой. */
export const MAX_PLAYERS = 300;

/** Данные окна: приглашение, босс из справочника и подпись «кто зовёт»; действия берутся из хранилища боя. */
export interface InviteModalData {
	invite: Invite;
	boss: InviteBoss | null;
	/** Кто зовёт: «Позвал Имя» или «Позвали Имя и ещё N» */
	inviter: string;
}

/**
 * Окно приглашения: босс, здоровье, игроки, попытки и энергия, кнопка «Принять». «Принять» входит в бой и открывает окно боя.
 * Пока окно открыто, бой проверяется каждые 5 секунд: закончившийся бой делает приглашение устаревшим.
 */
export function InviteModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as InviteModalData | undefined;
	const invite = data?.invite;
	// info: undefined — загрузка, null — приглашение устарело
	const { info, player, wait } = useFightStats(open, invite?.id, async () => (invite ? fetchInviteFight(invite) : null));
	// Пока идёт бой, принять другое приглашение нельзя (в игре так же)
	const inBattle = !!useInvitesContext()?.current;
	// Ход действия относится к тому окну (данным), в котором начат: у заново открытого окна своего хода нет
	const [action, setAction] = useState<{ for: unknown; busy: boolean; error: string | null }>({ for: null, busy: false, error: null });
	// Нажатие, пока прежнее ещё выполняется, второго входа в бой не начинает
	const running = useRef(false);
	const own = action.for === data;
	const busy = own && action.busy;
	// Пока идёт вход в бой, закрытие окна и вкладки просят подтверждения: энергия уже может быть списана
	useLeaveGuard(busy, 'invite');
	const error = own ? action.error : null;

	if (!data || !invite) return null;
	const { boss } = data;
	const cost = boss?.energy ?? 0;
	const expired = info === null || (info !== undefined && info.hp <= 0);
	const hp = info ? Math.max(info.hp, 0) : 0;
	// Метка SOLO: по полному здоровью босса (без свитков и зелий, с навыками)
	const alone = player && boss ? canKillAlone(boss, player.fighter, player.maxHp) : null;

	const accept = async () => {
		if (running.current) return;
		running.current = true;
		setAction({ for: data, busy: true, error: null });
		try {
			const outcome = await acceptInvite(invite, cost);
			if (!outcome.ok) return setAction({ for: data, busy: false, error: outcome.message });
			setAction({ for: data, busy: false, error: null });
			requestInvitesRefresh();
			backModalIf('invite');
			showBattle(outcome);
		} finally {
			running.current = false;
		}
	};

	return (
		<ClassicModal id="invite" open={open} onClose={backModal} title="Приглашение">
			<div className={styles.body}>
				<section className={styles.section}>
					<BossCell boss={boss} title={boss?.name ?? `Босс №${invite.npc}`} subtitle={data.inviter} solo={alone === true && !expired} />
				</section>

				<section className={styles.section}>
					<Bar
						label="Здоровье"
						value={info === undefined ? undefined : info ? `${numberSpaces(hp)} из ${numberSpaces(info.maxHp)}` : 'Бой закончился'}
						percent={info ? (hp / info.maxHp) * 100 : 0}
					/>
					<Bar label="Игроков в бою" value={`${invite.players} из ${MAX_PLAYERS}`} percent={(invite.players / MAX_PLAYERS) * 100} />
				</section>

				<section className={styles.section}>
					<div className={styles.pair}>
						<Stat label={numberForm(boss?.tries ?? 0, ATTEMPTS_FROM)} value={info && boss ? `${info.left} из ${boss.tries}` : '…'} corner={wait ? getTime(wait) : undefined} />
						<Stat label="энергии" value={`${cost} из ${player === null ? '…' : numberSpaces(player.energy)}`} />
					</div>
				</section>

				{expired && (
					<FormStatus mode="error" header="Приглашение устарело">
						Бой с этим боссом уже закончился, принять приглашение нельзя
					</FormStatus>
				)}
				{inBattle && !expired && <FormStatus header="Вы уже в бою">Закончите текущий бой, чтобы принять приглашение</FormStatus>}
				{error && (
					<FormStatus mode="error" header="Не удалось принять приглашение">
						{error}
					</FormStatus>
				)}
				<div className={styles.actions}>
					{expired ? (
						<FooterButton stretched mode="secondary" onClick={backModal}>
							Закрыть
						</FooterButton>
					) : (
						<FooterButton stretched mode="commerce" loading={busy} disabled={busy || inBattle || info === undefined} onClick={() => void accept()}>
							Принять
						</FooterButton>
					)}
				</div>
			</div>
		</ClassicModal>
	);
}
