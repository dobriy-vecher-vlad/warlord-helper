import type { ReactNode } from 'react';
import { Button as VKButton, FormItem, FormStatus as VKFormStatus, IconButton, Input, Radio as VKRadio, SimpleCell, Slider as VKSlider } from '@vkontakte/vkui';
import { Icon16Clear } from '@vkontakte/icons';
import styles from './Form.module.css';

type ButtonMode = 'primary' | 'secondary' | 'tertiary' | 'commerce' | 'destructive' | 'outline';

interface ButtonProps {
	mode?: ButtonMode;
	/** l — 36px на ПК и 44px на телефоне, m — 32px и 36px, s — 28px и 30px (размеры VKUI 4) */
	size?: 'l' | 'm' | 's';
	stretched?: boolean;
	disabled?: boolean;
	loading?: boolean;
	before?: ReactNode;
	/** Справа от текста (счётчик) */
	after?: ReactNode;
	href?: string;
	className?: string;
	style?: React.CSSProperties;
	onClick?: () => void;
	children?: ReactNode;
}

/** Режимы кнопки старого приложения (VKUI 4: mode + appearance) в режимы VKUI 8. */
const BUTTON_MODES = {
	primary: { mode: 'primary', appearance: 'accent' },
	secondary: { mode: 'secondary', appearance: 'accent' },
	tertiary: { mode: 'tertiary', appearance: 'accent' },
	commerce: { mode: 'primary', appearance: 'positive' },
	destructive: { mode: 'primary', appearance: 'negative' },
	outline: { mode: 'outline', appearance: 'accent' },
} as const;

/** Кнопка VKUI; размеры и шрифт подогнаны под VKUI 4 в Form.module.css. */
export function Button({ mode = 'primary', size = 'l', stretched, disabled, loading, before, after, href, className, style, onClick, children }: ButtonProps) {
	return (
		<VKButton
			{...BUTTON_MODES[mode]}
			className={`${styles.button} ${styles[`size_${size}`]} ${mode === 'commerce' || mode === 'destructive' ? styles.faint : ''} ${mode === 'tertiary' ? styles.tertiary : ''} ${className ?? ''}`}
			size={size}
			stretched={stretched}
			disabled={disabled}
			loading={loading}
			before={before}
			after={after}
			href={href}
			target={href ? '_blank' : undefined}
			style={style}
			onClick={onClick}
		>
			{children}
		</VKButton>
	);
}

interface ActionCellProps {
	/** Иконка 28px акцентного цвета (или картинка) */
	icon?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	/** Значение справа серым */
	indicator?: ReactNode;
	after?: ReactNode;
	/** Стрелка справа */
	expandable?: boolean;
	disabled?: boolean;
	href?: string;
	onClick?: () => void;
	className?: string;
}

/** Строка с иконкой, значением справа и стрелкой (SimpleCell). */
export function ActionCell({ icon, title, subtitle, indicator, after, expandable = true, disabled, href, onClick, className }: ActionCellProps) {
	return (
		<SimpleCell
			className={`${styles.cell} ${className ?? ''}`}
			before={icon}
			subtitle={subtitle}
			indicator={indicator !== undefined && indicator !== null && indicator !== false ? indicator : undefined}
			after={after}
			chevron={expandable ? 'always' : undefined}
			disabled={disabled || (!href && !onClick)}
			href={href}
			target={href ? '_blank' : undefined}
			onClick={onClick}
		>
			{title}
		</SimpleCell>
	);
}

export type FieldStatus = 'default' | 'valid' | 'error';

interface FieldProps {
	label?: ReactNode;
	status?: FieldStatus;
	bottom?: ReactNode;
	value: string | number;
	onChange: (value: string) => void;
	type?: 'text' | 'number';
	placeholder?: string;
	maxLength?: number;
	/** Кнопка справа от поля: стоит в одном ряду с полем ввода и тянется по его высоте (подпись и подсказка остаются над рядом и под ним) */
	aside?: ReactNode;
}

/** Поле ввода с подписью сверху, крестиком очистки и подсказкой снизу (FormItem + Input). */
export function Field({ label, status = 'default', bottom, value, onChange, type = 'text', placeholder, maxLength, aside }: FieldProps) {
	const input = (
		<Input
			type={type}
			value={value}
			placeholder={placeholder}
			maxLength={maxLength}
			onChange={(event) => onChange(event.target.value)}
			after={
				<IconButton hoverMode="opacity" aria-label="Очистить поле" onClick={() => onChange('')}>
					<Icon16Clear />
				</IconButton>
			}
		/>
	);
	return (
		<FormItem top={label} status={status === 'default' ? undefined : status} bottom={bottom}>
			{aside ? (
				<div className={styles.inputRow}>
					<div className={styles.inputGrow}>{input}</div>
					<div className={styles.aside}>{aside}</div>
				</div>
			) : (
				input
			)}
		</FormItem>
	);
}

/** Блок с сообщением (FormStatus): ошибка — красный фон. */
export function FormStatus({ header, mode = 'default', children }: { header?: ReactNode; mode?: 'default' | 'error'; children?: ReactNode }) {
	return (
		<VKFormStatus title={header} mode={mode}>
			{children}
		</VKFormStatus>
	);
}

/** Переключатель (Radio). */
export function Radio({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
	return (
		<VKRadio className={styles.radio} checked={checked} onChange={onChange}>
			{children}
		</VKRadio>
	);
}

/** Ползунок (Slider). */
export function Slider({ min, max, value, onChange, className }: { min: number; max: number; value: number; onChange: (value: number) => void; className?: string }) {
	return <VKSlider className={className} min={min} max={max} step={1} value={value} onChange={onChange} />;
}

/** Ползунок с подписью и полем для точного значения под ним (FormItem + Slider + Input). Значение не меньше `min`; выше `max` вводить можно. */
export function SliderField({ label, value, min, max, onChange }: { label: ReactNode; value: number; min: number; max: number; onChange: (value: number) => void }) {
	const set = (next: number) => onChange(Number.isFinite(next) ? Math.max(min, next) : min);
	return (
		<div className={styles.sliderField}>
			<FormItem top={label}>
				<Slider min={min} max={max} value={Math.min(value, max)} onChange={set} />
			</FormItem>
			<FormItem>
				<Input type="number" min={min} value={String(value)} onChange={(event) => set(Number(event.target.value))} />
			</FormItem>
		</div>
	);
}

/** Ползунки по два в ряд (CardGrid size="m" в старом приложении). */
export function SliderGrid({ children }: { children: ReactNode }) {
	return <div className={styles.sliderGrid}>{children}</div>;
}
