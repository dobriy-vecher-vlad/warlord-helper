import { useAdaptivityWithJSMediaQueries, ViewWidth } from '@vkontakte/vkui';

/** Десктопная раскладка (боковое меню) — от ширины планшета, как в старом приложении. */
export function useIsDesktop(): boolean {
	const { viewWidth } = useAdaptivityWithJSMediaQueries();
	return viewWidth >= ViewWidth.SMALL_TABLET;
}
