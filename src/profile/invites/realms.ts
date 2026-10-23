/** Серверы, у которых есть файлы статистики игроков (и кооперативные бои): только ВКонтакте. */
export const REALMS: Readonly<Record<number, string>> = { 1: 'ermun', 2: 'antares' };

/** Есть ли для сервера список игроков (и, значит, приглашения). */
export const hasPlayers = (server: number) => server in REALMS;
