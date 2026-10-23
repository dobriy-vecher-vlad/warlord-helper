import { useEffect, useState } from 'react';
import { Spacing } from '@vkontakte/vkui';
import { Icon28FaceIdOutline, Icon28GlobeOutline, Icon28KeySquareOutline, Icon28WriteSquareOutline } from '@vkontakte/icons';
import { findServer } from '../../api/servers';
import { useIsDesktop } from '../../app/layout';
import { ActionCell, Button, FormStatus } from '../../components/form/Form';
import { addProfile, removeProfile, saveSettings } from '../../profile/profileActions';
import { useSession } from '../../profile/session';
import { backModal, openModal, type ModalEntry } from '../../store/modal';
import { ClassicModal, ModalDismiss } from '../ClassicModal';
import styles from './SettingsModals.module.css';
import { short } from './settingsShared';

interface SettingsData {
	mode?: 'add';
	header?: string;
	subheader?: string;
	error?: string;
}

/** «Настройки» профиля и «Новый профиль». */
export function SettingsModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const isDesktop = useIsDesktop();
	const data = (entry?.data ?? {}) as SettingsData;
	const draft = useSession((s) => s.draft);
	const profiles = useSession((s) => s.profiles);
	const index = useSession((s) => s.index);
	const isDonut = useSession((s) => s.isDonut);
	const [confirmDelete, setConfirmDelete] = useState(false);
	useEffect(() => {
		if (!open) setConfirmDelete(false);
	}, [open]);

	const add = data.mode === 'add';
	const exists = add && profiles.some((profile) => profile.id == Number(draft.id));
	const server = draft.server ? findServer(draft.server) : null;
	const current = profiles[index];

	return (
		<ClassicModal id="settings" open={open} onClose={backModal} title={add ? 'Новый профиль' : 'Настройки'} after={!isDesktop && <ModalDismiss onClick={backModal} />}>
			<div className={isDesktop ? styles.body : styles.bodyMobile}>
				{data.header && data.subheader && (
					<>
						<div className={styles.statusWrap}>
							<FormStatus mode="error" header={data.header}>
								{data.subheader}
							</FormStatus>
						</div>
						<Spacing size={12} />
						{data.error && (
							<>
								<div className={styles.statusWrap}>
									<FormStatus header="Ответ сервера">{data.error}</FormStatus>
								</div>
								<Spacing size={12} />
							</>
						)}
					</>
				)}
				<ActionCell
					icon={<Icon28FaceIdOutline />}
					title="Идентификатор"
					subtitle={exists ? <span className={styles.exists}>Уже существует</span> : undefined}
					indicator={draft.id ? String(draft.id).substring(0, 9) : 'установить'}
					disabled={!(Number(draft.id) == 0) && !add}
					onClick={() => openModal('settingsId')}
				/>
				<ActionCell icon={<Icon28WriteSquareOutline />} title="Логин авторизации" indicator={short(draft.login)} onClick={() => openModal('settingsLogin')} />
				<ActionCell icon={<Icon28KeySquareOutline />} title="Пароль авторизации" indicator={short(draft.auth)} onClick={() => openModal('settingsPassword')} />
				<ActionCell
					icon={<Icon28GlobeOutline />}
					title="Игровой сервер"
					indicator={server ? `${server.name}, ${server.company}` : 'выбрать'}
					onClick={() => openModal('settingsServer')}
				/>
				<div className={isDesktop ? styles.actions : styles.actionsMobile}>
					{add ? (
						<Button
							stretched
							mode="primary"
							disabled={exists || Number(draft.id) == 0 || draft.login == null || draft.auth == null || draft.server == null}
							onClick={() => void addProfile()}
						>
							Добавить профиль
						</Button>
					) : (
						<>
							<Button
								stretched
								mode="commerce"
								disabled={Number(draft.id) == 0 || draft.login == null || (isDonut && !current?.main && draft.auth == null)}
								onClick={() => void saveSettings()}
							>
								Сохранить изменения
							</Button>
							{profiles.length !== 0 && !current?.main && (
								<>
									<Spacing size={8} />
									{!confirmDelete ? (
										<Button stretched mode="tertiary" className={styles.danger} onClick={() => setConfirmDelete(true)}>
											Удалить профиль
										</Button>
									) : (
										<Button stretched mode="destructive" onClick={() => void removeProfile()}>
											Точно удалить профиль
										</Button>
									)}
								</>
							)}
						</>
					)}
				</div>
			</div>
		</ClassicModal>
	);
}
