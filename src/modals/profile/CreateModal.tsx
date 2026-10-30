import { useRef, useState } from 'react';
import { useLeaveGuard } from '../../lib/leaveGuard';
import { FormStatus } from '../../components/form/Form';
import { FooterButton } from '../../components/form/FooterButton';
import { ATTEMPTS_FROM, getTime, numberForm, numberSpaces } from '../../lib/format';
import { canKillAlone } from '../../profile/invites/battle';
import { createBattle, requestInvitesRefresh, showBattle, useInvitesContext } from '../../profile/invites/battleStore';
import type { InviteBoss } from '../../profile/invites/bosses';
import { backModal, backModalIf, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import { BossCell, Stat, partStyles as styles } from './BattleParts';
import { useBossStats } from './useBossStats';

/** Данные окна: выбранный босс из справочника. */
export interface CreateModalData {
	boss: InviteBoss;
}

/** Окно создания своего боя: босс, попытки и энергия, кнопка «Создать». После создания открывается окно боя поверх страницы выбора. */
export function CreateModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as CreateModalData | undefined;
	const { info, player, wait } = useBossStats(open, data?.boss.id);
	// Пока идёт бой, создать новый нельзя
	const context = useInvitesContext();
	const inBattle = !!context?.current;
	// Ход действия относится к тому окну (данным), в котором начат: у заново открытого окна своего хода нет
	const [action, setAction] = useState<{ for: unknown; busy: boolean; error: string | null }>({ for: null, busy: false, error: null });
	// Нажатие, пока прежнее ещё выполняется, второго входа в бой не начинает
	const running = useRef(false);
	const own = action.for === data;
	const busy = own && action.busy;
	// Пока бой создаётся, закрытие окна и вкладки просят подтверждения: энергия уже может быть списана
	useLeaveGuard(busy, 'create');
	const error = own ? action.error : null;

	if (!data) return null;
	const { boss } = data;
	// Метка SOLO: по полному здоровью босса (без свитков и зелий, с навыками)
	const alone = player ? canKillAlone({ hp: boss.hp, dmg: boss.dmg }, player.fighter, player.maxHp) : null;

	// Уровня персонажа не хватает для этого босса: сервер всё равно откажет, поэтому сразу говорим об этом
	const need = context?.npcs.get(boss.id)?.level ?? 0;
	const tooLow = !!player && player.level < need;

	const create = async () => {
		if (running.current) return;
		running.current = true;
		setAction({ for: data, busy: true, error: null });
		try {
			const result = await createBattle(boss.id, boss.energy);
			if (!result.ok) return setAction({ for: data, busy: false, error: result.message });
			setAction({ for: data, busy: false, error: null });
			requestInvitesRefresh();
			// Страница выбора остаётся на месте (список и прокрутка не сбрасываются), бой открывается поверх неё
			backModalIf('create');
			showBattle(result);
		} finally {
			running.current = false;
		}
	};

	return (
		<ClassicModal id="create" open={open} onClose={backModal} title="Создание боя">
			<div className={styles.body}>
				<section className={styles.section}>
					<BossCell boss={boss} title={boss.name} solo={alone === true} />
				</section>

				<section className={styles.section}>
					<div className={styles.pair}>
						<Stat label={numberForm(boss.tries, ATTEMPTS_FROM)} value={info ? `${info.left} из ${boss.tries}` : '…'} corner={wait ? getTime(wait) : undefined} />
						<Stat label="энергии" value={`${boss.energy} из ${player === null ? '…' : numberSpaces(player.energy)}`} />
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
