import bridge from '@vkontakte/vk-bridge';

/** Приложение открыто внутри ВКонтакте (iframe/WebView), а не как обычный сайт. */
export const isEmbedded = () => bridge.isEmbedded();
