import { memo, useMemo, type ReactNode } from 'react';
import { Checkbox, HorizontalScroll, Input, PullToRefresh } from '@vkontakte/vkui';
import { Icon24ExternalLinkOutline } from '@vkontakte/icons';
import { BotFooter, type BotAction } from '../../../components/profile/BotBlocks';
import { ButtonCounter, FooterButton } from '../../../components/form/FooterButton';
import { ScrollBox } from '../../../components/profile/ScrollBox';
import { Skeleton } from '../../../components/Skeleton';
import { WikiPanel } from '../../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../../config';
import { getTime, numberSpaces } from '../../../lib/format';
import { RESOURCES, waiting, type CardKey, type Mode, resourceIcon } from './resourcesData';
import { useResourceBot } from './useResourceBot';
import styles from './ResourcesBotPanel.module.css';

/** Карточка действия: заголовок, таймер, описание и кнопки; недоступная — полупрозрачная с подсказкой поверх. */
function ActionCard({
	title,
	after,
	disabled,
	hint,
	children,
	bottom,
	extra,
}: {
	title: string;
	after?: ReactNode;
	disabled: boolean;
	hint: string | null;
	children: ReactNode;
	bottom: ReactNode;
	extra?: ReactNode;
}) {
	return (
		<div className={`${styles.card} ${disabled ? styles.cardDisabled : ''}`}>
			{disabled && <div className={styles.hint}>{hint || 'Недоступно'}</div>}
			<div className={styles.cardIn}>
				<div className={styles.head}>
					<div className={styles.headTitle}>{title}</div>
					{after !== undefined && <div className={styles.headAfter}>{after}</div>}
				</div>
				<div className={styles.body}>{children}</div>
				<div className={styles.bottom}>{bottom}</div>
				{extra && (
					<>
						<div className={styles.cardSeparator} />
						<div className={`${styles.bottom} ${styles.bottomExtra}`}>{extra}</div>
					</>
				)}
			</div>
		</div>
	);
}

/** Строка ресурсов над карточками. В `memo`: таймеры карточек тикают каждую секунду, а числа ресурсов при этом не меняются. */
const ResourceChips = memo(function ResourceChips({ counts, synced }: { counts: Record<string, number>; synced: boolean }) {
	return (
		<HorizontalScroll className={styles.chips} arrowSize="m">
			<div className={styles.chipsIn}>
				{RESOURCES.map((key) => (
					<div key={key} className={styles.chip}>
						{!synced ? (
							<>
								<Skeleton width={18} height={18} style={{ flexShrink: 0 }} />
								<Skeleton width={36} height={12} style={{ flexShrink: 0 }} />
							</>
						) : (
							<>
								<img className={key === 'chest' ? styles.chipTile : undefined} src={`${PATH_IMAGES}${resourceIcon(key)}`} alt="" />
								<span>{numberSpaces(counts[key] || 0)}</span>
							</>
						)}
					</div>
				))}
			</div>
		</HorizontalScroll>
	);
});

/** Ряды кнопок нижней панели: «Обновить», «Запустить» (с «Запустить со всех», если профилей несколько), «Остановить». */
const ROWS_ONE = [1, 1, 1];
const ROWS_MANY = [1, 2, 1];

/** 9. Ресурсы: сбор наград с карты, сундуков, питомца, лотереи, гильдии и т. д. — по отдельности или всё сразу. */
export function ResourcesBotPanel({ id }: { id: string }) {
	const { view, loading, acting, pausing, log, start, stop, setGuildReward, setWar } = useResourceBot();
	const { times, hints, counts, profiles, wars, synced } = view;
	const off = (key: CardKey) => times[key] == null;
	// У неактивной кнопки и в недоступной карточке загрузка не показывается (как в старом приложении); пока идёт любое действие, все кнопки заблокированы
	const collect = (card: CardKey, mode: Mode, title = 'Собрать', disabled = false, action = 'collect') => (
		<FooterButton mode="commerce" loading={loading && !disabled && !off(card)} disabled={disabled || loading} onClick={() => void start(mode, action)}>
			{title}
		</FooterButton>
	);
	const secondary = (card: CardKey, mode: Mode, action: string, title: string, disabled = false) => (
		<FooterButton mode="secondary" loading={loading && !disabled && !off(card)} disabled={disabled || loading} onClick={() => void start(mode, action)}>
			{title}
		</FooterButton>
	);
	const then = (promise: Promise<boolean>, message: string) => void promise.then((done) => done && log.text(message));

	const actions = useMemo<BotAction[]>(
		() => [
			{ title: 'Обновить', mode: 'secondary', onClick: () => then(start(), 'данные обновлены'), disabled: loading, loading },
			{ title: 'Запустить', mode: 'commerce', onClick: () => then(start('all'), 'все ресурсы собраны'), disabled: loading, loading },
			...(profiles.length > 1
				? [
						{
							title: 'Запустить со всех',
							mode: 'commerce' as const,
							onClick: () => then(start('all-in-all'), 'все ресурсы со всех профилей собраны'),
							disabled: loading,
							loading,
							after: <ButtonCounter>{profiles.length}</ButtonCounter>,
						},
					]
				: []),
			{ title: 'Остановить', mode: 'destructive', onClick: stop, disabled: !acting || pausing, loading: pausing },
		],
		// then использует log.text, start и stop: они стабильны, поэтому при тике таймеров массив тот же и нижняя панель не перерисовывается
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[loading, acting, pausing, profiles.length, start, stop],
	);

	const chips = <ResourceChips counts={counts} synced={synced} />;

	const cards = synced ? (
		<div className={styles.cards}>
			<ActionCard
				title="Карта"
				after={times.map || '0/0'}
				disabled={off('map')}
				hint={hints.map ?? null}
				bottom={
					<>
						{collect('map', 'map')}
						{secondary('map', 'map', 'upgrade', 'Улучшить')}
					</>
				}
			>
				Сбор награды и улучшение доступных построек на карте
			</ActionCard>
			<ActionCard
				title="Сундук"
				after={getTime(times.chest ?? 0)}
				disabled={off('chest')}
				hint={hints.chest ?? null}
				bottom={
					<>
						{collect('chest', 'chest', 'Собрать', waiting(times.chest) || times.chest === 'clear')}
						{secondary('chest', 'chest', 'open', 'Взломать', times.chest !== 'clear')}
					</>
				}
			>
				Сбор награды и взлом активных сундуков в профиле
			</ActionCard>
			<ActionCard
				title="Питомец"
				after={getTime(times.pet ?? 0)}
				disabled={off('pet')}
				hint={hints.pet ?? null}
				bottom={
					<>
						{collect('pet', 'pet', 'Собрать', waiting(times.pet) || times.pet === 'clear')}
						{secondary('pet', 'pet', 'send', 'Отправить', times.pet !== 'clear')}
					</>
				}
			>
				Сбор награды и отправка на поиск активного питомца
			</ActionCard>
			<ActionCard
				title="Лотерея"
				after={getTime(times.lottery ?? 0)}
				disabled={off('lottery')}
				hint={hints.lottery ?? null}
				bottom={collect('lottery', 'lottery', 'Собрать', waiting(times.lottery))}
			>
				Сбор ежедневной награды за игру в лотерею
			</ActionCard>
			<ActionCard title="Обыск друзей" disabled={off('search')} hint={hints.search ?? null} bottom={collect('search', 'search')}>
				Сбор ежедневной награды за обыск друзей
			</ActionCard>
			<ActionCard title="Энергия" disabled={off('energy')} hint={hints.energy ?? null} bottom={collect('energy', 'energy')}>
				Сбор ежедневной энергии по ссылкам со стены{' '}
				<a className={styles.link} href="https://vk.ru/wiki.warlord" target="_blank" rel="noreferrer">
					vk.ru/wiki.warlord <Icon24ExternalLinkOutline width={16} height={16} />
				</a>
			</ActionCard>
			<ActionCard title="Ежедневная награда" disabled={off('daily')} hint={hints.daily ?? null} bottom={collect('daily', 'daily')}>
				Собирает случайную награду за ежедневный вход в игру
			</ActionCard>
			<ActionCard title="Премиум сундук" disabled={off('vip')} hint={hints.vip ?? null} bottom={collect('vip', 'vip')}>
				Собирает сундук, который выдаётся за премиум статус
			</ActionCard>
			<ActionCard
				title="Здания гильдии"
				after={getTime(times.guildBuilds ?? 0)}
				disabled={off('guildBuilds')}
				hint={hints.guildBuilds ?? null}
				bottom={collect('guildBuilds', 'guildBuild', 'Собрать', waiting(times.guildBuilds))}
			>
				Собирает награду за обыск зданий, которые построены в гильдии
			</ActionCard>
			<ActionCard
				title="Дань гильдии"
				disabled={off('guildReward')}
				hint={hints.guildReward ?? null}
				bottom={collect('guildReward', 'guildReward')}
				extra={
					<Checkbox className={styles.checkbox} checked={view.guildReward} onChange={() => setGuildReward(!view.guildReward)}>
						Собирать со всех
					</Checkbox>
				}
			>
				Собирает награду за захваченные районы гильдией
			</ActionCard>
			<ActionCard
				title="Набеги гильдии"
				disabled={off('guildWars')}
				hint={hints.guildWars ?? null}
				bottom={collect('guildWars', 'guildWars')}
				extra={
					<>
						<Input
							className={styles.input}
							type="number"
							disabled={loading}
							placeholder="Начало"
							value={String(wars.start || '')}
							onChange={(event) => setWar('start', Number(event.target.value))}
						/>
						<Input
							className={styles.input}
							type="number"
							disabled={loading}
							placeholder="Конец"
							value={String(wars.end || '')}
							onChange={(event) => setWar('end', Number(event.target.value))}
						/>
					</>
				}
			>
				Собирает награды за побеждённых врагов во всех возможных набегах
			</ActionCard>
		</div>
	) : (
		<div className={styles.cards}>
			{Array.from({ length: 4 }, (_, index) => (
				<div key={index} className={styles.card}>
					<div className={styles.head}>
						<Skeleton height={20} width={70} />
					</div>
					<div className={styles.body}>
						<Skeleton height={32} width="75%" />
					</div>
					<div className={styles.bottom}>
						<Skeleton height={36} width="100%" />
						<Skeleton height={36} width="100%" />
					</div>
				</div>
			))}
		</div>
	);

	return (
		<WikiPanel
			id={id}
			parent="profile"
			title="Ресурсы"
			description="Мой профиль"
			avatar="labels/14.png"
			top={chips}
			bottom={<BotFooter rowSizes={profiles.length > 1 ? ROWS_MANY : ROWS_ONE} loading={!synced && loading} log={log.entries} onClear={log.clear} actions={actions} />}
		>
			{synced ? (
				<PullToRefresh className={styles.refresh} slotProps={{ controls: { zIndex: 0 } }} onRefresh={() => !loading && then(start(), 'данные обновлены')} isFetching={loading}>
					{/* Две строки карточек целиком: кнопка карточки 36px (FooterButton), 240px было при кнопке 28px */}
					<ScrollBox height={256}>{cards}</ScrollBox>
				</PullToRefresh>
			) : (
				cards
			)}
		</WikiPanel>
	);
}
