import dataArena from '../data/arena.json';
import dataOther from '../data/other.json';

/**
 * Старое приложение при загрузке переворачивало эти списки (`.reverse()` в index.js),
 * и весь код, включая порядок наград, работал с перевёрнутыми. Здесь — копии в том же порядке,
 * исходные JSON не меняются.
 */
export const ARENA_SEASONS = [...dataArena.season].reverse();
export const OTHER_EVENTS = [...dataOther.events].reverse();
