import { useState } from 'react';
import { Button } from '../../components/form/Form';
import { Currency } from '../../components/wiki/Currency';
import { ItemCard } from '../../components/wiki/ItemCard';
import { numberSpaces } from '../../lib/format';
import { PARCHMENTS, stoneBonusText, stoneIcon } from '../../profile/inlay';
import { backModal, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import styles from './InlayModal.module.css';

/** Камень в списке окна: вид, уровень, название, бонус и сколько таких камней в запасе. */
export interface InlayStone {
	type: number;
	level: number;
	name: string;
	value: number;
	count: number;
	/** Цена вставки в пергаментах */
	price: number;
}

/**
 * Данные окна: выбор камня из запаса для пустого слота (вставка платная, пергаменты).
 */
export interface InlayModalData {
	stones: InlayStone[];
	/** Сколько пергаментов у игрока */
	balance: number;
	onPick: (stone: InlayStone) => void;
}

const cardOf = (stone: InlayStone) => ({ title: stone.name, icon: stoneIcon(stone.type, stone.level), description: stoneBonusText(stone.type, stone.value) });

/** Окно вставки камня: выбор камня из запаса для пустого слота. */
export function InlayModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as InlayModalData | undefined;
	// Выбранный в списке камень; при каждом открытии окна выбор начинается заново (запись окна новая)
	const [picked, setPicked] = useState<{ entry: ModalEntry | null; key: string } | null>(null);
	const chosen = data && picked?.entry === entry ? data.stones.find((stone) => `${stone.type}-${stone.level}` === picked.key) : undefined;

	return (
		<ClassicModal
			id="inlay"
			open={open}
			onClose={backModal}
			title="Вставить камень"
			footer={
				<div className={styles.actions}>
					<Button stretched mode="secondary" onClick={backModal}>
						Отмена
					</Button>
					<Button
						stretched
						mode="commerce"
						disabled={!chosen || (data && data.balance < chosen.price)}
						onClick={() => {
							if (!chosen || !data) return;
							backModal();
							data.onPick(chosen);
						}}
					>
						Вставить
					</Button>
				</div>
			}
		>
			<div className={styles.body}>
				{data?.stones.map((stone) => {
					const key = `${stone.type}-${stone.level}`;
					return (
						<ItemCard
							key={key}
							index={0}
							custom={cardOf(stone)}
							badge={numberSpaces(stone.count)}
							selected={chosen === stone}
							onClick={() => setPicked({ entry, key })}
							end={
								<span className={`${styles.value} ${data.balance < stone.price ? styles.short : ''}`}>
									{numberSpaces(stone.price)} <Currency id={PARCHMENTS} />
								</span>
							}
						/>
					);
				})}
				{data && !data.stones.length && <div className={styles.empty}>Свободных камней нет</div>}
			</div>
		</ClassicModal>
	);
}
