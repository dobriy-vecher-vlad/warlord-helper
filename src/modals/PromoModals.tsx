import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { Button, Caption, Counter, Div, Header, Paragraph, Spacing } from '@vkontakte/vkui';
import {
	Icon24AddCircleDottedOutline,
	Icon24PawOutline,
	Icon24CupOutline,
	Icon24HammerOutline,
	Icon24MoneyCircleOutline,
	Icon24PollOutline,
	Icon24SkullOutline,
	Icon24TshirtOutline,
	Icon24Users3Outline,
} from '@vkontakte/icons';
import { NavCell } from '../components/wiki/NavCell';
import { storageSet } from '../lib/storage';
import { backModal, useActiveModal } from '../store/modal';
import { ClassicModal } from './ClassicModal';
import styles from './PromoModals.module.css';

type Mark = 'prominent' | 'primary';

interface FeatureData {
	icon: ReactNode;
	text: string;
	/** Заголовок строки */
	title?: string;
	/** Плашка справа («Новое») */
	badge?: { mode: Mark; label: string };
}

const icon = (Icon: typeof Icon24CupOutline) => <Icon width={32} height={32} />;

const BIND = { icon: icon(Icon24AddCircleDottedOutline), title: 'Привязка профилей', text: 'Привязывай профили и получай выгоду на всех' };
const RAID = { icon: icon(Icon24SkullOutline), title: 'Рейды', text: 'Проходите в автоматическом режиме выбранный рейд всего за 2 минуты' };
const ARENA = { icon: icon(Icon24CupOutline), title: 'Арена', text: 'Набирайте в автоматическом режиме очки арены и занимайте первые места' };
const BOSSES: FeatureData = {
	icon: icon(Icon24PawOutline),
	title: 'Боссы',
	text: 'Принимайте приглашения на боссов со всей игры и автоматически их убивайте',
	badge: { mode: 'prominent', label: 'Новое' },
};
const FORGE = { icon: icon(Icon24HammerOutline), title: 'Кузница', text: 'Удобно сортируйте и улучшайте в один клик любой предмет' };

/** Преимущества в окне подписки. */
const DONUT_FEATURES: FeatureData[] = [
	BIND,
	RAID,
	ARENA,
	FORGE,
	BOSSES,
	{ icon: icon(Icon24Users3Outline), title: 'Друзья', text: 'Сканируйте всех ваших друзей, выводя их в удобном и сортируемом списке' },
	{ icon: icon(Icon24TshirtOutline), title: 'Наличие предметов', text: 'Напротив каждого предмета в приложении будет указываться его наличие у вас' },
	{ icon: icon(Icon24MoneyCircleOutline), title: 'Список предметов', text: 'Список предметов с подробной информацией' },
	{ icon: icon(Icon24PollOutline), title: 'Затраты', text: 'Считайте затраты на боссов, арену, казну гильдии и предметы ещё эффективнее' },
];

/** Купола свечения под сноской: положение по ширине (%), размер, период и сдвиг мигания (с), чтобы моргали вразнобой. */
const GLOWS = [
	{ x: 12, width: 200, height: 90, period: 5.5, delay: 0 },
	{ x: 38, width: 260, height: 120, period: 6.5, delay: -2.5 },
	{ x: 64, width: 180, height: 80, period: 4.5, delay: -1 },
	{ x: 88, width: 220, height: 100, period: 5.8, delay: -3.5 },
];

/** В окне акции показаны главные преимущества, об остальных сказано кратко. */
const SALES_FEATURES = [BIND, RAID, ARENA, FORGE, BOSSES];

/** Неразрывные пробелы: после коротких слов (предлоги, союзы, числа) и перед последним словом, чтобы строка не рвалась неудачно. */
const tie = (text: string) => {
	const short = /(^|\s)([а-яёa-z0-9]{1,3})\s/gi;
	// Два прохода: подряд идущие короткие слова («и их») делят один пробел
	return text
		.replace(short, '$1$2\u00A0')
		.replace(short, '$1$2\u00A0')
		.replace(/\s(\S+)$/, '\u00A0$1');
};

/** Преимущество: обычная строка списка (иконка, заголовок, подпись), плашка справа. */
function FeatureRow({ icon, title, text, badge }: FeatureData) {
	const after = badge && (
		<Counter mode="primary" style={{ marginLeft: 8 }} appearance={badge.mode === 'prominent' ? 'accent-red' : 'accent'}>
			{badge.label}
		</Counter>
	);
	return <NavCell title={title && tie(title)} subtitle={tie(text)} icon={icon} after={after} chevron={false} />;
}

/** Список строк с промежутками сверху, между и снизу. Справа та же пустота, что слева у значка (его рамка шире самого значка). */
function FeatureList({ features }: { features: FeatureData[] }) {
	return (
		<div style={{ paddingRight: 12 }}>
			<Spacing size={8} />
			{features.map((feature, index) => (
				<Fragment key={feature.text}>
					{index > 0 && <Spacing size={8} />}
					<FeatureRow {...feature} />
				</Fragment>
			))}
			<Spacing size={8} />
		</div>
	);
}

/** Кнопка в футере окна: стандартная L, по краю бежит светящаяся дуга (слои эффекта лежат за кнопкой). */
function GlowButton(props: ComponentProps<typeof Button>) {
	return (
		<Div>
			<div className={styles.glow}>
				<div className={styles.glowLayer} aria-hidden>
					<div className={styles.glowRun}>
						<div className={styles.glowRing}>
							<div className={styles.glowMask} />
						</div>
						<div className={`${styles.glowRing} ${styles.glowSharp}`}>
							<div className={styles.glowMask} />
						</div>
					</div>
				</div>
				<Button className={styles.glowButton} size="l" appearance="neutral" stretched {...props} />
			</div>
		</Div>
	);
}

/** Сноска под списком: под ней мигают наполовину скрытые красные круги по всей ширине, выделяя, что возможностей больше. */
function MoreFootnote() {
	return (
		<div className={styles.more}>
			{GLOWS.map((glow) => (
				<div
					key={glow.x}
					className={styles.moreGlow}
					style={{ left: `${glow.x}%`, bottom: -glow.height / 2, width: glow.width, height: glow.height, animationDuration: `${glow.period}s`, animationDelay: `${glow.delay}s` }}
					aria-hidden
				/>
			))}
			<Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>и ещё много возможностей</Caption>
		</div>
	);
}

/** Кнопка оформления подписки в VK Donut; `onClick` — что сделать, когда на неё нажали. */
function SubscribeButton({ onClick }: { onClick?: () => void }) {
	return (
		<GlowButton href="https://vk.ru/donut/wiki.warlord" target="_blank" rel="noreferrer" onClick={onClick}>
			Оформить от 50 рублей в месяц
		</GlowButton>
	);
}

/** «Акция»: две подписки по цене одной. Любое закрытие окна (кнопка, крестик, свайп, тап по фону) засчитывается как просмотр (promo_3). */
function SalesModal({ open }: { open: boolean }) {
	const seen = () => void storageSet('promo_3', 'true');
	const close = () => {
		seen();
		backModal();
	};
	return (
		<ClassicModal id="sales" open={open} onClose={close} title="Акция" footer={<SubscribeButton onClick={seen} />}>
			<Div>
				<Paragraph>Приведи друга, который оформит подписку по твоей рекомендации и получи подписку себе сроком на 3 месяца совершенно бесплатно.</Paragraph>
			</Div>
			<Header>Преимущества</Header>
			<FeatureList features={SALES_FEATURES} />
			<MoreFootnote />
		</ClassicModal>
	);
}

/** «Подписка»: обычное окно (шапка, список возможностей, кнопка внизу) со ссылкой на VK Donut. */
function DonutModal({ open }: { open: boolean }) {
	const footer = <SubscribeButton />;
	return (
		<ClassicModal id="donut" open={open} onClose={backModal} title="Подписка" footer={footer}>
			<FeatureList features={DONUT_FEATURES} />
			<MoreFootnote />
		</ClassicModal>
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
