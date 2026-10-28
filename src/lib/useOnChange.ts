import { useState } from 'react';

/**
 * Подстроить состояние компонента, когда изменились значения `deps` (приём React «хранить значение по предыдущим данным»).
 * В отличие от `useEffect` + `setState`, правка происходит во время той же отрисовки: нет лишнего кадра со старым значением
 * и нет повторного рендера после неё. `onChange` вызывается только при изменении (не при первой отрисовке) и может менять
 * лишь состояние этого же компонента.
 */
export function useOnChange(deps: readonly unknown[], onChange: () => void) {
	const [previous, setPrevious] = useState(deps);
	if (previous.length !== deps.length || previous.some((value, index) => !Object.is(value, deps[index]))) {
		setPrevious(deps);
		onChange();
	}
}
