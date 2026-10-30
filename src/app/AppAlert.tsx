import { Alert, ConfigProvider, useConfigProvider, type AlertProps } from '@vkontakte/vkui';
import { FooterButton } from '../components/form/FooterButton';
import { useIsDesktop } from './layout';
import styles from './AppAlert.module.css';

/** Кнопка алерта: «отмена» вторичная, «опасная» красная, остальные основные. */
const MODES = { cancel: 'secondary', destructive: 'destructive', default: 'primary' } as const;

/**
 * Алерт приложения: окно VKUI Alert с платформой vkcom (остальное приложение на ios, где Alert рисуется не так, как нужно), но с видом
 * модалок: заголовок и текст как в окнах, кнопки как в нижней панели бота (`FooterButton`: размер S со своей минимальной высотой).
 */
export function AppAlert({ title, description, actions, onClose }: { title: string; description?: string; actions: NonNullable<AlertProps['actions']>; onClose: () => void }) {
	const config = useConfigProvider();
	const isDesktop = useIsDesktop();
	return (
		<ConfigProvider {...config} platform="vkcom">
			<Alert
				className={styles.alert}
				// На телефоне крестик выходит за границу окна: там закрывает «Отмена» и нажатие вне окна
				dismissButtonMode={isDesktop ? undefined : 'none'}
				title={<span className={styles.title}>{title}</span>}
				description={description ? <span className={styles.text}>{description}</span> : undefined}
				actions={actions}
				renderAction={({ mode, children, onClick }) => (
					<FooterButton mode={MODES[mode]} onClick={onClick as () => void}>
						{children}
					</FooterButton>
				)}
				onClose={onClose}
				onClosed={() => undefined}
			/>
		</ConfigProvider>
	);
}
