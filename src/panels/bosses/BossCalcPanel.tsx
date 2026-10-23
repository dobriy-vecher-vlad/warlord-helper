import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@vkontakte/vkui';
import { useDeepLink } from '../../app/deepLink';
import { useIsDesktop } from '../../app/layout';
import { Button } from '../../components/form/Form';
import { PickSelect } from '../../components/form/PickSelect';
import { GameBanner, Parchment } from '../../components/GameBanner';
import { Photo } from '../../components/Photo';
import { WikiPanel } from '../../components/wiki/WikiPanel';
import { PATH_IMAGES } from '../../config';
import { numberSpaces } from '../../lib/format';
import type { GameUser } from '../../profile/constants';
import { useSession } from '../../profile/session';
import { useBossDiscount } from '../../store/bossCalc';
import { openModal } from '../../store/modal';
import { openPanel } from '../../store/nav';
import { BOSS_CALC_PANELS, NEW_BOSS_LINK } from '../calcPanels';
import { sectionBase } from '../section';
import { DISCOUNTS } from './bossCalcData';
import { calculateBossFight, type FightInput } from './bossFight';
import { useSelectedBoss } from './useBossCalc';
import styles from './BossCalcPanel.module.css';

const base = sectionBase('bosses', 'Боссы');

/** Поле калькулятора с иконкой справа. */
function CalcInput({ icon, value, placeholder, onChange }: { icon: string; value: number; placeholder: string; onChange: (value: number) => void }) {
	return (
		<Input
			type="number"
			min={0}
			value={value}
			placeholder={placeholder}
			onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
			after={<Photo className={styles.inputIcon} src={`${PATH_IMAGES}bosses/${icon}.png`} size={24} radius="var(--icon-radius, 6px)" />}
		/>
	);
}

/** Кнопка «Создать своего»; старая ссылка `modal=25` открывает то же окно (хук внутри панели, чтобы сработать раньше проверки окна из ссылки). */
function CreateBossButton() {
	const open = useCallback(() => openModal('newBoss'), []);
	useDeepLink(NEW_BOSS_LINK, open);
	return (
		<Button mode="secondary" className={styles.create} onClick={open}>
			Создать своего
		</Button>
	);
}

/** Характеристики персонажа для полей калькулятора: здоровье считается с учётом выносливости, остальное — навыки. */
const inputsFromGame = (game: GameUser | null): FightInput => ({
	health: (Number(game?._end ?? 0) + Number(game?._endi ?? 0)) * 15,
	damage: Number(game?._dmgi ?? 0),
	invisible: Number(game?._s3 ?? 0),
	healer: Number(game?._s4 ?? 0),
	potions: 0,
	lightning: 0,
	fire: 0,
});

/** 1. Калькулятор боссов: сколько урона персонаж нанесёт боссу и сколько здоровья у босса останется. */
export function BossCalcPanel({ id }: { id: string }) {
	const isDesktop = useIsDesktop();
	const game = useSession((s) => s.game);
	const boss = useSelectedBoss();
	const discount = useBossDiscount();
	const [input, setInput] = useState(() => inputsFromGame(game));
	// Страница открыта по ссылке раньше, чем загрузился персонаж: подставляем его характеристики, пока поля не трогали
	const touched = useRef(false);
	useEffect(() => {
		if (!touched.current) setInput(inputsFromGame(game));
	}, [game]);
	const set = (key: keyof FightInput) => (value: number) => {
		touched.current = true;
		setInput((current) => ({ ...current, [key]: value }));
	};

	const result = calculateBossFight(boss, discount, input);
	const cells: [string, number][] = [
		['Здоровье', result.bossHealth],
		['Атака', result.bossDamage],
		['Чистый урон', result.clearDamage],
		['Общий урон', result.totalDamage],
		['Остаток здоровья', result.leftHP],
		['Количество ударов', result.totalHit],
	];

	return (
		<WikiPanel
			{...base(id, 'Калькулятор', 8)}
			top={
				<div className={styles.inputs}>
					{isDesktop && game && (
						<span className={styles.persona} style={{ backgroundImage: `url(${PATH_IMAGES}bosses/persona_full.png)` }}>
							{[1, 2, 3].map((layer) => (
								<span key={layer} style={{ backgroundImage: `url(${PATH_IMAGES}bosses/persona_${layer}_${game[`_a${layer}`]}.png)` }} />
							))}
						</span>
					)}
					<div className={styles.fields}>
						<div className={styles.grid2}>
							<CalcInput icon="talent_1" value={input.health} placeholder="Здоровье" onChange={set('health')} />
							<CalcInput icon="talent_2" value={input.damage} placeholder="Атака" onChange={set('damage')} />
							<CalcInput icon="talent_4" value={input.invisible} placeholder="Невидимый удар" onChange={set('invisible')} />
							<CalcInput icon="talent_5" value={input.healer} placeholder="Мастер целитель" onChange={set('healer')} />
						</div>
						<div className={styles.grid3}>
							<CalcInput icon="talent_6" value={input.potions} placeholder="Целебные зелья" onChange={set('potions')} />
							<CalcInput icon="talent_7" value={input.lightning} placeholder="Свитки молнии" onChange={set('lightning')} />
							<CalcInput icon="talent_8" value={input.fire} placeholder="Свитки огня" onChange={set('fire')} />
						</div>
					</div>
				</div>
			}
		>
			<div className={styles.selects}>
				<PickSelect image={boss.icon} onClick={() => openPanel(BOSS_CALC_PANELS.boss)}>
					{boss.name}
				</PickSelect>
				<CreateBossButton />
				<PickSelect className={styles.discount} placeholder="Не выбрана" onClick={() => openPanel(BOSS_CALC_PANELS.power)}>
					{DISCOUNTS.find((item) => item.value === discount)?.title}
				</PickSelect>
			</div>
			<div className={styles.bannerGap}>
				<GameBanner title={boss.name} subtitle={boss.description} background={boss.background} person={boss.image}>
					{cells.map(([label, value]) => (
						<Parchment key={label} value={numberSpaces(value)} label={label} />
					))}
				</GameBanner>
			</div>
		</WikiPanel>
	);
}
