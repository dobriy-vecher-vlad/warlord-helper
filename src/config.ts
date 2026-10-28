import { version } from '../package.json';

/** Версия приложения: единственный источник — `version` в package.json. */
export const WIKI_VERSION = version;

/** Картинки всегда берутся с боевого хранилища, в том числе при локальной разработке. */
export const PATH_IMAGES = 'https://warlord-helper.website.yandexcloud.net/media/images/';

/** Ссылка на приложение внутри ВК (для копирования ссылок на разделы). */
export const VK_APP_URL = 'https://vk.ru/app7787242';
