import { Button } from '../../components/form/Form';
import { Currency } from '../../components/wiki/Currency';
import { ItemCard } from '../../components/wiki/ItemCard';
import { numberSpaces } from '../../lib/format';
import { itemAt } from '../../lib/items';
import { backModal, type ModalEntry } from '../../store/modal';
import { ClassicModal } from '../ClassicModal';
import styles from './ShopBuyModal.module.css';

/** Данные окна: предмет (индекс каталога), его цены и что сделать при подтверждении. */
export interface ShopBuyData {
	index: number;
	/** Цены предмета по валютам и сколько каждой валюты у персонажа: покупка списывает все цены сразу */
	prices: { currency: number; price: number; balance: number }[];
	onConfirm: () => void;
}

/** Подтверждение дорогой покупки в магазине: предмет, цена и сколько останется. */
export function ShopBuyModal({ open, entry }: { open: boolean; entry: ModalEntry | null }) {
	const data = entry?.data as unknown as ShopBuyData | undefined;
	const item = data ? itemAt(data.index) : undefined;
	return (
		<ClassicModal
			id="shopBuy"
			open={open}
			onClose={backModal}
			footer={
				<div className={styles.actions}>
					<Button stretched mode="secondary" onClick={backModal}>
						Отмена
					</Button>
					<Button
						stretched
						mode="commerce"
						onClick={() => {
							backModal();
							data?.onConfirm();
						}}
					>
						Купить
					</Button>
				</div>
			}
		>
			{item && data && (
				<div className={styles.body}>
					<ItemCard index={data.index} plain onClick={() => undefined} caption={item.description} />
					<div className={styles.row}>
						Цена
						<span className={styles.values}>
							{data.prices.map(({ currency, price }) => (
								<span key={currency} className={styles.value}>
									{numberSpaces(price)} <Currency id={currency} />
								</span>
							))}
						</span>
					</div>
					<div className={styles.row}>
						Останется
						<span className={styles.values}>
							{data.prices.map(({ currency, price, balance }) => (
								<span key={currency} className={styles.value}>
									{numberSpaces(balance - price)} <Currency id={currency} />
								</span>
							))}
						</span>
					</div>
				</div>
			)}
		</ClassicModal>
	);
}
