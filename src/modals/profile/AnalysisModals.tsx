import { useEffect, useState } from 'react';
import { Div } from '@vkontakte/vkui';
import { getGame } from '../../api/game';
import sadFace from '../../assets/sadFace.svg';
import { cropStyle } from '../../components/BorderedImage';
import { Skeleton } from '../../components/Skeleton';
import { ARENA_SEASONS, OTHER_EVENTS } from '../../lib/data';
import { numberForm } from '../../lib/format';
import { ITEMS, type Item } from '../../lib/items';
import { storageSet } from '../../lib/storage';
import { DEFAULT_AUTHORIZATION } from '../../profile/constants';
import { currentProfile, getSession, useSession } from '../../profile/session';
import { backModal } from '../../store/modal';
import styles from './AnalysisModals.module.css';
import { ClassicModal } from '../ClassicModal';
import { useOnChange } from '../../lib/useOnChange';
import { LargeImg } from '../../components/LargeImg';
import { FooterButton } from '../../components/form/FooterButton';

type Kind = 'arenaItems' | 'eventsItems';

/** Убирает из списка пустые значения и сообщает об этом типам. */
const present = <T,>(value: T | undefined): value is T => value !== undefined;

interface Result {
	/** Все предметы раздела с отметкой наличия (null — профиль не найден) */
	items: (Item & { is: boolean })[] | null;
	/** Сколько событий активировано (для ивентов) */
	events: number;
}

const ITEM_FORMS = ['предмет', 'предмета', 'предметов'] as const;
const EVENT_FORMS = ['событие', 'события', 'событий'] as const;
const SERVER_NAMES = ['Эрмун', 'Антарес'];
/** Всего событий во всех ивентах */
const EVENTS_TOTAL = OTHER_EVENTS.reduce((sum, event) => sum + event.items.length, 0);

const byIndex = (index: number) => ITEMS[index];

/** Предметы персонажа (игровые id) выбранного профиля; null — профиля нет на сервере. */
async function loadOwned(): Promise<number[] | null> {
	const profile = currentProfile();
	const user = getSession().user;
	if (!profile?.id) return null;
	const server = profile.server ?? 1;
	try {
		const hub = await getGame(server, {}, { login: profile.login || profile.id || user?.id, password: profile.auth || profile.id || user?.id }, 2);
		if (!hub?._uid || Number(hub._uid) === 0) return null;
		const game = await getGame(server, { i: 39, t: hub._uid }, DEFAULT_AUTHORIZATION[server - 1] ?? {});
		const list = Array.isArray(game?.i) ? game.i : game?.i ? [game.i] : [];
		if (!list.length) return null;
		return list.map((item: { _id: string }) => Number(item._id));
	} catch {
		return null;
	}
}

async function loadResult(kind: Kind): Promise<Result> {
	const data = await loadOwned();
	if (!data) return { items: null, events: 0 };
	const has = (item: Item) => data.includes(item.id);
	if (kind === 'arenaItems') {
		const items = ARENA_SEASONS.flatMap((season) => season.month.flatMap((month) => month.items.map((ref) => byIndex(ref.id))))
			.filter(present)
			.map((item) => ({ ...item, is: has(item) }));
		return { items, events: 0 };
	}
	let events = 0;
	const items: Result['items'] = [];
	for (const event of OTHER_EVENTS) {
		for (const part of event.items) {
			const current = part.items
				.map((ref) => byIndex(ref.id))
				.filter(present)
				.map((item) => ({ ...item, is: has(item) }));
			items.push(...current);
			if (current.some((item) => item.is)) events++;
		}
	}
	return { items, events };
}

/** Заглушка на время загрузки (как в старом окне). */
function Loading() {
	return (
		<div className={styles.loading}>
			<Skeleton width={150} height={30} style={{ marginTop: 12 }} />
			<Skeleton width={110} height={50} style={{ marginTop: 15 }} />
			<Skeleton width={100} height={25} style={{ marginTop: 15 }} />
			<Skeleton width={240} height={20} style={{ marginTop: 12 }} />
			<Skeleton width={260} height={25} style={{ marginTop: 24 }} />
			<Skeleton height={126} borderRadius={0} style={{ marginTop: 18, marginBottom: 12 }} />
		</div>
	);
}

/** Два ряда пропущенных предметов (5 и 6), края растворяются. */
function Missed({ items }: { items: Item[] }) {
	const cell = (index: number) => {
		const item = items[index];
		return (
			<div key={index} className={styles.cell}>
				<span className={`${styles.avatar} ${item ? 'ImageCrop' : styles.empty}`} style={item && cropStyle(item.icon)}>
					{item && <LargeImg src={item.icon} />}
				</span>
			</div>
		);
	};
	return (
		<div className={styles.missed}>
			<div className={styles.row}>{Array.from({ length: 5 }, (_, x) => cell(x))}</div>
			<div className={styles.row}>{Array.from({ length: 6 }, (_, x) => cell(x + 5))}</div>
		</div>
	);
}

/**
 * «Анализ сезонов» и «Анализ ивентов»: сколько предметов арены (событий) собрал выбранный профиль.
 * Любое закрытие (кнопка «Хорошо», крестик, свайп, тап по фону) запоминает, что окно показано (promo_2 / promo_4), и при запуске оно больше не открывается.
 */
function AnalysisModal({ id, open }: { id: Kind; open: boolean }) {
	const ready = useSession((s) => s.status === 'ready');
	const server = useSession((s) => currentProfile(s)?.server ?? 1);
	const [result, setResult] = useState<Result | null>(null);

	// Каждое открытие заново: прежний результат не показывается
	useOnChange([id, open, ready], () => setResult(null));
	useEffect(() => {
		if (!open || !ready) return;
		let alive = true;
		void loadResult(id).then((data) => alive && setResult(data));
		return () => {
			alive = false;
		};
	}, [id, open, ready]);

	const promoKey = id === 'arenaItems' ? 'promo_2' : 'promo_4';
	const done = () => {
		void storageSet(promoKey, 'true');
		backModal();
	};
	const serverName = SERVER_NAMES[server - 1];

	let content;
	if (!result) {
		content = <Loading />;
	} else if (!result.items) {
		content = (
			<div className={styles.error}>
				<img src={sadFace} alt="" />
				<div className={styles.errorTitle}>Произошла ошибка</div>
				<div className={styles.errorText}>Вашего профиля нет на сервере {serverName}</div>
			</div>
		);
	} else {
		const { items, events } = result;
		const owned = items.filter((item) => item.is).length;
		const missed = items.filter((item) => !item.is);
		const arena = id === 'arenaItems';
		content = (
			<div className={styles.body}>
				<div className={styles.title}>{arena ? 'Вы получили' : 'Вы активировали'}</div>
				<div className={styles.count}>{arena ? owned : events}</div>
				<div className={styles.countLabel}>{arena ? numberForm(owned, ITEM_FORMS) : numberForm(events, EVENT_FORMS)}</div>
				<div className={styles.text}>{arena ? `— это ${Math.floor((owned * 100) / items.length)}% от общего арсенала` : `и собрали ${owned} ${numberForm(owned, ITEM_FORMS)}`}</div>
				<div className={styles.subtitle}>
					{missed.length === 0 ? (
						'Поздравляем!'
					) : (
						<>
							Вы упустили {missed.length} {numberForm(missed.length, ITEM_FORMS)}
							{!arena && (
								<>
									<br />и {EVENTS_TOTAL - events} {numberForm(EVENTS_TOTAL - events, EVENT_FORMS)}
								</>
							)}
						</>
					)}
				</div>
				<Missed items={missed} />
			</div>
		);
	}

	const footer = (
		<Div>
			<FooterButton stretched onClick={done}>
				Хорошо
			</FooterButton>
		</Div>
	);
	return (
		<ClassicModal id={id} open={open} onClose={done} footer={footer}>
			{content}
		</ClassicModal>
	);
}

export function AnalysisModals({ active }: { active: string | undefined }) {
	return (
		<>
			<AnalysisModal id="arenaItems" open={active === 'arenaItems'} />
			<AnalysisModal id="eventsItems" open={active === 'eventsItems'} />
		</>
	);
}
