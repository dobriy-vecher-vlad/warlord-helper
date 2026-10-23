import { createStore, useStore } from './createStore';

/** Предмет, выбранный в калькуляторе улучшения (индекс в каталоге); выбирается на отдельной странице. */
const calc = createStore<{ index: number }>({ index: 0 });

export const useCalcItem = () => useStore(calc, (s) => s.index);
export const setCalcItem = (index: number) => calc.set({ index });
