import { useState } from 'react';
import { FormStatus } from '../../components/form/Form';
import { FooterButton } from '../../components/profile/BotBlocks';
import { getTime, numberSpaces } from '../../lib/format';
import { canKillAlone } from '../../profile/invites/battle';
import { createBattle, requestInvitesRefresh, showBattle, useInvitesContext } from '../../profile/invites/battleStore';
import type { InviteBoss } from '../../profile/invites/bosses';
import { backModal, type ModalEntry } from '../../store/modal';
import { openPanel } from '../../store/nav';
import { ClassicModal } from '../ClassicModal';
import { BossCell, Stat, partStyles as styles } from './BattleParts';
import { useBossStats } from './useBossStats';

/** Данные окна: выбранный босс из справочника. */
export interface CreateModalData {
	boss: InviteBoss;
}

/** Окно создания своего боя: босс, попытки и энергия, кнопка «Создать». После создания открывается страница приглашений и окно боя. */
export function CreateModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as CreateModalData | undefined;
	const { info, player, wait } = useBossStats(open, data?.boss.id);
	// Пока идёт бой, создать новый нельзя
	const context = useInvitesContext();
	const inBattle = !!context?.current;
	// Ход действия относится к тому окну (данным), в котором начат: у заново открытого окна своего хода нет
	const [action, setAction] = useState<{ for: unknown; busy: boolean; error: string | null }>({ for: null, busy: false, error: null });
	const own = action.for === data;
	const busy = own && action.busy;
	const error = own ? action.error : null;

	if (!data) return null;
	const { boss } = data;
	// Метка SOLO: по полному здоровью босса (без свитков и зелий, с навыками)
	const alone = player ? canKillAlone({ hp: boss.hp, dmg: boss.dmg }, player.fighter, player.maxHp) : null;

	// Уровня персонажа не хватает для этого босса: сервер всё равно откажет, поэтому сразу говорим об этом
	const need = context?.npcs.get(boss.id)?.level ?? 0;
	const tooLow = !!player && player.level < need;

	const create = async () => {
		setAction({ for: data, busy: true, error: null });
		const result = await createBattle(boss.id, boss.energy);
		if (!result.ok) return setAction({ for: data, busy: false, error: result.message });
		setAction({ for: data, busy: false, error: null });
		requestInvitesRefresh();
		backModal();
		openPanel('11');
		showBattle(result);
	};

	return (
		<ClassicModal id="create" open={open} onClose={backModal} title="Создание боя">
			<div className={styles.body}>
				<section className={styles.section}>
					<BossCell boss={boss} title={boss.name} solo={alone === true} />
				</section>

				<section className={styles.section}>
					<div className={styles.pair}>
						<Stat label="Попытки" value={info ? `${info.left} / ${boss.tries}` : '…'} corner={wait ? getTime(wait) : undefined} />
						<Stat label="Энергия" value={`${boss.energy} / ${player === null ? '…' : numberSpaces(player.energy)}`} />
					</div>
				</section>

				{info === null && (
					<FormStatus mode="error" header="Нет данных о боссе">
						Откройте страницу приглашений и попробуйте ещё раз
					</FormStatus>
				)}
				{tooLow && (
					<FormStatus mode="error" header="Не хватает уровня">
						Нужен {need} уровень
					</FormStatus>
				)}
				{inBattle && <FormStatus header="Вы уже в бою">Закончите текущий бой, чтобы создать новый</FormStatus>}
				{error && (
					<FormStatus mode="error" header="Не удалось создать бой">
						{error}
					</FormStatus>
				)}
				<div className={styles.actions}>
					<FooterButton stretched mode="commerce" loading={busy} disabled={busy || inBattle || tooLow || !info} onClick={() => void create()}>
						Создать
					</FooterButton>
				</div>
			</div>
		</ClassicModal>
	);
}
