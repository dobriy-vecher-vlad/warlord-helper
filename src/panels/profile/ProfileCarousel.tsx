import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { ScrollArrow } from '@vkontakte/vkui';
import styles from './ProfileCarousel.module.css';

interface ProfileCarouselProps {
	count: number;
	/** Слот по центру; меняется снаружи (выбор профиля) и самой каруселью (жест, стрелки) */
	value: number;
	onSelect: (index: number) => void;
	/** Ширина аватарки-слайда в процентах от ширины карусели */
	avatarWidth: number;
	avatar: (index: number) => ReactNode;
	name: (index: number) => ReactNode;
}

/** Сколько пикселей нужно пройти, чтобы жест стал перетаскиванием, а не нажатием. */
const DRAG_THRESHOLD = 5;
/** За сколько миллисекунд считается скорость жеста; быстрее FLICK_SPEED слайдов за мс (и дальше MIN_FLICK_SHIFT слайда) — бросок. */
const FLICK_WINDOW = 120;
const MIN_FLICK_TIME = 30;
const FLICK_SPEED = 0.003;
const MIN_FLICK_SHIFT = 0.08;
/** Достаточно сдвинуть на эту долю слайда, чтобы листать к соседнему, а не возвращаться к текущему. */
const SWITCH_SHIFT = 0.1;
/** Насколько можно оттянуть крайний слайд за край (в слайдах), и какая доля движения на это уходит. */
const OVERSCROLL = 0.3;
const RESISTANCE = 0.4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Две полосы — аватарки и подписи — двигаются от одного числа: положения карусели в слайдах (`--p`).
 * Поэтому они всегда согласованы, в том числе во время перетаскивания: сдвиг на половину слайда
 * сдвигает на половину слайда и полосу аватарок (слайд — 25–35% ширины), и полосу подписей (слайд — вся ширина).
 * Жесты, стрелки и возврат на нужный слот — в одном месте, без двух независимых галерей.
 */
export function ProfileCarousel({ count, value, onSelect, avatarWidth, avatar, name }: ProfileCarouselProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState(value);
	const [dragging, setDragging] = useState(false);
	const gesture = useRef<{
		id: number;
		startX: number;
		startY: number;
		vertical: boolean;
		startPosition: number;
		unit: number;
		active: boolean;
		samples: { x: number; t: number }[];
	} | null>(null);
	const justDragged = useRef(false);

	// Слот сменился снаружи (выбран профиль, профиль добавлен, окно добавления закрыто): подвести его в центр
	useEffect(() => {
		if (!gesture.current?.active) setPosition(value);
	}, [value]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		// Горизонтальное перетаскивание карусели не доходит до PullToRefresh выше: иначе одним жестом тянется и то и другое
		const block = (event: TouchEvent) => {
			if (gesture.current?.active) event.stopPropagation();
		};
		root.addEventListener('touchmove', block);
		return () => root.removeEventListener('touchmove', block);
	}, []);

	const down = (event: PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0 || !event.isPrimary || count < 2) return;
		const root = rootRef.current;
		if (!root) return;
		const names = (event.target as Element).closest('[data-strip="names"]');
		gesture.current = {
			id: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			// Жест оказался вертикальным (обновление свайпом вниз, прокрутка): карусель в нём не участвует
			vertical: false,
			startPosition: position,
			// Тянем за аватарки — единица шаг аватарки, за подпись — ширина карусели
			unit: names ? root.clientWidth : (root.clientWidth * avatarWidth) / 100,
			active: false,
			samples: [{ x: event.clientX, t: event.timeStamp }],
		};
	};

	const move = (event: PointerEvent<HTMLDivElement>) => {
		const state = gesture.current;
		if (!state || event.pointerId !== state.id) return;
		if (state.vertical) return;
		const shift = event.clientX - state.startX;
		if (!state.active) {
			const lift = event.clientY - state.startY;
			if (Math.abs(shift) < DRAG_THRESHOLD && Math.abs(lift) < DRAG_THRESHOLD) return;
			// Направление жеста определяется один раз, по первому заметному движению
			if (Math.abs(lift) > Math.abs(shift)) {
				state.vertical = true;
				return;
			}
			state.active = true;
			rootRef.current?.setPointerCapture(event.pointerId);
			setDragging(true);
		}
		state.samples.push({ x: event.clientX, t: event.timeStamp });
		while (state.samples.length > 2 && event.timeStamp - state.samples[0]!.t > FLICK_WINDOW) state.samples.shift();
		const raw = state.startPosition - shift / state.unit;
		const last = count - 1;
		// За краем карусель поддаётся только частично, как у VKUI
		const next = raw < 0 ? -Math.min(OVERSCROLL, -raw * RESISTANCE) : raw > last ? last + Math.min(OVERSCROLL, (raw - last) * RESISTANCE) : raw;
		setPosition(next);
	};

	const up = (event: PointerEvent<HTMLDivElement>) => {
		const state = gesture.current;
		if (!state || event.pointerId !== state.id) return;
		gesture.current = null;
		if (!state.active) return;
		justDragged.current = true;
		setTimeout(() => (justDragged.current = false), 0);
		setDragging(false);
		const first = state.samples[0];
		const lastSample = state.samples[state.samples.length - 1];
		// Дальше половины слайда — на ближайший слайд; от 10% слайда или быстрый бросок — на соседний в сторону жеста
		const from = Math.round(state.startPosition);
		const moved = position - from;
		const speed = first && lastSample ? (first.x - lastSample.x) / Math.max(lastSample.t - first.t, MIN_FLICK_TIME) / state.unit : 0;
		const flick = Math.abs(speed) > FLICK_SPEED && Math.abs(moved) > MIN_FLICK_SHIFT;
		const switched = Math.abs(moved) >= SWITCH_SHIFT || flick;
		const target = clamp(Math.abs(moved) >= 0.5 ? Math.round(position) : switched ? from + Math.sign(moved) : from, 0, count - 1);
		setPosition(target);
		if (target !== value) onSelect(target);
	};

	const step = (delta: number) => {
		const target = clamp(value + delta, 0, count - 1);
		if (target !== value) onSelect(target);
	};

	const style = { '--p': position, '--w': avatarWidth } as CSSProperties;
	return (
		<div
			ref={rootRef}
			className={`${styles.carousel} ${count > 1 ? styles.draggable : ''} ${dragging ? styles.dragging : ''}`}
			style={style}
			onPointerDown={down}
			onPointerMove={move}
			onPointerUp={up}
			onPointerCancel={up}
			// После перетаскивания нажатие по ссылке или аватарке не срабатывает
			onClickCapture={(event) => {
				if (justDragged.current) event.stopPropagation();
			}}
			onDragStart={(event) => event.preventDefault()}
		>
			<div className={styles.avatars}>
				<div className={`${styles.layer} ${styles.avatarLayer}`}>
					{Array.from({ length: count }, (_, index) => (
						<div key={index} className={styles.avatarCell}>
							{avatar(index)}
						</div>
					))}
				</div>
				{count > 1 && value > 0 && <ScrollArrow className={`${styles.arrow} ${styles.arrowStart}`} direction="left" size="m" label="Назад" onClick={() => step(-1)} />}
				{count > 1 && value < count - 1 && <ScrollArrow className={`${styles.arrow} ${styles.arrowEnd}`} direction="right" size="m" label="Вперёд" onClick={() => step(1)} />}
			</div>
			<div className={styles.names} data-strip="names">
				<div className={`${styles.layer} ${styles.nameLayer}`}>
					{Array.from({ length: count }, (_, index) => (
						<div key={index} className={styles.nameCell}>
							{name(index)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
