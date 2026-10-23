import { useState } from 'react';
import { FormStatus } from '../../components/form/Form';
import { FooterButton } from '../../components/profile/BotBlocks';
import { getTime, numberSpaces } from '../../lib/format';
import { CardGrid, DescriptionCard } from '../../components/wiki/Description';
import type { RewardLine } from '../../profile/bots/reward';
import { createBattle, showBattle, useInvitesContext } from '../../profile/invites/battleStore';
import { useBosses } from '../../profile/invites/bosses';
import { backModal, closeModal, openModal, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import { BossCell, Stat, partStyles as styles, type PlayerRow } from './BattleParts';
import { useBossStats } from './useBossStats';
import type { FinalParticipantsData } from './ParticipantsModal';

/** Данные окна итогов: босс, участники боя с уроном и награда игрока. */
export interface BattleResultData {
	npc: number;
	rows: PlayerRow[];
	meId: number;
	lines: RewardLine[];
	/** Вышло время боя: босс не побеждён, награды нет */
	timeout?: boolean;
}

/**
 * Окно итогов боя: босс, участники с уроном и награда (даже если босса добил другой игрок).
 * «Повторить» создаёт такой же бой с этим боссом от лица профиля.
 */
export function BattleResultModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as BattleResultData | undefined;
	const bosses = useBosses(open);
	const context = useInvitesContext();
	const { info, player, wait } = useBossStats(open, data?.npc);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	if (!data) return null;
	const boss = bosses?.get(data.npc) ?? null;
	// Создать бой можно только с общими и одиночными боссами (тип 1); с рейдовыми, боссами гильдии, так нельзя
	const canRepeat = context?.npcs.get(data.npc)?.type === 1;

	const repeat = async () => {
		setBusy(true);
		setError(null);
		const result = await createBattle(data.npc, boss?.energy ?? 0);
		setBusy(false);
		if (!result.ok) return setError(result.message);
		closeModal();
		showBattle(result);
	};

	return (
		<ClassicModal id="battleResult" open={open} onClose={backModal} title="Бой завершён">
			<div className={styles.body}>
				<section className={styles.section}>
					<BossCell boss={boss} title={boss?.name ?? `Босс №${data.npc}`} />
				</section>
				<section className={styles.section}>
					<FooterButton stretched mode="secondary" onClick={() => openModal('participants', { rows: data.rows, meId: data.meId } satisfies FinalParticipantsData, 'participants')}>
						Все участники
					</FooterButton>
				</section>
				<section className={styles.section}>
					<div className={styles.pair}>
						<Stat label="Попытки" value={info && boss ? `${info.left} / ${boss.tries}` : '…'} corner={wait ? getTime(wait) : undefined} />
						<Stat label="Энергия" value={`${boss?.energy ?? 0} / ${player === null ? '…' : numberSpaces(player.energy)}`} />
					</div>
				</section>
				<section className={styles.section}>
					{data.lines.length ? (
						<CardGrid>
							{data.lines.map((line, index) => (
								<DescriptionCard key={index} label={line.message} text={line.title} avatar={line.avatar} />
							))}
						</CardGrid>
					) : (
						<div className={styles.empty}>{data.timeout ? 'Время боя вышло: награды нет' : 'Награды за этот бой нет'}</div>
					)}
				</section>
				{error && (
					<FormStatus mode="error" header="Не удалось создать бой">
						{error}
					</FormStatus>
				)}
				{canRepeat && (
					<div className={styles.actions}>
						<FooterButton stretched mode="primary" loading={busy} disabled={busy} onClick={() => void repeat()}>
							Повторить бой
						</FooterButton>
					</div>
				)}
			</div>
		</ClassicModal>
	);
}
