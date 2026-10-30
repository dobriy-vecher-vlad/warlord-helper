import { useState } from 'react';
import { FormItem, Input } from '@vkontakte/vkui';
import { CopyButton } from '../components/AppHeader';
import { NEW_BOSS_LINK } from '../panels/calcPanels';
import { createCustomBoss } from '../store/bossCalc';
import { backModal } from '../store/modal';
import { ClassicModal } from './ClassicModal';
import styles from './NewBossModal.module.css';
import { useOnChange } from '../lib/useOnChange';
import { FooterButton } from '../components/form/FooterButton';

/** Поле в карточке окна (Card + FormItem + Input в старом приложении). */
function Field({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
	return (
		<div className={styles.card}>
			<FormItem top={label} bottom={hint}>
				<Input type="number" min={1} placeholder={label} value={value} onChange={(event) => onChange(event.target.value)} />
			</FormItem>
		</div>
	);
}

/** Окно «Создание противника» для калькулятора боссов: создаёт своего босса и выбирает его. */
export function NewBossModal({ open }: { open: boolean }) {
	const [hp, setHp] = useState('1');
	const [dmg, setDmg] = useState('1');
	useOnChange([open], () => {
		if (open) {
			setHp('1');
			setDmg('1');
		}
	});
	const create = () => {
		backModal();
		createCustomBoss(Number(hp), Number(dmg));
	};
	return (
		<ClassicModal id="newBoss" open={open} onClose={backModal} title="Создание противника" after={<CopyButton view="bosses" panel="1" modal={NEW_BOSS_LINK} />}>
			<div className={styles.body}>
				<div className={styles.grid}>
					<Field label="Здоровье" hint="Введите здоровье вашего противника" value={hp} onChange={setHp} />
					<Field label="Атака" hint="Введите атаку вашего противника" value={dmg} onChange={setDmg} />
				</div>
				<div className={styles.actions}>
					<FooterButton stretched mode="commerce" onClick={create}>
						Подтвердить
					</FooterButton>
				</div>
			</div>
		</ClassicModal>
	);
}
