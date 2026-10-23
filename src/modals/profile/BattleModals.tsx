import type { ModalEntry } from '../../store/modal';
import { BattleModal } from './BattleModal';
import { BattleResultModal } from './BattleResultModal';
import { CreateModal } from './CreateModal';
import { InviteModal } from './InviteModal';
import { ParticipantsModal } from './ParticipantsModal';

/** Окна вкладки «Боссы» в одном файле: грузятся при первом открытии или заранее, когда открыта страница вкладки. */
export function BattleModals({
	invite,
	create,
	participants,
	result,
	battleOpen,
}: {
	invite: { open: boolean; entry: ModalEntry | null };
	create: { open: boolean; entry: ModalEntry | null };
	participants: { open: boolean; entry: ModalEntry | null };
	result: { open: boolean; entry: ModalEntry | null };
	battleOpen: boolean;
}) {
	return (
		<>
			<InviteModal open={invite.open} entry={invite.entry} />
			<BattleModal open={battleOpen} />
			<ParticipantsModal open={participants.open} entry={participants.entry} />
			<CreateModal open={create.open} entry={create.entry} />
			<BattleResultModal open={result.open} entry={result.entry} />
		</>
	);
}
