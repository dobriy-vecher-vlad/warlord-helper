import { Divider } from '../../components/Divider';
import { backModal, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import styles from './AlertModal.module.css';
import { FooterButton } from '../../components/form/FooterButton';

interface AlertData {
	header?: string;
	subheader?: string;
}

/** Окно ошибки без заголовка (на телефоне только крестик): картинка, текст и кнопка «Сообщить об ошибке» (alert в старом приложении). */
export function AlertModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = (entry?.data ?? {}) as AlertData;
	return (
		<ClassicModal id="alert" open={open} onClose={backModal}>
			<div className={styles.body}>
				<div className={styles.image} />
				<div className={styles.divider}>
					<Divider size={12} />
				</div>
				<div className={styles.title}>{data.header ?? 'Неизвестная ошибка'}</div>
				<div className={styles.text}>{data.subheader ?? 'Обновите приложение'}</div>
				<div className={styles.actions}>
					<FooterButton stretched href="https://vk.ru/im?media=&sel=-138604865">
						Сообщить об ошибке
					</FooterButton>
				</div>
			</div>
		</ClassicModal>
	);
}
