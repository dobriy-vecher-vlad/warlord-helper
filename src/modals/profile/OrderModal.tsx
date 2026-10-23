import { useEffect, useState } from 'react';
import { Cell, List } from '@vkontakte/vkui';
import { Icon28CrownOutline } from '@vkontakte/icons';
import { SERVERS, findServer } from '../../api/servers';
import { numberForm } from '../../lib/format';
import { CAMERA_PHOTO } from '../../profile/constants';
import { deletedCount, refreshProfiles, saveOrder } from '../../profile/profileActions';
import { useSession, type ProfileSlot, type ProfileView } from '../../profile/session';
import { backModal } from '../../store/modal';
import { ClassicModal, ModalSubmit, ModalTextButton } from '../ClassicModal';
import styles from './SettingsModals.module.css';
import { Photo } from '../../components/Photo';

/** «Редактирование»: порядок и удаление дополнительных профилей. Основной профиль всегда первый. */
export function OrderModal({ open }: { open: boolean }) {
	const storeProfiles = useSession((s) => s.profiles);
	const storeProfilesFull = useSession((s) => s.profilesFull);
	const size = useSession((s) => s.size);
	const [profiles, setProfiles] = useState<ProfileSlot[]>([]);
	const [profilesFull, setProfilesFull] = useState<ProfileView[]>([]);
	const [deleted, setDeleted] = useState<number | undefined>(undefined);
	const [deletedNow, setDeletedNow] = useState(0);

	useEffect(() => {
		if (!open) return;
		setProfiles(storeProfiles.filter((profile) => profile.id && !profile.main));
		setProfilesFull(storeProfilesFull.filter((profile) => profile.id && !profile.main));
		setDeleted(undefined);
		setDeletedNow(0);
		void deletedCount().then(setDeleted);
		// Список берётся один раз при открытии окна
	}, [open]);

	const total = (deleted ?? 0) + deletedNow;
	const remove = (x: number) => {
		if (total > 5) return;
		setDeletedNow(deletedNow + 1);
		setProfiles(profiles.filter((_, i) => i !== x));
		setProfilesFull(profilesFull.filter((_, i) => i !== x));
	};
	const reorder = ({ from, to }: { from: number; to: number }) => {
		const move = <T,>(list: T[]) => {
			const next = [...list];
			next.splice(from, 1);
			next.splice(to, 0, list[from] as T);
			return next;
		};
		setProfiles(move(profiles));
		setProfilesFull(move(profilesFull));
	};
	const save = async () => {
		if (await saveOrder(profiles, deletedNow)) {
			backModal();
			void refreshProfiles();
		}
	};
	const left = total <= 5 ? 6 - total : 0;

	return (
		<ClassicModal
			id="settingsOrder"
			open={open}
			onClose={backModal}
			title="Редактирование"
			before={<ModalTextButton onClick={backModal}>Отмена</ModalTextButton>}
			after={<ModalSubmit onClick={() => void save()} />}
		>
			<div className={styles.orderBody}>
				<List>
					{profilesFull.length
						? profilesFull.map((profile, x) => {
								if (deleted === undefined) return <div key={x} className={styles.skeleton} />;
								const server = findServer(profile.server ?? 1) ?? SERVERS[0]!;
								return (
									<Cell
										key={`${profile.id}-${x}`}
										mode={total <= 5 ? 'removable' : undefined}
										removePlaceholder="Удалить профиль"
										subtitle={`${server.name}, ${server.company}`}
										draggable={profilesFull.length >= 2}
										hoverMode="none"
										activeMode="none"
										before={<Photo src={profile.photo_100 || CAMERA_PHOTO} size={48} />}
										onRemove={() => remove(x)}
										onDragFinish={reorder}
									>
										{profile.first_name} {profile.last_name}
									</Cell>
								);
							})
						: storeProfilesFull
								.filter((profile) => profile.main)
								.map((profile, x) => {
									const server = findServer(profile.server ?? 1) ?? SERVERS[0]!;
									return (
										<Cell
											key={x}
											disabled
											subtitle={`${server.name}, ${server.company}`}
											before={<Photo src={profile.photo_100 || CAMERA_PHOTO} size={48} />}
											after={<Icon28CrownOutline />}
										>
											{profile.first_name} {profile.last_name}
										</Cell>
									);
								})}
				</List>
				<div className={styles.footer}>
					{profiles.length + 1} из {size} {numberForm(size, ['слот', 'слота', 'слотов'])},
					<br />
					возможно удалить {left} {numberForm(left, ['профиль', 'профиля', 'профилей'])}
				</div>
			</div>
		</ClassicModal>
	);
}
