import { Suspense, lazy, useRef } from 'react';
import type { ItemRef } from '../lib/items';
import { renderDescription, type DescriptionData } from '../modals/descriptions';
import { ItemModalWindow } from '../modals/ItemModalWindow';
import { ModalShell } from '../modals/ModalShell';
import { NewBossModal } from '../modals/NewBossModal';
import { PromoModals } from '../modals/PromoModals';
import { AlertModal } from '../modals/profile/AlertModal';
import { OrderModal } from '../modals/profile/OrderModal';
import { IdModal, LoginModal, PasswordModal, ServerModal } from '../modals/profile/SettingsFieldModals';
import { SettingsModal } from '../modals/profile/SettingsModals';
import { backModal, useActiveModal, useAnyModal, type ModalEntry } from '../store/modal';
import styles from './Modals.module.css';

/**
 * Окна анализа (сезоны арены и ивенты) нужны не сразу и тянут за собой каталог предметов, поэтому грузятся отдельным файлом:
 * при первом открытии или заранее, когда браузер свободен (preloadAnalysisModals).
 */
const loadAnalysis = () => import('../modals/profile/AnalysisModals').then((module) => ({ default: module.AnalysisModals }));
const AnalysisModals = lazy(loadAnalysis);
export const preloadAnalysisModals = () => void loadAnalysis().catch(() => undefined);

/** Окна вкладки «Боссы» тоже грузятся отдельным файлом: при первом открытии или заранее (preloadBattleModals). */
const loadBattle = () => import('../modals/profile/BattleModals').then((module) => ({ default: module.BattleModals }));
const BattleModals = lazy(loadBattle);
export const preloadBattleModals = () => void loadBattle().catch(() => undefined);
const BATTLE_IDS = ['invite', 'battle', 'participants', 'create', 'battleResult'];

/** Данные окна сохраняются, пока оно закрывается, чтобы содержимое не пропадало во время анимации. */
function useLastEntry(id: ModalEntry['id']) {
	const active = useActiveModal();
	const last = useRef<ModalEntry | null>(null);
	if (active?.id === id) last.current = active;
	return { open: active?.id === id, entry: last.current };
}

function DescriptionModal() {
	const { open, entry } = useLastEntry('description');
	if (!entry) return null;
	const data = entry.data as unknown as DescriptionData;
	const content = renderDescription(data);
	if (!content) return null;
	return (
		<ModalShell id="description" open={open} onClose={backModal} head={{ ...content.head, link: data.link }}>
			{content.body}
		</ModalShell>
	);
}

function ItemModal() {
	const { open, entry } = useLastEntry('item');
	return <ItemModalWindow open={open} item={entry ? (entry.data.ref as ItemRef) : null} />;
}

/** Окна профиля: настройки входа и ошибка. */
function ProfileModals() {
	const settings = useLastEntry('settings');
	const alert = useLastEntry('alert');
	const invite = useLastEntry('invite');
	const result = useLastEntry('battleResult');
	const create = useLastEntry('create');
	const participants = useLastEntry('participants');
	const active = useActiveModal();
	// После первого открытия окна анализа остаются в разметке: иначе закрытие не получило бы анимации
	const analysisWanted = useRef(false);
	if (active?.id === 'arenaItems' || active?.id === 'eventsItems') analysisWanted.current = true;
	const battleWanted = useRef(false);
	if (active && BATTLE_IDS.includes(active.id)) battleWanted.current = true;
	return (
		<>
			{analysisWanted.current && (
				<Suspense fallback={null}>
					<AnalysisModals active={active?.id} />
				</Suspense>
			)}
			<SettingsModal open={settings.open} entry={settings.entry} />
			<IdModal open={active?.id === 'settingsId'} />
			<LoginModal open={active?.id === 'settingsLogin'} />
			<PasswordModal open={active?.id === 'settingsPassword'} />
			<ServerModal open={active?.id === 'settingsServer'} />
			<OrderModal open={active?.id === 'settingsOrder'} />
			<AlertModal open={alert.open} entry={alert.entry} />
			{battleWanted.current && (
				<Suspense fallback={null}>
					<BattleModals invite={invite} create={create} participants={participants} result={result} battleOpen={active?.id === 'battle'} />
				</Suspense>
			)}
		</>
	);
}

/** Окно калькулятора боссов. */
function BossModals() {
	const active = useActiveModal();
	return <NewBossModal open={active?.id === 'newBoss'} />;
}

/** Затемнение экрана под окнами: одно на весь стек окон, появляется с первым окном и уходит с последним; нажатие закрывает верхнее окно. */
function ModalOverlayLayer() {
	const visible = useAnyModal();
	return <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} onClick={backModal} />;
}

/** Все модальные окна приложения. Активное — верхнее в стеке. */
export function Modals() {
	return (
		<>
			<ModalOverlayLayer />
			<DescriptionModal />
			<ItemModal />
			<PromoModals />
			<BossModals />
			<ProfileModals />
		</>
	);
}
