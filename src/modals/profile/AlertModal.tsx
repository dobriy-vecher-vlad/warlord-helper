import { ModalPage } from '@vkontakte/vkui';
import { Button } from '../../components/form/Form';
import { Divider } from '../../components/Divider';
import { backModal, type ModalEntry } from '../../store/modal';
import { useSheetHeight } from '../useSheetHeight';
import styles from './AlertModal.module.css';
import { useModalMotion } from '../useModalMotion';

interface AlertData {
	header?: string;
	subheader?: string;
}

/** Окно ошибки: картинка, текст и кнопка «Сообщить об ошибке» (alert в старом приложении). */
export function AlertModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = (entry?.data ?? {}) as AlertData;
	const { ref, sheetProps } = useSheetHeight(open, 0);
	const motion = useModalMotion();
	return (
		<ModalPage id="alert" open={open} onClose={backModal} size={420} {...motion} {...sheetProps}>
			<div ref={ref} className={styles.body}>
				<div className={styles.image} />
				<div className={styles.divider}>
					<Divider size={12} />
				</div>
				<div className={styles.title}>{data.header ?? 'Неизвестная ошибка'}</div>
				<div className={styles.text}>{data.subheader ?? 'Обновите приложение'}</div>
				<div className={styles.actions}>
					<Button stretched href="https://vk.com/im?media=&sel=-138604865">
						Сообщить об ошибке
					</Button>
				</div>
			</div>
		</ModalPage>
	);
}
