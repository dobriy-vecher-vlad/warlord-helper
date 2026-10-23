import type { ReactNode } from 'react';
import { ModalCard } from '@vkontakte/vkui';
import {
	Icon24AddCircleDottedOutline,
	Icon24CupOutline,
	Icon24HammerOutline,
	Icon24MoneyCircleOutline,
	Icon24PollOutline,
	Icon24SkullOutline,
	Icon24TshirtOutline,
	Icon24Users3Outline,
} from '@vkontakte/icons';
import { storageSet } from '../lib/storage';
import { backModal, useActiveModal } from '../store/modal';
import styles from './PromoModals.module.css';
import { useModalMotion } from './useModalMotion';

type Mark = 'prominent' | 'primary';

interface FeatureData {
	icon: ReactNode;
	text: string;
	/** Плашка справа: «Популярное», «Новое» (только в окне подписки) */
	badge?: { mode: Mark; label: string };
}

const icon = (Icon: typeof Icon24CupOutline) => <Icon width={32} height={32} />;

const BIND = { icon: icon(Icon24AddCircleDottedOutline), text: 'Привязывай профили и получай выгоду на всех' };
const RAID = { icon: icon(Icon24SkullOutline), text: 'Проходите в автоматическом режиме выбранный рейд всего за 2 минуты' };
const ARENA = { icon: icon(Icon24CupOutline), text: 'Набирайте в автоматическом режиме очки арены и занимайте первые места' };
const FORGE = { icon: icon(Icon24HammerOutline), text: 'Удобно сортируйте и улучшайте в один клик любой предмет' };

/** Преимущества в окне подписки. */
const DONUT_FEATURES: FeatureData[] = [
	BIND,
	{ ...RAID, badge: { mode: 'prominent', label: 'Популярное' } },
	{ ...ARENA, badge: { mode: 'prominent', label: 'Популярное' } },
	{ ...FORGE, badge: { mode: 'primary', label: 'Новое' } },
	{ icon: icon(Icon24Users3Outline), text: 'Сканируйте всех ваших друзей, выводя их в удобном и сортируемом списке' },
	{ icon: icon(Icon24TshirtOutline), text: 'Напротив каждого предмета в приложении будет указываться его наличие у вас' },
	{ icon: icon(Icon24MoneyCircleOutline), text: 'Список предметов с подробной информацией' },
	{ icon: icon(Icon24PollOutline), text: 'Считайте затраты на боссов, арену, казну гильдии и предметы ещё эффективнее' },
];

/** Преимущества в окне акции: четыре основных, остальные — рядом значками. */
const SALES_FEATURES: FeatureData[] = [BIND, RAID, ARENA, FORGE];
const SALES_ICONS = [Icon24Users3Outline, Icon24TshirtOutline, Icon24MoneyCircleOutline, Icon24PollOutline];

/** Преимущество подписки: иконка и текст (заголовок в старом приложении был скрыт стилями). */
function Feature({ icon, text, badge }: FeatureData) {
	return (
		<div className={styles.feature}>
			<span className={styles.featureIcon}>{icon}</span>
			<span className={styles.featureText}>{text}</span>
			<span className={styles.featureAfter}>{badge && <span className={`${styles.badge} ${styles[badge.mode]}`}>{badge.label}</span>}</span>
		</div>
	);
}

/** Окно-карточка: затемнение и анимацию задаёт приложение. */
function PromoCard({ id, open, children }: { id: 'sales' | 'donut'; open: boolean; children: ReactNode }) {
	const motion = useModalMotion();
	return (
		<ModalCard id={id} open={open} onClose={backModal} className={styles.card} {...motion}>
			<div className={styles.body}>{children}</div>
		</ModalCard>
	);
}

/** «Акция»: две подписки по цене одной. «Хорошо» запоминает, что акция показана (promo_3). */
function SalesModal({ open }: { open: boolean }) {
	const close = () => {
		void storageSet('promo_3', 'true');
		backModal();
	};
	return (
		<PromoCard id="sales" open={open}>
			<div className={styles.title}>Две подписки по цене одной</div>
			<div className={styles.text}>Приведи друга, который оформит подписку по твоей рекомендации и получи подписку себе сроком на 3 месяца совершенно бесплатно.</div>
			<div className={styles.subtitle}>Преимущества подписки</div>
			<div className={styles.features}>
				{SALES_FEATURES.map((feature) => (
					<Feature key={feature.text} {...feature} />
				))}
				<div className={`${styles.feature} ${styles.icons}`}>
					{SALES_ICONS.map((Icon, index) => (
						<Icon key={index} width={32} height={32} />
					))}
				</div>
			</div>
			<button type="button" className={styles.button} onClick={close}>
				Хорошо
			</button>
		</PromoCard>
	);
}

/** «Подписка»: список возможностей и ссылка на VK Donut. */
function DonutModal({ open }: { open: boolean }) {
	return (
		<PromoCard id="donut" open={open}>
			<div className={`${styles.title} ${styles.titleDonut}`}>Подписка</div>
			<div className={styles.features}>
				{DONUT_FEATURES.map((feature) => (
					<Feature key={feature.text} {...feature} />
				))}
			</div>
			<a className={styles.button} href="https://vk.com/donut/wiki.warlord" target="_blank" rel="noreferrer">
				Оформить за 50₽ в месяц
			</a>
		</PromoCard>
	);
}

/** Окна акции и подписки (открываются с плиток главной внутри ВК). */
export function PromoModals() {
	const active = useActiveModal();
	return (
		<>
			<SalesModal open={active?.id === 'sales'} />
			<DonutModal open={active?.id === 'donut'} />
		</>
	);
}
