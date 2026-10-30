import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';
import { FooterButton } from '../components/form/FooterButton';

interface ErrorBoundaryProps {
	children: ReactNode;
}

/**
 * Ошибка при отрисовке любого компонента не должна оставлять пустой экран: показывается сообщение с кнопкой,
 * которая перезагружает приложение. Ссылка в адресной строке сохраняется, поэтому открывается тот же раздел.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error(error, info.componentStack);
	}

	render() {
		if (!this.state.failed) return this.props.children;
		return (
			<div className={styles.error}>
				<div className={styles.title}>Что-то пошло не так</div>
				<div className={styles.text}>Приложение столкнулось с ошибкой. Попробуйте обновить страницу.</div>
				<FooterButton mode="primary" onClick={() => window.location.reload()}>
					Обновить
				</FooterButton>
			</div>
		);
	}
}
