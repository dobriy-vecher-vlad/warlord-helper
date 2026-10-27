import { numberSpaces } from '../../lib/format';
import { useBattleSync } from '../../profile/invites/battleFlow';
import { participantAvatar, participantName, useBattleSession } from '../../profile/invites/battleStore';
import { backModal, type ModalEntry } from '../../store/modal';
import { ClassicModal, ModalBack } from '../ClassicModal';
import { Bar, PlayerList, partStyles as styles, type PlayerRow } from './BattleParts';
import { MAX_PLAYERS } from './InviteModal';

/** Данные окна после боя: участники уже известны, бой закончен. Без них окно показывает идущий бой. */
export interface FinalParticipantsData {
	rows: PlayerRow[];
	meId: number;
}

/**
 * Окно участников боя: все игроки по урону, как в игре. Идущий бой в нём обновляется сам (победа или гибель открывают итоги),
 * после боя (из окна итогов) показывается готовый список, здоровье босса не выводится: он побеждён.
 */
export function ParticipantsModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const session = useBattleSession();
	const final = (entry?.data as Partial<FinalParticipantsData> | undefined)?.rows ? (entry?.data as unknown as FinalParticipantsData) : null;
	useBattleSync(open && !final);
	const rows: PlayerRow[] | undefined =
		final?.rows ??
		session?.battle.participants.map((participant) => ({
			id: participant.id,
			name: participantName(session, participant),
			avatar: participantAvatar(session, participant),
			damage: participant.damage,
		}));
	const meId = final?.meId ?? session?.me.id;
	if (!rows || meId === undefined) return null;
	const battle = final ? null : session?.battle;
	return (
		<ClassicModal id="participants" open={open} onClose={backModal} title="Участники" before={<ModalBack onClick={backModal} />}>
			<div className={styles.body}>
				{battle && (
					<Bar label="Здоровье босса" value={`${numberSpaces(Math.max(battle.hp, 0))} из ${numberSpaces(battle.maxHp)}`} percent={(Math.max(battle.hp, 0) / battle.maxHp) * 100} />
				)}
				<Bar label="Игроков в бою" value={`${rows.length} из ${MAX_PLAYERS}`} percent={(rows.length / MAX_PLAYERS) * 100} />
				<PlayerList rows={rows} meId={meId} all />
			</div>
		</ClassicModal>
	);
}
