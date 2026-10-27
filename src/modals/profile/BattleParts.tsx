import type { ReactNode } from 'react';
import { Chip, Progress, Tappable } from '@vkontakte/vkui';
import { PATH_IMAGES } from '../../config';
import { Photo } from '../../components/Photo';
import { Skeleton } from '../../components/Skeleton';
import { NavCell } from '../../components/wiki/NavCell';
import { numberSpaces } from '../../lib/format';
import { openBossWiki, type InviteBoss } from '../../profile/invites/bosses';
import { CAMERA_PHOTO } from '../../profile/constants';
import styles from './BattleParts.module.css';

export { styles as partStyles };

/** Характеристика: значение крупно, подпись под ним; `corner` — мелкий текст справа в строке значения (не меняет высоту). */
export function Stat({ label, value, corner }: { label: string; value: string; corner?: string }) {
	return (
		<div className={styles.stat}>
			<span className={styles.statValue}>{value}</span>
			<span className={styles.statLabel}>{label}</span>
			{corner && <span className={styles.corner}>{corner}</span>}
		</div>
	);
}

/** Полоска с подписью и значением; без значения вместо него заглушка загрузки. С `onClick` вся полоска нажимается (подсвечивается при наведении). */
export function Bar({ label, value, percent, onClick }: { label: string; value?: string; percent: number; onClick?: () => void }) {
	const content = (
		<>
			<div className={styles.caption}>
				<span>{label}</span>
				<b>{value ?? <Skeleton height={16} width={90} />}</b>
			</div>
			<Progress value={Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0} />
		</>
	);
	return onClick ? (
		<Tappable className={`${styles.bar} ${styles.barLink}`} onClick={onClick}>
			{content}
		</Tappable>
	) : (
		<div className={styles.bar}>{content}</div>
	);
}

/** Метка «SOLO»: босса можно убить в одиночку (расчёт с навыками, без свитков и зелий). */
export const SoloChip = () => (
	<Chip readOnly removable={false}>
		SOLO
	</Chip>
);

/**
 * Метка SOLO в строке списка. Когда в списке есть такие метки, у остальных строк на её месте пустое поле того же размера (`reserve`):
 * иначе число попыток у одних строк сдвинуто на ширину метки и правый край «гуляет».
 */
export function SoloSlot({ solo, reserve }: { solo: boolean; reserve: boolean }) {
	if (solo) return <SoloChip />;
	return reserve ? <span className={styles.soloSlot} /> : null;
}

/** Ячейка босса: значок, имя и описание в одну строку, метка SOLO; по нажатию — статья о боссе из википедии. */
export function BossCell({ boss, title, subtitle, solo = false }: { boss: InviteBoss | null; title: string; subtitle?: ReactNode; solo?: boolean }) {
	return (
		<div className={styles.boss}>
			<NavCell
				className={styles.bossCell}
				onClick={boss ? () => void openBossWiki(boss) : undefined}
				image={boss?.icon ?? 'bosses/icons/0.png'}
				after={solo ? <SoloChip /> : undefined}
				title={title}
				subtitle={<span className={styles.oneLine}>{boss?.description ?? subtitle}</span>}
			/>
		</div>
	);
}

/** Участник боя для списка. */
export interface PlayerRow {
	id: number;
	name: string;
	/** Номер аватара арены */
	avatar: number | null;
	damage: number;
}

/** Участники боя по урону, как в игре: место, аватар, имя и нанесённый урон; свой ряд выделен. */
export function PlayerList({ rows, meId, all = false }: { rows: readonly PlayerRow[]; meId: number; all?: boolean }) {
	if (!rows.length) return <div className={styles.empty}>Пока никто не бил</div>;
	const sorted = [...rows].sort((a, b) => b.damage - a.damage);
	return (
		<div className={`${styles.players} ${all ? styles.playersAll : ''}`}>
			{sorted.map((row, index) => (
				<div key={row.id} className={`${styles.player} ${row.id === meId ? styles.me : ''}`}>
					<span className={styles.rank}>{index + 1}</span>
					<Photo lazy src={row.avatar ? `${PATH_IMAGES}bot/arena/avatar_${row.avatar}.png` : CAMERA_PHOTO} size={32} />
					<span className={styles.playerName}>{row.name}</span>
					<span className={styles.damage}>{numberSpaces(row.damage)}</span>
				</div>
			))}
		</div>
	);
}
