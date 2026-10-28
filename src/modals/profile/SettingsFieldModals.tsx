import { useState } from 'react';
import { Spacing } from '@vkontakte/vkui';
import { getGame } from '../../api/game';
import { SERVERS, findServer } from '../../api/servers';
import { Button, Field, FormStatus, Radio } from '../../components/form/Form';
import { setDraft, useSession } from '../../profile/session';
import { backModal } from '../../store/modal';
import { ClassicModal, ModalBack, ModalSubmit } from '../ClassicModal';
import styles from './SettingsModals.module.css';
import { ArticleCell } from './settingsShared';
import { useOnChange } from '../../lib/useOnChange';

/** Идентификатор профиля (число). */
export function IdModal({ open }: { open: boolean }) {
	const id = useSession((s) => s.draft.id);
	const [key, setKey] = useState<string>('');
	useOnChange([open, id], () => {
		if (open) setKey(id ? String(id) : '');
	});
	const valid = Number(key) != 0;
	const change = (value: string) => {
		// Как в старом: число от 1 до 999999999999, пустое поле разрешено
		if (value === '') return setKey('');
		setKey(String(Math.max(1, Math.min(999999999999, Number(value)))));
	};
	return (
		<ClassicModal
			id="settingsId"
			open={open}
			onClose={backModal}
			title="Идентификатор"
			before={<ModalBack onClick={backModal} />}
			after={
				<ModalSubmit
					disabled={!(Number(key) > 0)}
					onClick={() => {
						setDraft({ id: key });
						backModal();
					}}
				/>
			}
		>
			<div className={styles.body}>
				<Field
					label="Цифровой идентификатор профиля"
					status={valid ? 'valid' : 'error'}
					bottom={valid ? 'Идентификатор введён верно!' : 'Пожалуйста, введите идентификатор'}
					type="number"
					placeholder="id"
					value={key}
					onChange={change}
				/>
				<ArticleCell title="Получение идентификатора" anchor="navigatsia" />
			</div>
		</ClassicModal>
	);
}

/** Логин авторизации; кнопка «Проверить» показывает, на каких серверах есть персонаж. */
export function LoginModal({ open }: { open: boolean }) {
	const login = useSession((s) => s.draft.login);
	const serverId = useSession((s) => s.draft.server);
	const [key, setKey] = useState('');
	const [loading, setLoading] = useState(false);
	const [servers, setServers] = useState<{ uid: string; name: string }[] | string | null>(null);
	useOnChange([open, login], () => {
		if (open) {
			setKey(login ? String(login) : '');
			setServers(null);
		}
	});
	const value = key.trim();
	const server = serverId ? findServer(serverId) : null;

	const check = async () => {
		setLoading(true);
		const list = await getGame(serverId ?? 1, {}, { login: value }, 2, true);
		const found = Array.isArray(list) ? list.filter((item: { _uid: string }) => item._uid != '0') : [];
		setServers(found.length ? found.map((item: { _uid: string; _n: string }) => ({ uid: item._uid, name: item._n })) : value);
		setLoading(false);
	};

	return (
		<ClassicModal
			id="settingsLogin"
			open={open}
			onClose={backModal}
			title="Логин авторизации"
			before={<ModalBack onClick={backModal} />}
			after={
				<ModalSubmit
					disabled={!value.length}
					onClick={() => {
						setDraft({ login: value });
						backModal();
					}}
				/>
			}
		>
			<div className={styles.body}>
				<Field
					label="Логин авторизации игры"
					status={value.length ? 'valid' : 'error'}
					bottom={value.length ? 'Логин введён верно!' : 'Пожалуйста, введите логин'}
					placeholder="login_key"
					maxLength={44}
					value={key}
					onChange={setKey}
					aside={
						serverId ? (
							<Button mode="secondary" disabled={!value.length} loading={loading} onClick={() => void check()}>
								Проверить
							</Button>
						) : undefined
					}
				/>
				{servers && (
					<>
						<div className={styles.statusWrap}>
							<FormStatus header={`Сервера на сайте ${server?.company}`}>
								{Array.isArray(servers)
									? servers.map((item, x) => (
											<div key={x}>
												Логин {item.uid} на сервере {item.name}
											</div>
										))
									: `Логин ${servers} не существует`}
							</FormStatus>
						</div>
						<Spacing size={12} />
					</>
				)}
				<ArticleCell title="Получение логина" anchor="navigatsia" />
			</div>
		</ClassicModal>
	);
}

/** Пароль авторизации. */
export function PasswordModal({ open }: { open: boolean }) {
	const auth = useSession((s) => s.draft.auth);
	const [key, setKey] = useState('');
	useOnChange([open, auth], () => {
		if (open) setKey(auth ?? '');
	});
	const value = key.trim();
	return (
		<ClassicModal
			id="settingsPassword"
			open={open}
			onClose={backModal}
			title="Пароль авторизации"
			before={<ModalBack onClick={backModal} />}
			after={
				<ModalSubmit
					disabled={!value.length}
					onClick={() => {
						setDraft({ auth: value });
						backModal();
					}}
				/>
			}
		>
			<div className={styles.body}>
				<Field
					label="Пароль авторизации игры"
					status={value.length ? 'valid' : 'error'}
					bottom={value.length ? 'Пароль введён верно!' : 'Пожалуйста, введите пароль'}
					placeholder="password_key"
					value={key}
					onChange={setKey}
				/>
				<ArticleCell title="Получение пароля" anchor="navigatsia" />
			</div>
		</ClassicModal>
	);
}

/** Игровой сервер профиля. */
export function ServerModal({ open }: { open: boolean }) {
	const server = useSession((s) => s.draft.server);
	const [key, setKey] = useState(0);
	useOnChange([open, server], () => {
		if (open) setKey(server ?? 0);
	});
	const valid = Number(key) != 0;
	return (
		<ClassicModal
			id="settingsServer"
			open={open}
			onClose={backModal}
			title="Сервер"
			before={<ModalBack onClick={backModal} />}
			after={
				<ModalSubmit
					disabled={!(key > 0)}
					onClick={() => {
						setDraft({ server: key });
						backModal();
					}}
				/>
			}
		>
			<div className={styles.body}>
				<div className={styles.formItem}>
					<div className={styles.formTop}>Игровой сервер профиля</div>
					{SERVERS.map((item) => (
						<Radio key={item.id} checked={key === item.id} onChange={() => setKey(item.id)}>
							{item.name} <span className={styles.secondary}>на сайте {item.company}</span>
						</Radio>
					))}
					<div className={`${styles.formBottom} ${valid ? styles.valid : styles.error}`}>{valid ? 'Сервер выбран верно!' : 'Пожалуйста, выберите сервер'}</div>
				</div>
				<ArticleCell title="Выбор сервера" anchor="vybor-servera" />
			</div>
		</ClassicModal>
	);
}
