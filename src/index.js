import bridge from "@vkontakte/vk-bridge";
import X2JS from './xml2js.js';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
import {
	CardGrid,
	Card,
	Spinner,
	Link,
	ScreenSpinner,
	PanelHeaderButton,
	Avatar,
	ModalRoot,
	withAdaptivity,
	usePlatform,
	ViewWidth,
	ConfigProvider,
	AdaptivityProvider, 
	AppRoot,
	Gallery,
	Title,
	Spacing,
	SplitLayout,
	PanelHeader,
	SplitCol,
	Epic,
	Tabbar,
	TabbarItem,
	View,
	Panel,
	PanelHeaderBack,
	Group,
	Placeholder,
	Cell,
	Button,
	Banner,
	HorizontalCell,
	SimpleCell,
	Snackbar,
	PanelHeaderContent,
	Badge,
	RichCell,
	UsersStack,
	Text,
	Counter,
	CardScroll,
	Footer,
	PullToRefresh
} from '@vkontakte/vkui';
import {
	Icon28HomeOutline,
	Icon28PawOutline,
	Icon28IncognitoOutline,
	Icon28GlobeOutline,
	Icon28Users3Outline,
	Icon28Smiles2Outline,
	Icon28GridSquareOutline,
	Icon24InfoCircleOutline,
	Icon24CubeBoxOutline,
	Icon24StickerOutline,
	Icon24TshirtOutline,
	Icon24CheckCircleOutline,
	Icon28CancelCircleOutline,
	Icon28CheckCircleOutline,
	Icon28SunOutline,
	Icon28MoonOutline,
	Icon28CheckCircleFill,
	Icon28CancelCircleFillRed,
	Icon28DonateCircleFillYellow,
	Icon28ListCircleFillGray,
	Icon28NewsfeedOutline,
	Icon28HelpOutline,
	Icon28LikeOutline,
	Icon56LikeOutline,
	Icon28CopyOutline,
	Icon28UserCircleOutline,
	Icon28PinOutline,
	Icon56FaceIdOutline,
	Icon28GraphOutline,
	Icon28KeyOutline,
	Icon28UserCardOutline,
	Icon28UserOutline,
	Icon12OnlineVkmobile,
} from '@vkontakte/icons';

// import Tasks from './panels/home/tasks.js';

import '@vkontakte/vkui/dist/vkui.css';
import '@vkontakte/vkui/dist/fonts.css'
import './style.css';

import Items from './data/items.json';
import Collections from './data/collections.json';
// import Bosses from './data/bosses.json';

import dataMain from './data/main.json';
import dataMap from './data/map.json';
import dataBosses from './data/boss.json';
import dataArena from './data/arena.json';
import dataCharacter from './data/character.json';
import dataGuild from './data/guild.json';
import dataOther from './data/other.json';
dataArena.season = dataArena.season.reverse();
dataOther.events = dataOther.events.reverse();

const x2js = new X2JS();

let queryParams = null;
let hashParams = null;

let api_id = 5536422;
let DEFAULT_AUTHORIZATION = [{
	id: '628113656',
	login: '292859277',
	password: 'de73003f6d508e583e9c7f316024abbf',
}, {
	id: '628128530',
	login: '292859277',
	password: 'de73003f6d508e583e9c7f316024abbf',
}, {
	id: '12591',
	login: 'GI35gYrUj8YOaE8+V3RYiOm7yn+QWroYrvN1cSt8lZ0=',
	password: 'GI35gYrUj8YOaE8+V3RYiOm7yn+QWroYrvN1cSt8lZ0=',
}, {
	login: '584840646046,597549694268',
	password: '60a2b68552999dcb1126611e6e008d48,-s-7Un0j3I8qVnwDYKbr1o2C-PWrwtvcXMUP.rydZR3qxL0eaLcK1oUE6t-KUpwdYQTMwswgVPcOWp2CdJaNxnveYM2',
}, {
	login: '584840646046,628131408',
	password: '60a2b68552999dcb1126611e6e008d48,-s-7Un0j3I8qVnwDYKbr1o2C-PWrwtvcXMUP.rydZR3qxL0eaLcK1oUE6t-KUpwdYQTMwswgVPcOWp2CdJaNxnveYM2',
}, {
	id: '12595',
	login: '210697718',
	password: '1302195fadf424defdc77c06948d00e9',
}];
let syncUser = null;
let syncUserGame = null;
let isDonut = false;
let dataDonutUser = [];
let isDev = false;
let syncItems = [];
let syncItemsFull = [];
let login = null;
let server = 1;
let isMask = false;
let serverStatus = false;
let serverStatusTime = 0;

const islocalStorage = (() => {
	try {
		localStorage.setItem('islocalStorage', 'islocalStorage');
		localStorage.removeItem('islocalStorage');
		return true;
	} catch(e) {
		return false;
	}
})();
const parseQueryString = (string = '') => {
	if (string && string.length) {
		return string.slice(1).split('&')
			.map((queryParam) => {
				let kvp = queryParam.split('=');
				return {key: kvp[0], value: kvp[1]}
			})
			.reduce((query, kvp) => {
				query[kvp.key] = kvp.value;
				return query
			}, {})
	} else {
		return null;
	}
};
Object.defineProperty(Array.prototype, 'includesArray', {
	value: function(searchElement) {
		let elements = Object(this);
		if ((elements.length >>> 0) === 0) return false;
		if ((searchElement.length >>> 0) === 0) return false;
		for (let element of searchElement) if (elements.includes(element)) return true;
		return false;
	}
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const wikiVersion = '1.8.1';
const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
const serverHub = [{
	id: 1,
	name: 'Эрмун',
	api: 'vk1',
	site: 'vk.com',
	company: 'ВКонтакте',
	logo: `${pathImages}main/logo_vk.svg`,
}, {
	id: 2,
	name: 'Антарес',
	api: 'vk2',
	site: 'vk.com',
	company: 'ВКонтакте',
	logo: `${pathImages}main/logo_vk.svg`,
}, {
	id: 3,
	name: 'Эрмун',
	api: 'ya',
	site: 'yandex.ru',
	company: 'Яндекс',
	logo: `${pathImages}main/logo_yandex.svg`,
}, {
	id: 4,
	name: 'Эрмун',
	api: 'ok1',
	site: 'ok.ru',
	company: 'Одноклассники',
	logo: `${pathImages}main/logo_ok.svg`,
}, {
	id: 5,
	name: 'Антарес',
	api: 'ok2',
	site: 'ok.ru',
	company: 'Одноклассники',
	logo: `${pathImages}main/logo_ok.svg`,
}, {
	id: 6,
	name: 'Эрмун',
	api: 'gm',
	site: 'vkplay.ru',
	company: 'VK Play',
	logo: `${pathImages}main/logo_vk.svg`,
}];


import MODAL_alert from './modals/alert';
import MODAL_donut from './modals/donut';
import MODAL_item from './modals/item';
import MODAL_description from './modals/description';
import MODAL_getSettings from './modals/getSettings';
import MODAL_getSettings__id from './modals/getSettings-id';
import MODAL_getSettings__login from './modals/getSettings-login';
import MODAL_getSettings__password from './modals/getSettings-password';
import MODAL_getSettings__server from './modals/getSettings-server';
import MODAL_getSettings__order from './modals/getSettings-order';
import MODAL_mediaArenaItems from './modals/mediaArenaItems';
import MODAL_mediaEventsItems from './modals/mediaEventsItems';
import MODAL_mediaSales from './modals/mediaSales';


import PANEL_profile__1 from './panels/profile/1';
import PANEL_profile__2 from './panels/profile/2';
import PANEL_profile__3 from './panels/profile/3';
import PANEL_profile__4 from './panels/profile/4';
import PANEL_profile__5 from './panels/profile/5';
import PANEL_profile__6 from './panels/profile/6';
import PANEL_profile__7 from './panels/profile/7';
// import PANEL_profile__8 from './panels/profile/8';
import PANEL_profile__9 from './panels/profile/9';
import PANEL_profile__10 from './panels/profile/10';

import VIEW_rating from './panels/rating/rating';

import PANEL_map__1 from './panels/map/1';
import PANEL_map__2 from './panels/map/2';
import PANEL_map__3 from './panels/map/3';
import PANEL_map__4 from './panels/map/4';
import PANEL_map__5 from './panels/map/5';
import PANEL_map__6 from './panels/map/6';
import PANEL_map__7 from './panels/map/7';

import PANEL_bosses__1 from './panels/bosses/1';
import PANEL_bosses__2 from './panels/bosses/2';

import PANEL_arena__1 from './panels/arena/1';
import PANEL_arena__2 from './panels/arena/2';
import PANEL_arena__3 from './panels/arena/3';
import PANEL_arena__4 from './panels/arena/4';

import PANEL_character__1 from './panels/character/1';
import PANEL_character__2 from './panels/character/2';
import PANEL_character__3 from './panels/character/3';
import PANEL_character__4 from './panels/character/4';
import PANEL_character__5 from './panels/character/5';
import PANEL_character__6 from './panels/character/6';

import PANEL_guild__1 from './panels/guild/1';
import PANEL_guild__2 from './panels/guild/2';
import PANEL_guild__3 from './panels/guild/3';
import PANEL_guild__4 from './panels/guild/4';
import PANEL_guild__5 from './panels/guild/5';
import PANEL_guild__6 from './panels/guild/6';
import PANEL_guild__7 from './panels/guild/7';

import PANEL_other__1 from './panels/other/1';
import PANEL_other__2 from './panels/other/2';
import PANEL_other__3 from './panels/other/3';
import PANEL_other__4 from './panels/other/4';
import PANEL_other__5 from './panels/other/5';

// import Tasks from './panels/home/tasks';

const logger = async(label, array) => {
	if (label && array) {
		let startGroup, endGroup;
		if (console.groupCollapsed) {
			startGroup = function (label) { return console.groupCollapsed(...label); };
			endGroup = function () { return console.groupEnd(); };
		} else if (console.group) {
			startGroup = function (label) { return console.group(...label); };
			endGroup = function () { return console.groupEnd(); };
		} else {
			startGroup = async() => {};
			endGroup = async() => {};
		}
		startGroup(label);
		for (const item of array) {
			if (item.type == 1) {
				console.warn(item.label?item.label:'', typeof item.message!='undefined'?item.message:item);
			} else if (item.type == 2) {
				console.error(item.label?item.label:'', typeof item.message!='undefined'?item.message:item);
			} else {
				console.log(item.label?item.label:'', typeof item.message!='undefined'?item.message:item);
			}
		}
		endGroup();
	} else {
		console.log(array);
	}
};

const App = withAdaptivity(({ viewWidth }) => {
	const platform = usePlatform();
	const isEmbedded = bridge.isEmbedded();
	const isWebView = bridge.isWebView();
	const isIframe = bridge.isIframe();
	const isStandalone = bridge.isStandalone();
	const isDesktop = viewWidth >= ViewWidth.SMALL_TABLET;
	logger(['%c[Warlord Helper] Navigator', 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;'], [{
		label: 'platform',
		message: platform
	}, {
		label: 'isEmbedded',
		message: isEmbedded
	}, {
		label: 'isWebView',
		message: isWebView
	}, {
		label: 'isIframe',
		message: isIframe
	}, {
		label: 'isStandalone',
		message: isStandalone
	}, {
		label: 'isDesktop',
		message: isDesktop
	}, {
		label: 'islocalStorage',
		message: islocalStorage
	}]);
	const getBridge = async(method, params) => {
		let data = null;
		try {
			data = await bridge.send(method, params);
		} catch (error) {
			data = error;
			// console.log(error);
		}
		return data;
	};
	const getFormData = (link) => {
		const body = parseQueryString(new URL(link).search);
		let data = new FormData();
		for (let [key, value] of Object.entries(body)) data.append(key, value);
		return data;
	};
	const getData = async(type, link) => {
		if (link == null) link = type;
		if (type && link) {
			try {
				let data;
				link = link.replace(/%2B/g, '+').replace(/%3D/g, '=');
				if (link.includes('tmp1-fb.geronimo.su')) {
					data = await fetch(new URL(link).origin + new URL(link).pathname, {
						method: 'POST',
						body: getFormData(link),
					});
					if (data.status == 500) data = await fetch(link);
				} else {
					data = await fetch(link);
				}
				data = await data.text();
				let text = data.toString();
				if (data == 'Err. More than 1 request per second' || data == 'Too many requests per second.') {
					await wait(1000);
					return await getData(type, link);
				}
				try {
					data = JSON.parse(data);
				} catch (error) {
					data = data.replace(/('(.+?|)??'|"(.+?|)??")/g, (match, p1, p2, p3, offset, string) => `"${(p3||p2||'').replace(/&/g, '&amp;').replace(/'/g, '&#039;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
					data = await x2js.xml_str2json(data);
				}
				if (data && data.data != undefined) data = data.data;
				return data || text || null;
			} catch (error) {
				// console.log(error);
				return null;
			}
		}
	};
	const getGame = async(server = 'vk1', body = {}, auth = {}, type = 1, completeData = false) => {
		// console.warn(server, body, auth);
		/*
			type = 1, стандартный запрос
			type = 2, запрос на хаб
			type = 3, запрос на характеристики
		*/
		if (!server) return 'Укажите сервер запроса';
		if (type == 1) {
			if (!body) return 'Укажите тело запроса';
			if (!auth?.login) return 'Укажите логин запроса';
			if (!auth?.password) return 'Укажите пароль запроса';
		}
		if (auth?.id) auth.id = String(auth.id);
		if (auth?.login) auth.login = String(auth.login);
		if (auth?.password) auth.password = String(auth.password);
		let host;
		let request;
		if (server == 'vk1' || server == 1) {
			host = 'tmp1-fb.geronimo.su/';
			request = {
				api_type: 'vk',
				api_id: 5536422,
			};
			if (type == 1) {
				host += 'warlord_vk/game.php';
				request = {
					...request,
					sslt: 0,
					api_uid: auth.login,
					auth_key: auth.password,
				};
				if (Object.keys(body).length) request.UID = auth.id || auth.login;
			}
			if (type == 2) {
				host += 'gameHub/index.php';
				request = {
					...request,
					api_uid: auth.login,
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (server == 'vk2' || server == 2) {
			host = 'tmp1-fb.geronimo.su/';
			request = {
				api_type: 'vk',
				api_id: 5536422,
			};
			if (type == 1) {
				host += 'warlord_vk2/game.php';
				request = {
					...request,
					sslt: 0,
					api_uid: auth.login,
					auth_key: auth.password,
				};
				if (Object.keys(body).length) request.UID = auth.id || auth.login;
			}
			if (type == 2) {
				host += 'gameHub/index.php';
				request = {
					...request,
					api_uid: auth.login,
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (server == 'ya' || server == 3) {
			host = 'gs1.geronimo.su/';
			request = {
				api_type: 'ya',
				api_id: 100430,
			};
			if (type == 1) {
				host += 'warlord_ya1/game.php';
				request = {
					...request,
					sslt: 0,
					api_uid: auth.login,
					lapi_uid: auth.password,
				};
				if (Object.keys(body).length) request.UID = auth.id || auth.login;
			}
			if (type == 2) {
				host += 'gameHub/index.php';
				request = {
					...request,
					api_uid: auth.login,
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (server == 'ok1' || server == 4) {
			host = 'tmp1-fb.geronimo.su/';
			request = {
				api_type: 'ok',
			};
			if (type == 1) {
				host += 'OK_WARLORD/game.php';
				request = {
					...request,
					sslt: 0,
					session_key: auth.password.split(',')[1],
					api_uid: auth.login.split(',')[0],
					auth_sig: auth.password.split(',')[0],
					UID: auth.login.split(',')[1],
				};
				if (Object.keys(body).length) request.UID = auth.login.split(',')[1];
			}
			if (type == 2) {
				host += 'gameHubOk/index.php';
				request = {
					...request,
					api_uid: auth.login.split(',')[0],
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (server == 'ok2' || server == 5) {
			host = 'tmp1-fb.geronimo.su/';
			request = {
				api_type: 'ok',
			};
			if (type == 1) {
				host += 'OK_WARLORD2/game.php';
				request = {
					...request,
					sslt: 0,
					session_key: auth.password.split(',')[1],
					api_uid: auth.login.split(',')[0],
					auth_sig: auth.password.split(',')[0],
					UID: auth.login.split(',')[1],
				};
				if (Object.keys(body).length) request.UID = auth.login.split(',')[1];
			}
			if (type == 2) {
				host += 'gameHubOk/index.php';
				request = {
					...request,
					api_uid: auth.login.split(',')[0],
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (server == 'gm' || server == 6) {
			host = 'gs1.geronimo.su/';
			request = {
				api_type: 'gm',
				api_id: 5782,
			};
			if (type == 1) {
				host += 'warlord_ya1/game.php';
				request = {
					...request,
					sslt: 0,
					api_uid: auth.login,
					auth_key: auth.password,
					currency: 'RUB',
					lang: 'ru_RU',
				};
				if (Object.keys(body).length) request.UID = auth.id || auth.login;
			}
			if (type == 2) {
				host += 'gameHub/index.php';
				request = {
					...request,
					api_uid: auth.login,
				};
			}
			request = {
				...request,
				...body,
			};
		}
		if (!host) return 'Укажите хост запроса';
		if (!request) return 'Укажите запрос запроса';
		let data = await getData(`https://${host}?${new URLSearchParams(request).toString()}`);
		if (type == 2) {
			if (data?.s) typeof data?.s?.length == 'undefined' ? data.s = [data?.s] : [];
			if (!completeData) {
				data = data?.s?.find(s => s._n == serverHub[server-1]?.name);
			} else {
				data = data?.s;
			}
		}
		return data;
	};

	bridge.subscribe(({ detail: { type, data }}) => {
		switch (type) {
			case 'VKWebAppUpdateConfig':
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = ['space_gray', 'vkcom_dark'].includes(data.scheme) ? 'space_gray' : 'bright_light';
				document.body.attributes.setNamedItem(schemeAttribute);
				break;
			default:
		}
	});
	bridge.send("VKWebAppInit");

	const getParseBosses = async() => {
		let xml = `<bosses></bosses>`;
		let response = await x2js.xml_str2json(xml);
		let result = [];
		response.bosses.npc.forEach((item, x) => {
			result.push({
				id: Number(item.u._id),
				name: item.u._name,
				description: item.u._descr,
				hp: Number(item.u._mod_hp),
				dmg: Number(item.u._dmg),
				type: Number(item.u._solo),
				time: Number(item.u._rtm),
				tries: Number(item.u._rlmt),
				energy: Number(item.u._rq2),
				rewards: {
					exp: Number(item.r._exp),
					m1: Number(item.r._m1),
					m2: Number(item.r._m3),
				},
				background: `bosses/backgrounds/${Number(item.u._bg_id)}.png`,
				image: `bosses/images/${Number(item.u._id)}.png`,
				icon: `bosses/icons/${Number(item.u._id)}.png`
			});
		});
		for (let boss of result) {
			let findBoss = Bosses.find(item => item.id == boss.id);
			if (findBoss) {
				if (findBoss.hp != boss.hp) {
					console.warn(boss.name, 'hp', {
						current: findBoss.hp,
						new: boss.hp,
					});
					findBoss.hp = boss.hp;
				}
				if (findBoss.dmg != boss.dmg) {
					console.warn(boss.name, 'dmg', {
						current: findBoss.dmg,
						new: boss.dmg,
					});
					findBoss.dmg = boss.dmg;
				}
				if (findBoss.type != boss.type) {
					console.warn(boss.name, 'type', {
						current: findBoss.type,
						new: boss.type,
					});
					findBoss.type = boss.type;
				}
				if (findBoss.time != boss.time) {
					console.warn(boss.name, 'time', {
						current: findBoss.time,
						new: boss.time,
					});
					findBoss.time = boss.time;
				}
				if (findBoss.tries != boss.tries) {
					console.warn(boss.name, 'tries', {
						current: findBoss.tries,
						new: boss.tries,
					});
					findBoss.tries = boss.tries;
				}
				if (findBoss.energy != boss.energy) {
					console.warn(boss.name, 'energy', {
						current: findBoss.energy,
						new: boss.energy,
					});
					findBoss.energy = boss.energy;
				}
				if (JSON.stringify(findBoss.rewards) != JSON.stringify(boss.rewards)) {
					console.warn(boss.name, 'rewards', {
						current: findBoss.rewards,
						new: boss.rewards,
					});
				}
			}
		}
	};
	// getParseBosses();
	const getParseMap = async() => {
		let xml = `<maps></maps>`;
		let response = await x2js.xml_str2json(xml);
		let result = [];
		response.maps.map.forEach((item, x) => {
			result.push({
				id: Number(item._id)-1,
				title: item._n,
				description: item._ds,
				lvl: Number(item._rul),
				boss: Bosses.findIndex(boss => boss.id == Number(item._d3)) == -1 ? false : Bosses.findIndex(boss => boss.id == Number(item._d3)),
			});
		});
		let Maps = dataMap.regions.map((item) => item.items).flat(1);
		for (let map of result) {
			let findMap = Maps.find(item => item.id == map.id);
			if (findMap) {
				if (findMap.lvl != map.lvl) {
					console.log(map.title, 'lvl', {
						current: findMap.lvl,
						new: map.lvl,
					});
					findMap.lvl = map.lvl;
				}
				if (findMap.boss != map.boss) {
					console.log(map.title, 'boss', {
						current: findMap.boss,
						new: map.boss,
					});
					findMap.boss = map.boss;
				}
			}
		}
	};
	// getParseMap();
	const getParseItems = async() => {
		let xml = `<shop></shop>`;
		let response = await x2js.xml_str2json(xml);
		let result = [];
		response.shop.i.forEach((item, x) => {
			result.push({
				id: Number(item._id),
				type: Number(item._cat),
				title: item._name,
				dmg: Number(item._d2),
				hp: Number(item._d4),
				currency: 
					Number(item._p1) !== 0 ? 1 :
					Number(item._p2) !== 0 ? 2 :
					Number(item._p3) !== 0 ? 3 :
					Number(item._p4) !== 0 ? 4 :
					Number(item._p5) !== 0 ? 5 :
					Number(item._p6) !== 0 ? 6 :
					0,
				price: 
					Number(item._p1) !== 0 ? Number(item._p1) :
					Number(item._p2) !== 0 ? Number(item._p2) :
					Number(item._p3) !== 0 ? Number(item._p3) :
					Number(item._p4) !== 0 ? Number(item._p4) :
					Number(item._p5) !== 0 ? Number(item._p5) :
					Number(item._p6) !== 0 ? Number(item._p6) :
					0,
			});
		});
		for (let elem of result) {
			let findItem = Items.find(item => item.id == elem.id);
			if (findItem) {
				if (findItem.type != elem.type) {
					console.log(elem.title, 'type', {
						current: findItem.type,
						new: elem.type,
					});
					findItem.type = elem.type;
				}
				if (findItem.dmg != elem.dmg) {
					console.log(elem.title, 'dmg', {
						current: findItem.dmg,
						new: elem.dmg,
					});
					findItem.dmg = elem.dmg;
				}
				if (findItem.hp != elem.hp) {
					console.log(elem.title, 'hp', {
						current: findItem.hp,
						new: elem.hp,
					});
					findItem.hp = elem.hp;
				}
				if (findItem.currency != elem.currency) {
					console.log(elem.title, 'currency', {
						current: findItem.currency,
						new: elem.currency,
					});
					findItem.currency = elem.currency;
				}
				if (findItem.price != elem.price) {
					console.log(elem.title, 'price', {
						current: findItem.price,
						new: elem.price,
					});
					findItem.price = elem.price;
				}
			}
		}
	};
	// getParseItems();
	const getParseXML = async() => {
		let xml = `<?xml version="1.0" encoding="utf-8"?><data><a res="1" /><r  m1="41"  m3="434" /></data>`;
		let data = await x2js.xml_str2json(xml);
		if (data && data.data != undefined) data = data.data;
		console.log(data);
	};
	// getParseXML();


	class Wiki extends React.Component {
		constructor(props) {
			super(props);
			this.ref__mainSlider = React.createRef();
			this.state = {
				mainSlider: 5,
				snackbar: null,
				popout: <ScreenSpinner />, // <ScreenSpinner />
				activeStory: null, // warlordBosses
				activePanel: null, // profile_1
				activeModal: null, // home
				modalHistoryId: null,
				modalHistory: null,
				dataModal: {}, // home
				theme: 'bright_light',
				fetching: false,

				user: {vk: null, game: null},
				storeProfiles: [],
				storeProfilesFull: [],
				storeProfilesIndex: 0,
				storeProfilesSize: 5,

				checkItems: {null: true, item: true, scroll: true, collection: true, personal: true, stock: true, yesStock: true, noStock: true},

				id: null,
				login: null,
				auth: null,
				server: null,
				serverHub: serverHub,

				getBridge: getBridge,
				getData: getData,
				getGame: getGame,
				
				platform: platform,
				isEmbedded: isEmbedded,
				isWebView: isWebView,
				isIframe: isIframe,
				isStandalone: isStandalone,
				isDesktop: isDesktop,
				islocalStorage: islocalStorage,
				isVK: true
			};
			this.storeProfilesGalleryMainRef = React.createRef();
			this.storeProfilesGalleryChildRef = React.createRef();
		};
		updateFixedLayout = () => {
			try {
				let fidexLayoutTop = document.querySelector('.Sticky.Sticky__top');
				let fidexLayoutBottom = document.querySelector('.Sticky.Sticky__bottom');
				if (fidexLayoutTop && fidexLayoutTop.nextSibling) fidexLayoutTop.nextSibling.style.paddingTop = `${fidexLayoutTop.offsetHeight - 13 + 8}px`;
				if (fidexLayoutBottom && fidexLayoutBottom.previousSibling) fidexLayoutBottom.previousSibling.style.paddingBottom = `${fidexLayoutBottom.offsetHeight}px`;
			} catch (error) {
				console.log(error);
			}
		};
		checkServer = async() => {
			serverStatusTime = +new Date;
			await fetch(`https://tmp1-fb.geronimo.su`).then(function() {
				serverStatus = true;
			}).catch(function() {
				serverStatus = false;
			});
			serverStatusTime = +new Date - serverStatusTime;
			console.log('%c[Warlord Helper] serverStatus', 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;', serverStatus, serverStatusTime);
			this.forceUpdate();
		};
		setTheme = async(update = false) => {
			const { activePanel, activeStory } = this.state;
			const { OpenModal } = this;
			isDev&&console.warn('setTheme', activeStory, activePanel);
			let theme = 'bright_light';
			if (islocalStorage) {
				try {
					theme = localStorage.getItem('VKWikiTheme');
					if (!theme) {
						localStorage.setItem('VKWikiTheme', 'bright_light');
						theme = 'bright_light';
					}
					if (update) {
						theme = theme == 'bright_light' ? 'space_gray' : 'bright_light';
						localStorage.setItem('VKWikiTheme', theme);
					}
				} catch (error) {
					OpenModal(`alert`, {header: 'Ошибка при обновлении темы', subheader: `Разрешите доступ к cookies на этом сайте`}, null, 'card');
					theme = 'bright_light';
				}
			} else if (isEmbedded) {
				try {
					theme = await this.Storage({key: 'VKWikiTheme', defaultValue: theme});
					if (theme) theme = theme.value;
					if (theme && update) {
						theme = theme == 'bright_light' ? 'space_gray' : 'bright_light';
						theme = await this.Storage({key: 'VKWikiTheme', value: theme});
						if (theme) theme = theme.value;
					}
				} catch (error) {
					OpenModal(`alert`, {header: 'Ошибка при обновлении темы', subheader: `Разрешите доступ к cookies на этом сайте`}, null, 'card');
					theme = 'bright_light';
				}
			} else {
				OpenModal(`alert`, {header: 'Ошибка при обновлении темы', subheader: `Разрешите доступ к cookies на этом сайте`}, null, 'card');
				theme = 'bright_light';
			}
			this.setState({theme});
			document.body.setAttribute('scheme', theme);
		};
		Storage = async(data = {key: 'key', defaultValue: 'defaultValue', value: 'value', delete: false}) => {
			/*
				0 - [GET/SAVE/DEL] - в ходе работы произошла ошибка
				1 - [GET] - данные успешно получены
				2 - [GET] - не удалось получить данные и сохранить {defaultValue}
				3 - [GET] - не удалось получить данные
				4 - [SAVE] - данные успешно сохранены
				5 - [DEL] - данные успешно удалены

				await Storage({key: 'key', defaultValue: 'true'})
				- спросить значение по ключу, если его нет, установит true и вернёт его

				await Storage({key: 'key', value: 'true'})
				- установить значение по ключу

				await Storage({key: 'key', delete: true})
				- удалить значение по ключу
			*/
			let storage = { code: 0, value: null, key: data.key };
			try {
				if (data.delete) {
					storage.code = 5;
					storage.value = null;
					await getBridge('VKWebAppStorageSet', {"key": data.key, "value": ""});
				} else if (data.value) {
					data.value = (data.value).toString();
					storage.code = 4;
					storage.value = data.value;
					await getBridge('VKWebAppStorageSet', {"key": data.key, "value": data.value});
				} else {
					let getStorage = await getBridge('VKWebAppStorageGet', {"keys": [data.key]});
					if (getStorage.keys[0].value == "" && data.defaultValue) {
						data.defaultValue = (data.defaultValue).toString();
						storage.code = 3;
						storage.value = data.defaultValue;
						await getBridge('VKWebAppStorageSet', {"key": data.key, "value": data.defaultValue});
					} else if (getStorage.keys[0].value == "") {
						storage.code = 2;
						storage.value = null;
					} else {
						storage.code = 1;
						storage.value = getStorage.keys[0].value;
					}
				}
			} catch (error) {
				console.warn(error);
			}
			return storage;
		};
		infinityGallery = (index, count, state, ref) => {
			try {
				let newIndex = index % count + count;
				if (index < count) {
					ref.current.childNodes[0].style.transition = 'transform 0s';
					this.setState({ [state]: newIndex+1 });
				}
				if (index > count*2-1) {
					ref.current.childNodes[0].style.transition = 'transform 0s';
					this.setState({ [state]: newIndex-1 });
				}
				setTimeout(()=>{
					try {
						ref.current.childNodes[0].classList.add('isActive');
						ref.current.childNodes[0].style.transition = 'transform 0.24s cubic-bezier(0.1, 0, 0.25, 1) 0s';
						this.setState({ [state]: newIndex });
					} catch (error) {}
				}, 0);
			} catch (error) {}
		};
		openSnackbar = (data = {text: 'Text', action: null, icon: null, avatar: null, vertical: false, duration: 3000}) => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('openSnackbar', activeStory, activePanel, data);
			if (this.state.snackbar) {
				this.setState({ snackbar: null });
			}
			if (!data) return;
			let isObject = false;
			if (typeof data.text == 'object') {
				data.text = JSON.stringify(data.text);
				isObject = true;
			}
			this.setState({ snackbar:
				<Snackbar
					className={isObject ? 'Snackbar--isObject' : ''}
					layout={data.vertical}
					duration={data.duration}
					onClose={() => this.setState({ snackbar: null })}
					action={data.action}
					before={data.icon && 
						data.icon == 'done' ? <Icon28CheckCircleFill/> :
						data.icon == 'error' ? <Icon28CancelCircleFillRed/> :
						data.icon == 'donut' ? <Icon28DonateCircleFillYellow/> :
						<Icon28ListCircleFillGray/>
					}
					after={data.avatar && <Avatar src={data.avatar} size={32} />}
				>
					{data.text}
				</Snackbar>
			});
		};
		getCopy = (parent = null, child = null, modal = null) => {
			let href = isEmbedded?'https://vk.com/app7787242':window.location.origin;
			if (parent) href += `#view=${parent}`;
			if (child) href += `&panel=${child}`;
			if (modal) href += `&modal=${modal}`;
			return (<PanelHeaderButton aria-label="copy" onClick={isEmbedded?() => bridge.send(
				"VKWebAppCopyText",
				{"text": href},
				this.openSnackbar({text: 'Ссылка скопирована', icon: 'done', action: href})
			):() => {navigator.clipboard.writeText(href), this.openSnackbar({text: 'Ссылка скопирована', icon: 'done', action: href})}}>
				<Icon28CopyOutline/>
			</PanelHeaderButton>)
		};
		getPanelHeader = (title = 'title', description = 'description', avatar = null, child = null, parent = null) => {
			return (
				<PanelHeader
					className='HeaderFix'
					fixed={!isDesktop}
					separator={isDesktop}
					before={parent&&<PanelHeaderBack onClick={() => this.setActivePanel(parent)}/>}
					after={!(isEmbedded&&!isDesktop)&&this.getCopy(parent, child)}
				>
					<PanelHeaderContent before={avatar&&<Avatar size={36} src={`${pathImages}${avatar}`} />} status={description}>{title}</PanelHeaderContent>
				</PanelHeader>
			)
		};
		onStoryChange = (e) => {
			this.setState({ 
				snackbar: null,
				checkItems: {null: true, item: true, scroll: true, collection: true, personal: true, stock: true, yesStock: true, noStock: true},
				activePanel: null,
				activeStory: e.currentTarget.dataset.story
			});
		};
		isObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]';
		transmittedSetState = async(name, callback = () => {}) => {
			this.setState(name);
			// this.setState(name, callback());
		};
		numberSpaces = (number = 0, symbol = ' ') => {
			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, symbol);
		};
		numberForm = (number, titles) => {
			number = Math.abs(number);
			let cases = [2, 0, 1, 1, 1, 2];
			return titles[(number%100>4&&number%100<20)?2:cases[(number%10<5)?number%10:5]];
		};
		numberRandom = (min = 1, max = 2) => {
			return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
		};
		getMatrix = (element) => {
			const values = element.style.transform.split(/\w+\(|\);?/);
			const transform = values[1]?.split(/,\s?/g)?.map(parseInt) || [0, 0, 0];
			return {
				x: transform[0],
				y: transform[1],
				z: transform[2]
			};
		};
		getRealTime = () => {
			return new Date().toLocaleString("ru", {
				timezone: 'UTC',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric'
			});	
		};
		getTime = (s = 0) => {
			s = Number(s);
			if (s < 0) s = 0;
			if (!Number.isInteger(s)) s = 0;
			let hours = Math.floor(s/(60*60));
			let minutes = parseInt((s/(60))%60);
			let seconds = parseInt((s)%60);
			return `${String(hours).length === 1 ? `0${hours}` : hours}:${String(minutes).length === 1 ? `0${minutes}` : minutes}:${String(seconds).length === 1 ? `0${seconds}` : seconds}`;
		};
		getSort = (array) => {
			try {
				const { activePanel, activeStory, checkItems } = this.state;
				isDev&&console.warn('getSort', activeStory, activePanel);
				return array.sort(function(a, b) {
					return Items[a.id].type < Items[b.id].type ? -1 : 1;
				}).sort(function(a, b) {
					let itemA = (checkItems.item && a.item) && (checkItems.collection && a.collection) && (checkItems.scroll && a.scroll) ? 1 :
								(checkItems.item && a.item) && (checkItems.collection && a.collection) ? 2 :
								(checkItems.item && a.item) && (checkItems.scroll && a.scroll) ? 3 :
								(checkItems.item && a.item) ? 4 :
								(checkItems.collection && a.collection) && (checkItems.scroll && a.scroll) ? 5 :
								(checkItems.collection && a.collection) ? 6 :
								(checkItems.scroll && a.scroll) ? 7 : 8;
					let itemB = (checkItems.item && b.item) && (checkItems.collection && b.collection) && (checkItems.scroll && b.scroll) ? 1 :
								(checkItems.item && b.item) && (checkItems.collection && b.collection) ? 2 :
								(checkItems.item && b.item) && (checkItems.scroll && b.scroll) ? 3 :
								(checkItems.item && b.item) ? 4 :
								(checkItems.collection && b.collection) && (checkItems.scroll && b.scroll) ? 5 :
								(checkItems.collection && b.collection) ? 6 :
								(checkItems.scroll && b.scroll) ? 7 : 8;
					return itemA < itemB ? -1 : 1;
				});
			} catch (error) {
				
			}
		};
		getRichCellDescription = (text = "Полезный текст", label = "Полезная информация", icon = <Icon28PinOutline style={{color: 'var(--icon_secondary)', paddingRight: '18px'}}/>) => {
			return (<RichCell
				style={{alignItems: 'center'}}
				disabled
				multiline
				before={icon}
				caption={<React.Fragment>{text}</React.Fragment>}
			>{label}</RichCell>)
		};
		getItemCell = (data, x = this.numberRandom(1, 999), isFull) => {
			if (data && typeof data.id != 'undefined') {
				const { activePanel, activeStory, checkItems } = this.state;
				const { numberSpaces } = this;
				isDev&&console.warn('getItemCell', activeStory, activePanel);
				let syncItem = syncItems.indexOf(+/\d+/.exec(Items[data.id].icon)) == -1 ? false : true;
				if (!checkItems.stock && syncItem) {
					return;
				}
				checkItems.null = false;
				const item = Items[data.id];
				// if (isFull) console.log(item);
				return (
					<SimpleCell onClick={() => !isFull&&this.OpenModal('item', data)} key={x} className={`ItemCell ${isFull || data.tooltip ? "ItemCell--full" : ""}`}>
						<RichCell
							disabled
							className="ItemCell__main"
							before={<Avatar size={75} src={`${pathImages}${item.icon}`} />}
							// before={<Avatar size={75} src={`${pathImages}items/${item.id}x.png`} />}
							caption={<React.Fragment>
								<span>DMG</span>
								<span>{numberSpaces(item.dmg)}</span>
								<span>HP</span>
								<span>{numberSpaces(item.hp*15)}</span>
							</React.Fragment>}
							after={<div className="ItemCell__price">
								{numberSpaces(item.price)}
								<div style={{backgroundImage: `url(${pathImages}currency/${item.currency}.png)`}}/>
							</div>}
						>
							{item.title}
						</RichCell>
						<RichCell
							disabled
							className="ItemCell__tooltip"
							before={<Icon24InfoCircleOutline/>}
							after={<div className="ItemCell__type">
								{isDonut && checkItems.stock && ((checkItems.item && data.item) || (checkItems.collection && data.collection)) && syncItem && <Icon24CheckCircleOutline style={{color: 'var(--dynamic_green)'}}/>}
								{!isFull && checkItems.item && data.item && <Icon24TshirtOutline />}
								{!isFull && checkItems.collection && data.collection && !data.personal && <Icon24CubeBoxOutline />}
								{!isFull && checkItems.personal && data.personal && <Icon24CubeBoxOutline style={{color: 'var(--destructive)'}}/>}
								{!isFull && checkItems.scroll && data.scroll && <Icon24StickerOutline />}
								{isFull && (item.fragments && item.fragments.length > 0 ? <Icon24CubeBoxOutline /> : <Icon24TshirtOutline />)}
							</div>}
						>
							{isFull ? item.description : data.tooltip && data.tooltip.join(', ')}
						</RichCell>
					</SimpleCell>
				)
			}
		};
		getItemPreview = (data, x, tooltip, item = false, coll = false, levels = false, onClick = false, className = false, action = false) => {
			const { activePanel, activeStory, checkItems } = this.state;
			const { OpenModal } = this;
			isDev&&console.warn('getItemPreview', activeStory, activePanel);
			let syncItem = syncItems.indexOf(data.id) == -1 ? false : true;
			let syncItemFull = levels ? syncItemsFull.find(x => x.id == data.id) : null;
			if (checkItems.yesStock || checkItems.noStock) {
				if (checkItems.yesStock && checkItems.noStock) {
					
				} else {
					if (checkItems.yesStock && !syncItem || checkItems.noStock && syncItem) {
						return;
					}
				}
			} else {
				return;
			}
			if (levels && !syncItem) {
				return;
			}
			let after = (tooltip && item != 'enable') ? false : (!isDonut ? item && <Icon24TshirtOutline width={24} height={24}/> || coll && <Icon24CubeBoxOutline width={24} height={24}/> : syncItem ? <Icon28CheckCircleOutline width={24} height={24} style={{color: 'var(--dynamic_green)'}}/> : <Icon28CancelCircleOutline width={24} height={24} style={{color: 'var(--destructive)'}}/>);
			return (
				<Card key={x} id={`modal_${x+1}`} onClick={action ? () => {} : onClick ? onClick : () => OpenModal(`item`, {id: Items.findIndex(item => item.id == data.id), item: item, collection: coll, description: data.description})} className={`Card__Item${after ? ' Card__Item--after' : ''}${className ? ` ${className}` : ''}${action ? ` Card__Item--action` : ''}`}>
					<RichCell 
						before={<div className="Card__image">
							<Spinner size="regular" className="Card__imagePreload" />
							<Avatar style={{objectFit: "none"}} mode="app" src={`${pathImages}${data.icon}`} size={60}/>
						</div>}
						caption={syncItemFull ? `${syncItemFull.lvl} уровень` : tooltip ? tooltip : data.description}
						after={after || action}
						disabled={action ? true : false}
						bottom={syncItemFull &&
							<UsersStack size="m" visibleCount={3} photos={[
								syncItemFull.stones[0][0]!=0?`${pathImages}stones/${(syncItemFull.stones[0][0]-1)*7+syncItemFull.stones[0][1]}.png`:null,
								syncItemFull.stones[1][0]!=0?`${pathImages}stones/${(syncItemFull.stones[1][0]-1)*7+syncItemFull.stones[1][1]}.png`:null,
								syncItemFull.stones[2][0]!=0?`${pathImages}stones/${(syncItemFull.stones[2][0]-1)*7+syncItemFull.stones[2][1]}.png`:null
							]}/>
						}
					>{data.title}</RichCell>
				</Card>
			)
		};
		setActivePanel = async(name = 'home', close = false) => {
			const { activePanel, activeStory, checkItems } = this.state;
			isDev&&console.warn('setActivePanel', activeStory, activePanel);
			this.setState({ snackbar: null, checkItems: {null: true, item: true, scroll: true, collection: true, personal: true, stock: true, yesStock: true, noStock: true} });
			checkItems.null = true;
			if (name == '1' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '2' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '3' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '4' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '5' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '6' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '7' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '8' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '9' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '10' && activeStory == 'profile') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '1' && activeStory == 'bosses') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '1' && activeStory == 'arena') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '1' && activeStory == 'guild') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '1' && activeStory == 'other') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (name == '5' && activeStory == 'other') {
				if (!isDonut) {
					// this.OpenModal('donut');
					return this.OpenModal('donut');
				}
			}
			if (!close || isDonut) {
				return this.setState({ activePanel: name });
			}
		};
		isCheckItems = (e, id) => {
			const { activePanel, activeStory, checkItems } = this.state;
			isDev&&console.warn('isCheckItems', activeStory, activePanel);
			checkItems.null = true;
			checkItems[id] = e.target.checked;
			this.setState({ checkItems: {null: checkItems.null, item: checkItems.item, scroll: checkItems.scroll, collection: checkItems.collection, personal: checkItems.personal, stock: checkItems.stock, yesStock: checkItems.yesStock, noStock: checkItems.noStock} });
		};
		OpenModal = (id = 'donut', options = {}, index = null) => {
			const { activePanel, activeStory, checkItems, activeModal } = this.state;
			isDev&&console.warn('OpenModal', activeStory, activePanel);
			checkItems.null = true;
			if (!index) index = this.numberRandom(1000, 9999);
			let modalHistoryId = this.state.modalHistoryId ? [...this.state.modalHistoryId] : [];
			let modalHistory = this.state.modalHistory ? [...this.state.modalHistory] : [];
			if (activeModal === null) {
				modalHistoryId = [];
				modalHistory = [];
			} else if (modalHistoryId.indexOf(index) !== -1) {
				modalHistoryId = modalHistoryId.splice(0, modalHistoryId.indexOf(index));
				modalHistory = modalHistory.splice(0, modalHistoryId.indexOf(index));
			} else {
				modalHistoryId.push(this.state.dataModal.modalIndex);
				modalHistory.push(this.state.dataModal);
			}
			this.setState({ 
				activeModal: id,
				dataModal: Object.assign(this.isObject(options)?options:{}, {modalIndex: index}, {modalId: id}),
				modalHistory: modalHistory,
				modalHistoryId: modalHistoryId
			});
			// document.querySelector('.View__panels').classList.add('View--modal');
		};
		BackModal = () => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('BackModal', activeStory, activePanel);
			let modalHistory = this.state.modalHistory;
			if (!modalHistory || modalHistory.length == 0) return this.CloseModal();
			let currentModal = modalHistory[modalHistory.length-1];
			this.OpenModal(currentModal.modalId, currentModal, currentModal.modalIndex);	
		};
		CloseModal = () => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('CloseModal', activeStory, activePanel);
			this.setState({ 
				activeModal: null,
				modalHistory: null,
				modalHistoryId: null,
				// dataModal: {},
				server: isEmbedded&&serverStatus&&this.state.storeProfilesFull[this.state.storeProfilesIndex].server,
				id: isEmbedded&&serverStatus&&this.state.storeProfilesFull[this.state.storeProfilesIndex].id,
				login: isEmbedded&&serverStatus&&this.state.storeProfilesFull[this.state.storeProfilesIndex].login,
				auth: isEmbedded&&serverStatus&&this.state.storeProfilesFull[this.state.storeProfilesIndex].auth,
			});
			// document.querySelector('.View__panels').classList.remove('View--modal');
		};
		BotAPI = async(mode, auth_key, id, sslt = 0, data = {}) => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('BotAPI', activeStory, activePanel, mode);
			if (mode == 'getAuth' && data && data.stage) {
				let auth = null;
				if (data.stage == 'modal') {
					auth = await this.BotAPI('getAuth', null, null, null, {stage: 'get', silence: true});
					auth = auth == 'modal' ? null : auth;
					this.setState({ login: this.state.storeProfiles[this.state.storeProfilesIndex].login || this.state.storeProfiles[this.state.storeProfilesIndex].id, auth: auth, id: this.state.storeProfiles[this.state.storeProfilesIndex].id, server: this.state.storeProfiles[this.state.storeProfilesIndex].server });
					if (data.text) {
						this.OpenModal(`getSettings`, {header: 'Ошибка авторизации', subheader: data.text, error: data.error || '', auth: auth});
					} else {
						this.OpenModal(`getSettings`);
					}
				}
				if (data.stage == 'save') {
					login = this.state.login || Number(this.state.id);
					auth = this.state.auth;
					id = Number(this.state.id);
					server = Number(this.state.server);

					this.state.storeProfiles[this.state.storeProfilesIndex].login = login || id;
					this.state.storeProfiles[this.state.storeProfilesIndex].auth = auth;
					this.state.storeProfiles[this.state.storeProfilesIndex].id = id;
					this.state.storeProfiles[this.state.storeProfilesIndex].server = server;
					await this.Storage({key: 'storeProfiles', value: JSON.stringify(this.state.storeProfiles)});

					this.CloseModal();
					await this.storeProfiles(this.state.storeProfilesIndex);
					// await getBridge('VKWebAppStorageSet', {"key": "auth", "value": auth});
					this.openSnackbar({text: 'Настройки сохранены', icon: 'done'});
				}
				if (data.stage == 'get') {
					if (!this.state.storeProfiles[this.state.storeProfilesIndex].auth) {
						if (!data.silence) this.BotAPI('getAuth', null, null, null, {stage: 'modal'});
						auth = 'modal';
					} else {
						auth = this.state.storeProfiles[this.state.storeProfilesIndex].auth;
						login = this.state.storeProfiles[this.state.storeProfilesIndex].login || Number(this.state.storeProfiles[this.state.storeProfilesIndex].id);
						id = Number(this.state.storeProfiles[this.state.storeProfilesIndex].id);
						server = Number(this.state.storeProfiles[this.state.storeProfilesIndex].server);
					}
				}
				return auth;
			}
			if (mode == 'getStats' && auth_key && id) {
				try {
					let data = await getGame(server, {}, {
						login: id,
						password: auth_key,
					});
					return data.u;
				} catch (error) {
					return null;
				}
			}
			if (mode == 'getAcceptHash' && data && data.key) {
				// console.warn(data.key);
				var Jb = function(a) {
					this.length = a.byteLength;
					this.b = new Uint8Array(a);
					this.b.bufferValue = a;
					a.hxBytes = this;
					a.bytes = this.b
				};
				Jb.ofString = function(a, b) {
					b = [];
					for (var c = 0; c < a.length; ) {
						var e = a.charCodeAt(c++);
						55296 <= e && 56319 >= e && (e = e - 55232 << 10 | a.charCodeAt(c++) & 1023);
						127 >= e ? b.push(e) : (2047 >= e ? b.push(192 | e >> 6) : (65535 >= e ? b.push(224 | e >> 12) : (b.push(240 | e >> 18),
						b.push(128 | e >> 12 & 63)),
						b.push(128 | e >> 6 & 63)),
						b.push(128 | e & 63))
					}
					return new Jb((new Uint8Array(b)).buffer)
				};
				Jb.prototype = {
					length: null,
					b: null,
					data: null,
					blit: function(a, b, c, e) {
						if (0 > a || 0 > c || 0 > e || a + e > this.length || c + e > b.length)
							throw R.thrown(wf.OutsideBounds);
						0 == c && e == b.b.byteLength ? this.b.set(b.b, a) : this.b.set(b.b.subarray(c, c + e), a)
					},
					getString: function(a, b, c) {
						if (0 > a || 0 > b || a + b > this.length)
							throw R.thrown(wf.OutsideBounds);
						c = "";
						var e = this.b
						  , k = ar.fromCharCode
						  , d = a;
						for (a += b; d < a; )
							if (b = e[d++],
							128 > b) {
								if (0 == b)
									break;
								c += k(b)
							} else if (224 > b)
								c += k((b & 63) << 6 | e[d++] & 127);
							else if (240 > b) {
								var f = e[d++];
								c += k((b & 31) << 12 | (f & 127) << 6 | e[d++] & 127)
							} else {
								f = e[d++];
								var g = e[d++];
								b = (b & 15) << 18 | (f & 127) << 12 | (g & 127) << 6 | e[d++] & 127;
								c += k((b >> 10) + 55232);
								c += k(b & 1023 | 56320)
							}
						return c
					},
					toString: function() {
						return this.getString(0, this.length)
					},
					__class__: Jb
				};
				var Nc = function () {};
				Nc.__name__ = "haxe.crypto.Md5";
				Nc.encode = function (a) {
					var b = new Nc;
					a = b.doEncode(Nc.str2blks(a));
					return b.hex(a)
				};
				Nc.str2blks = function (a) {
					var b = Jb.ofString(a),
						c = (b.length + 8 >> 6) + 1;
					a = [];
					for (var e = 0, k = 16 * c; e < k;) {
						var d = e++;
						a[d] = 0
					}
					d = 0;
					k = b.length;
					for (e = 8 * k; d < k;) a[d >> 2] |= b.b[d] << (e + d) % 4 * 8, ++d;
					a[d >> 2] |= 128 << (e + d) % 4 * 8;
					b = 16 * c - 2;
					a[b] = e & 255;
					a[b] |= (e >>> 8 & 255) <<
						8;
					a[b] |= (e >>> 16 & 255) << 16;
					a[b] |= (e >>> 24 & 255) << 24;
					return a
				};
				Nc.prototype = {
					bitOR: function (a, b) {
						return (a >>> 1 | b >>> 1) << 1 | a & 1 | b & 1
					},
					bitXOR: function (a, b) {
						return (a >>> 1 ^ b >>> 1) << 1 | a & 1 ^ b & 1
					},
					bitAND: function (a, b) {
						return (a >>> 1 & b >>> 1) << 1 | a & 1 & b & 1
					},
					addme: function (a, b) {
						var c = (a & 65535) + (b & 65535);
						return (a >> 16) + (b >> 16) + (c >> 16) << 16 | c & 65535
					},
					hex: function (a) {
						for (var b = "", c = 0; c < a.length;) {
							var e = a[c];
							++c;
							b += "0123456789abcdef".charAt(e >> 4 & 15) + "0123456789abcdef".charAt(e & 15);
							b += "0123456789abcdef".charAt(e >> 12 & 15) + "0123456789abcdef".charAt(e >>
								8 & 15);
							b += "0123456789abcdef".charAt(e >> 20 & 15) + "0123456789abcdef".charAt(e >> 16 & 15);
							b += "0123456789abcdef".charAt(e >> 28 & 15) + "0123456789abcdef".charAt(e >> 24 & 15)
						}
						return b
					},
					rol: function (a, b) {
						return a << b | a >>> 32 - b
					},
					cmn: function (a, b, c, e, k, d) {
						return this.addme(this.rol(this.addme(this.addme(b, a), this.addme(e, d)), k), c)
					},
					ff: function (a, b, c, e, k, d, f) {
						return this.cmn(this.bitOR(this.bitAND(b, c), this.bitAND(~b, e)), a, b, k, d, f)
					},
					gg: function (a, b, c, e, k, d, f) {
						return this.cmn(this.bitOR(this.bitAND(b, e), this.bitAND(c, ~e)),
							a, b, k, d, f)
					},
					hh: function (a, b, c, e, k, d, f) {
						return this.cmn(this.bitXOR(this.bitXOR(b, c), e), a, b, k, d, f)
					},
					ii: function (a, b, c, e, k, d, f) {
						return this.cmn(this.bitXOR(c, this.bitOR(b, ~e)), a, b, k, d, f)
					},
					doEncode: function (a) {
						for (var b = 1732584193, c = -271733879, e = -1732584194, k = 271733878, d = 0; d < a.length;) {
							var f = b,
								g = c,
								l = e,
								h = k;
							b = this.ff(b, c, e, k, a[d], 7, -680876936);
							k = this.ff(k, b, c, e, a[d + 1], 12, -389564586);
							e = this.ff(e, k, b, c, a[d + 2], 17, 606105819);
							c = this.ff(c, e, k, b, a[d + 3], 22, -1044525330);
							b = this.ff(b, c, e, k, a[d + 4], 7, -176418897);
							k =
								this.ff(k, b, c, e, a[d + 5], 12, 1200080426);
							e = this.ff(e, k, b, c, a[d + 6], 17, -1473231341);
							c = this.ff(c, e, k, b, a[d + 7], 22, -45705983);
							b = this.ff(b, c, e, k, a[d + 8], 7, 1770035416);
							k = this.ff(k, b, c, e, a[d + 9], 12, -1958414417);
							e = this.ff(e, k, b, c, a[d + 10], 17, -42063);
							c = this.ff(c, e, k, b, a[d + 11], 22, -1990404162);
							b = this.ff(b, c, e, k, a[d + 12], 7, 1804603682);
							k = this.ff(k, b, c, e, a[d + 13], 12, -40341101);
							e = this.ff(e, k, b, c, a[d + 14], 17, -1502002290);
							c = this.ff(c, e, k, b, a[d + 15], 22, 1236535329);
							b = this.gg(b, c, e, k, a[d + 1], 5, -165796510);
							k = this.gg(k, b, c, e, a[d +
								6], 9, -1069501632);
							e = this.gg(e, k, b, c, a[d + 11], 14, 643717713);
							c = this.gg(c, e, k, b, a[d], 20, -373897302);
							b = this.gg(b, c, e, k, a[d + 5], 5, -701558691);
							k = this.gg(k, b, c, e, a[d + 10], 9, 38016083);
							e = this.gg(e, k, b, c, a[d + 15], 14, -660478335);
							c = this.gg(c, e, k, b, a[d + 4], 20, -405537848);
							b = this.gg(b, c, e, k, a[d + 9], 5, 568446438);
							k = this.gg(k, b, c, e, a[d + 14], 9, -1019803690);
							e = this.gg(e, k, b, c, a[d + 3], 14, -187363961);
							c = this.gg(c, e, k, b, a[d + 8], 20, 1163531501);
							b = this.gg(b, c, e, k, a[d + 13], 5, -1444681467);
							k = this.gg(k, b, c, e, a[d + 2], 9, -51403784);
							e = this.gg(e,
								k, b, c, a[d + 7], 14, 1735328473);
							c = this.gg(c, e, k, b, a[d + 12], 20, -1926607734);
							b = this.hh(b, c, e, k, a[d + 5], 4, -378558);
							k = this.hh(k, b, c, e, a[d + 8], 11, -2022574463);
							e = this.hh(e, k, b, c, a[d + 11], 16, 1839030562);
							c = this.hh(c, e, k, b, a[d + 14], 23, -35309556);
							b = this.hh(b, c, e, k, a[d + 1], 4, -1530992060);
							k = this.hh(k, b, c, e, a[d + 4], 11, 1272893353);
							e = this.hh(e, k, b, c, a[d + 7], 16, -155497632);
							c = this.hh(c, e, k, b, a[d + 10], 23, -1094730640);
							b = this.hh(b, c, e, k, a[d + 13], 4, 681279174);
							k = this.hh(k, b, c, e, a[d], 11, -358537222);
							e = this.hh(e, k, b, c, a[d + 3], 16, -722521979);
							c = this.hh(c, e, k, b, a[d + 6], 23, 76029189);
							b = this.hh(b, c, e, k, a[d + 9], 4, -640364487);
							k = this.hh(k, b, c, e, a[d + 12], 11, -421815835);
							e = this.hh(e, k, b, c, a[d + 15], 16, 530742520);
							c = this.hh(c, e, k, b, a[d + 2], 23, -995338651);
							b = this.ii(b, c, e, k, a[d], 6, -198630844);
							k = this.ii(k, b, c, e, a[d + 7], 10, 1126891415);
							e = this.ii(e, k, b, c, a[d + 14], 15, -1416354905);
							c = this.ii(c, e, k, b, a[d + 5], 21, -57434055);
							b = this.ii(b, c, e, k, a[d + 12], 6, 1700485571);
							k = this.ii(k, b, c, e, a[d + 3], 10, -1894986606);
							e = this.ii(e, k, b, c, a[d + 10], 15, -1051523);
							c = this.ii(c, e, k, b, a[d + 1],
								21, -2054922799);
							b = this.ii(b, c, e, k, a[d + 8], 6, 1873313359);
							k = this.ii(k, b, c, e, a[d + 15], 10, -30611744);
							e = this.ii(e, k, b, c, a[d + 6], 15, -1560198380);
							c = this.ii(c, e, k, b, a[d + 13], 21, 1309151649);
							b = this.ii(b, c, e, k, a[d + 4], 6, -145523070);
							k = this.ii(k, b, c, e, a[d + 11], 10, -1120210379);
							e = this.ii(e, k, b, c, a[d + 2], 15, 718787259);
							c = this.ii(c, e, k, b, a[d + 9], 21, -343485551);
							b = this.addme(b, f);
							c = this.addme(c, g);
							e = this.addme(e, l);
							k = this.addme(k, h);
							d += 16
						}
						return [b, c, e, k]
					},
					__class__: Nc
				};
				let hash = Nc.encode(data.key);
				return hash;
			}
			if (mode == 'getFightHash' && data && data.key) {
				// console.log(data.key);
				var Jb = function(a) {
					this.length = a.byteLength;
					this.b = new Uint8Array(a);
					this.b.bufferValue = a;
					a.hxBytes = this;
					a.bytes = this.b
				};
				Jb.ofString = function(a, b) {
					b = [];
					for (var c = 0; c < a.length; ) {
						var e = a.charCodeAt(c++);
						55296 <= e && 56319 >= e && (e = e - 55232 << 10 | a.charCodeAt(c++) & 1023);
						127 >= e ? b.push(e) : (2047 >= e ? b.push(192 | e >> 6) : (65535 >= e ? b.push(224 | e >> 12) : (b.push(240 | e >> 18),
						b.push(128 | e >> 12 & 63)),
						b.push(128 | e >> 6 & 63)),
						b.push(128 | e & 63))
					}
					return new Jb((new Uint8Array(b)).buffer)
				};
				Jb.prototype = {
					length: null,
					b: null,
					data: null,
					blit: function(a, b, c, e) {
						if (0 > a || 0 > c || 0 > e || a + e > this.length || c + e > b.length)
							throw R.thrown(wf.OutsideBounds);
						0 == c && e == b.b.byteLength ? this.b.set(b.b, a) : this.b.set(b.b.subarray(c, c + e), a)
					},
					getString: function(a, b, c) {
						if (0 > a || 0 > b || a + b > this.length)
							throw R.thrown(wf.OutsideBounds);
						c = "";
						var e = this.b
						  , k = ar.fromCharCode
						  , d = a;
						for (a += b; d < a; )
							if (b = e[d++],
							128 > b) {
								if (0 == b)
									break;
								c += k(b)
							} else if (224 > b)
								c += k((b & 63) << 6 | e[d++] & 127);
							else if (240 > b) {
								var f = e[d++];
								c += k((b & 31) << 12 | (f & 127) << 6 | e[d++] & 127)
							} else {
								f = e[d++];
								var g = e[d++];
								b = (b & 15) << 18 | (f & 127) << 12 | (g & 127) << 6 | e[d++] & 127;
								c += k((b >> 10) + 55232);
								c += k(b & 1023 | 56320)
							}
						return c
					},
					toString: function() {
						return this.getString(0, this.length)
					},
					__class__: Jb
				};
				class ar {
					constructor() { }
					static fromCharCode(a) {
						return String.fromCodePoint(a);
					}
				}
				class Sl {
					constructor(a) {
						for (var b = a.length, c = 1; b > 1 << c;)
							++c;
						if (8 < c || b != 1 << c)
							throw R.thrown("BaseCode : base length must be a power of two.");
						this.base = a;
						this.nbits = c;
					}
					encodeBytes(a) {
						for (var b = this.nbits, c = this.base, e = 8 * a.length / b | 0, k = new Jb(new ArrayBuffer(e + (0 == 8 * a.length % b ? 0 : 1))), d = 0, f = 0, g = (1 << b) - 1, t = 0, l = 0; l < e;) {
							for (; f < b;)
								f += 8,
									d <<= 8,
									d |= a.b[t++];
							f -= b;
							k.b[l++] = c.b[d >> f & g] & 255;
						}
						0 < f && (k.b[l++] = c.b[d << b - f & g] & 255);
						return k;
					}
				};
				class Xd {
					static encode(a, b = true) {
						null == b && (b = !0);
						var c = (new Sl(Xd.BYTES)).encodeBytes(a).toString();
						if (b)
							switch (a.length % 3) {
								case 1:
									c += "==";
									break;
								case 2:
									c += "=";
							}
						return c;
					}
				};
				Xd.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
				Xd.BYTES = Jb.ofString(Xd.CHARS);
				let hash = Jb.ofString(data.key);
				hash = Xd.encode(hash) + "Bd" + Math.ceil(9 * Math.random()) + "rP";
				hash = hash.split("").reverse().join("");
				hash = Jb.ofString(hash);
				hash = Xd.encode(hash);
				return hash;
			}
		};
		storeProfilesRefresh = async() => {
			this.setState({ fetching: true });
			await this.Storage({key: 'storeProfiles', value: JSON.stringify(this.state.storeProfiles)});
			let index = this.state.storeProfilesIndex;
			let firstIndex = 0;
			let lastIndex = this.state.storeProfiles.length-[...this.state.storeProfiles].reverse().findIndex(profile => profile.id)-1;
			await this.storeProfiles(this.state.storeProfiles[index]?.id ? index : lastIndex ? lastIndex : firstIndex);
			this.setState({ fetching: false});
		};
		storeProfiles = async(id) => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('loadProfile', activeStory, activePanel);
			this.setState({ popout: <ScreenSpinner /> });
			let to = this.state.storeProfiles[id];
			if (to) {
				if (to.id) {
					if (to.id == 0) to.id = 1;
					if (to.server == 0) to.server = 1;
					this.state.storeProfilesIndex = id;
					isMask = to.id;
					server = to.server;
					this.state.id = to.id;
					if (to.login == 0) to.login = to.id;
					this.state.login = to.login;
					this.state.auth = to.auth;
					this.state.server = to.server;
					syncUser = null;
					document.body.setAttribute('platformAccent', ['vk', 'vk', 'yandex', 'ok', 'ok'][this.state.server-1]);
					await this.loadProfile(false, true, server, true);
				} else {
					if (isDonut) {
						this.state.id = null;
						this.state.login = null;
						this.state.auth = null;
						this.state.server = null;
						document.body.setAttribute('platformAccent', ['vk', 'vk', 'yandex', 'ok', 'ok'][this.state.server-1]);
						this.OpenModal(`getSettings`, {mode: 'add'});
					} else {
						this.OpenModal('donut');
					}
				}
			} else {
				this.OpenModal(`alert`, {header: 'Ошибка при обработке запроса', subheader: `Профиль под номером ${id} вызывает ошибки, попробуйте сменить его ID или обратитесь за помощью в группу`}, null, 'card');
			}
			this.setState({ popout: null });
		};
		addProfileInStore = async() => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('addProfileInStore', activeStory, activePanel);
			if (!this.state.storeProfiles.find(user => user.id == Number(this.state.id))) {
				if (Number(this.state.id) == 0 || this.state.login == null || this.state.auth == null || this.state.server == null) {
					this.openSnackbar({text: 'Указаны не все параметры', icon: 'error'});
				} else {
					let slot = this.state.storeProfiles.findIndex(profile => profile.id == null);
					if (slot == -1) {
						this.openSnackbar({text: 'Нет свободных мест', icon: 'error'});
					} else {
						this.state.storeProfiles[slot] = {
							server: Number(this.state.server),
							id: Number(this.state.id),
							login: this.state.login,
							auth: this.state.auth,
						};
						await this.Storage({key: 'storeProfiles', value: JSON.stringify(this.state.storeProfiles)});
						this.CloseModal();
						this.openSnackbar({text: 'Профиль добавлен', icon: 'done'});
						await this.storeProfiles(slot);
					}
				}
			} else {
				this.openSnackbar({text: 'Профиль уже существует', icon: 'error'});
			}
		};
		removeProfileInStore = async() => {
			const { activePanel, activeStory } = this.state;
			isDev&&console.warn('removeProfileInStore', activeStory, activePanel);
			let count = Number((await this.Storage({key: 'storeProfilesDeleted', defaultValue: '0'})).value) || 0;
			if (count <= 5) {
				await this.Storage({key: 'storeProfilesDeleted', value: String(count+1)});
				this.state.storeProfiles.splice(this.state.storeProfilesIndex, 1);
				this.state.storeProfiles.push({
					id: null
				});
				await this.Storage({key: 'storeProfiles', value: JSON.stringify(this.state.storeProfiles)});
				this.state.storeProfilesFull = this.state.storeProfiles.slice();
				this.CloseModal();
				this.openSnackbar({text: 'Профиль удалён', icon: 'done'});
				await this.storeProfiles(this.state.storeProfilesIndex-1);
			} else {
				this.CloseModal();
				this.openSnackbar({text: 'Превышен лимит удаления', icon: 'error'});
			}
		};
		loadProfile = async(dev = false, reload = false, version = 1, withParams = false) => {
			const { activePanel, activeStory } = this.state;
			const { setActivePanel, OpenModal } = this;
			isDev&&console.warn('loadProfile', activeStory, activePanel);
			reload ? this.setState({ popout: <ScreenSpinner /> }) : '';
			if (syncUser == null || reload == true) {
				let dataVK;
				if (isMask) {
					dataVK = await getBridge('VKWebAppCallAPIMethod', {"method": "users.get", "params": {"user_ids": isMask, "fields": "photo_100,photo_200,photo_max_orig", "v": '5.130', "access_token": "9942dca8c434ee910f1745a2989105b6b66d712e4f6d96b474278ca18ea7e6d7a8db5f4e569b16c6d1d20"}});
					if (dataVK && dataVK.response) {
						dataVK = dataVK.response[0];
					} else {
						dataVK = await getBridge('VKWebAppGetUserInfo');
					}
				} else {
					dataVK = await getBridge('VKWebAppGetUserInfo');
				}
				dataVK.last_name = dataVK.first_name == 'DELETED' ? dataVK.id : dataVK.last_name;
				dataVK.first_name = dataVK.first_name == 'DELETED' ? 'Player' : dataVK.first_name;
				if (!reload) {
					syncUser = true;
					let dataDonut = await getBridge('VKWebAppCallAPIMethod', {"method": "execute.getMembers", "params": {"v": '5.130', "access_token": "9942dca8c434ee910f1745a2989105b6b66d712e4f6d96b474278ca18ea7e6d7a8db5f4e569b16c6d1d20"}});
					await getBridge('VKWebAppCallAPIMethod', {"method": "execute.getMembersFull", "params": {"v": '5.130', "access_token": "9942dca8c434ee910f1745a2989105b6b66d712e4f6d96b474278ca18ea7e6d7a8db5f4e569b16c6d1d20"}}).then(data => {
						if (data && data.response) {
							dataDonutUser = data;
						}
					});
					logger(['%c[Warlord Helper] Auth', 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;'], [{
						label: 'dataVK',
						message: dataVK
					}, {
						label: 'dataDonut',
						message: dataDonut
					}, {
						label: 'dataDonutUsers',
						message: dataDonutUser
					}]);
					server = this.state.storeProfiles[this.state.storeProfilesIndex].server;
					this.state.id = this.state.storeProfiles[this.state.storeProfilesIndex].id;
					this.state.login = this.state.storeProfiles[this.state.storeProfilesIndex].login;
					this.state.auth = this.state.storeProfiles[this.state.storeProfilesIndex].auth;
					this.state.server = server;
					if ((dataDonut?.response?.items && dataDonut.response.items.indexOf(dataVK.id) != -1 && dataDonutUser?.response?.items) || dev) {
						let isUserFromService = dataDonutUser.response.items.find(user => user.id == dataVK.id && user.hasOwnProperty('sex'));
						if (!isUserFromService) {
							let access = await getBridge("VKWebAppGetAuthToken", {"app_id": 7787242, "scope": "friends,groups"});
							if (access?.access_token) {
								let myDonut = await getBridge('VKWebAppCallAPIMethod', {"method": "donut.getSubscription", "params": {"v": '5.131', "owner_id": -138604865, "access_token": access?.access_token}});
								if (myDonut?.response?.status == 'active' || myDonut?.response?.status == 'expiring') {
									let stage = Number(myDonut.response.period);
									let price = Number(myDonut.response.amount);
									let size = (price-50)/this.state.storeProfilesSize+this.state.storeProfilesSize;
									this.state.storeProfilesSize = size;
									this.state.storeProfiles = this.state.storeProfiles.slice(0, size);
									this.state.storeProfilesFull = this.state.storeProfilesFull.slice(0, size);
									for (let i of new Array(size-this.state.storeProfiles.length < 0 ? 0 : size-this.state.storeProfiles.length)) this.state.storeProfiles.push({ id: null });
								} else {
									this.state.storeProfiles.slice(0, this.state.storeProfilesSize);
									this.state.storeProfilesFull = this.state.storeProfilesFull.slice(0, this.state.storeProfilesSize);
								}
							} else {
								this.state.storeProfiles.slice(0, this.state.storeProfilesSize);
								this.state.storeProfilesFull = this.state.storeProfilesFull.slice(0, this.state.storeProfilesSize);
							}
						} else {
							let size = 5;
							this.state.storeProfilesSize = Math.max(this.state.storeProfiles.length, 5);
							for (let i of new Array(size-this.state.storeProfiles.length < 0 ? 0 : size-this.state.storeProfiles.length)) this.state.storeProfiles.push({ id: null });
						}
						let dataGame = await getGame(this.state.server, null, {
							login: this.state.storeProfiles[this.state.storeProfilesIndex].login || dataVK.id,
							password: this.state.storeProfiles[this.state.storeProfilesIndex].auth || dataVK.id,
						}, 2);
						if (dataGame?._uid && Number(dataGame?._uid) !== 0) {
							let dataGameItems = await getGame(this.state.server, {
								i: 39,
								t: dataGame?._uid,
							}, DEFAULT_AUTHORIZATION[this.state.server-1]);
							if (dataGameItems?.u) {
								syncUserGame = dataGameItems.u;
								dataGameItems.i = dataGameItems.i.filter(item => Number(item._o) == 1);
								syncItems = dataGameItems.i.map((data, x) => {
									return Number(data._id);
								});
								syncItemsFull = dataGameItems.i.map((data, x) => {
									// console.log(data);
									return {
										id: Number(data._id), // номер
										lvl: Number(data._u), // уровень
										stones: [
											[Number(data._st11), Number(data._st12)], // раздел, уровень
											[Number(data._st21), Number(data._st22)], // раздел, уровень
											[Number(data._st31), Number(data._st32)] // раздел, уровень
										],
										bonus: [Number(data._st_dmg), Number(data._st_en), Number(data._st_end)]
									};
								});
							} else {
								syncUserGame = {
									_a1: "0",
									_a2: "0",
									_a3: "0",
									_a4: "0",
									_a5: "0",
									_a_c: "0",
									_aid: "0",
									_al: "0",
									_ap: "0",
									_bd: "0",
									_car1_lvl: "0",
									_clan_d: "0",
									_clan_id: "0",
									_clan_r: "0",
									_d1: "0",
									_d2: "0",
									_d3: "0",
									_d4: "0",
									_d5: "0",
									_d6: "0",
									_d7: "0",
									_d8: "0",
									_d9: "0",
									_d10: "0",
									_d11: "0",
									_dmgi: "0",
									_end: "0",
									_endi: "0",
									_exId: "0",
									_exp: "0",
									_fbId: "0",
									_gmId: "0",
									_hp: "0",
									_id: "0",
									_kgId: "0",
									_l_t: "0",
									_loc: "0",
									_loot: "0",
									_luck: "0",
									_lucki: "0",
									_lvl: "0",
									_mhp: "0",
									_mmId: "0",
									_mobId: "0",
									_name: "0",
									_okId: "0",
									_pet: "0",
									_rbId: "0",
									_room: "0",
									_s1: "0",
									_s2: "0",
									_s3: "0",
									_s4: "0",
									_type: "0",
									_va: "0",
									_vet: "0",
									_vi: "0",
									_vkId: "0"
								};
								syncItems = [];
								syncItemsFull = [];
							}
						} else {
							syncUserGame = {
								_a1: "0",
								_a2: "0",
								_a3: "0",
								_a4: "0",
								_a5: "0",
								_a_c: "0",
								_aid: "0",
								_al: "0",
								_ap: "0",
								_bd: "0",
								_car1_lvl: "0",
								_clan_d: "0",
								_clan_id: "0",
								_clan_r: "0",
								_d1: "0",
								_d2: "0",
								_d3: "0",
								_d4: "0",
								_d5: "0",
								_d6: "0",
								_d7: "0",
								_d8: "0",
								_d9: "0",
								_d10: "0",
								_d11: "0",
								_dmgi: "0",
								_end: "0",
								_endi: "0",
								_exId: "0",
								_exp: "0",
								_fbId: "0",
								_gmId: "0",
								_hp: "0",
								_id: "0",
								_kgId: "0",
								_l_t: "0",
								_loc: "0",
								_loot: "0",
								_luck: "0",
								_lucki: "0",
								_lvl: "0",
								_mhp: "0",
								_mmId: "0",
								_mobId: "0",
								_name: "0",
								_okId: "0",
								_pet: "0",
								_rbId: "0",
								_room: "0",
								_s1: "0",
								_s2: "0",
								_s3: "0",
								_s4: "0",
								_type: "0",
								_va: "0",
								_vet: "0",
								_vi: "0",
								_vkId: "0"
							};
							syncItems = [];
							syncItemsFull = [];
						}
						isDonut = true;
					}
					syncUser = dataVK;
					this.setState({ user: {vk: dataVK, game: null} });
					!withParams&&setActivePanel(null);
					!withParams&&this.setState({ activeStory: 'home', activePanel: 'home' });
				} else {
					server = this.state.storeProfiles[this.state.storeProfilesIndex].server;
					this.state.id = this.state.storeProfiles[this.state.storeProfilesIndex].id;
					this.state.login = this.state.storeProfiles[this.state.storeProfilesIndex].login;
					this.state.auth = this.state.storeProfiles[this.state.storeProfilesIndex].auth;
					this.state.server = server;
					let dataGame = await getGame(this.state.storeProfiles[this.state.storeProfilesIndex].server, null, {
						login: this.state.storeProfiles[this.state.storeProfilesIndex].login || dataVK.id,
						password: this.state.storeProfiles[this.state.storeProfilesIndex].auth || dataVK.id,
					}, 2);
					if (dataGame?._uid && Number(dataGame?._uid) !== 0) {
						// await getBridge('VKWebAppStorageSet', {"key": "server", "value": String(version)});
						await this.Storage({key: 'storeProfiles', value: JSON.stringify(this.state.storeProfiles)});
						let dataGameItems = await getGame(server, {
							i: 39,
							t: dataGame?._uid,
						}, DEFAULT_AUTHORIZATION[this.state.server-1]);
						if (dataGameItems?.u) {
							syncUserGame = dataGameItems.u;
							dataGameItems.i = dataGameItems.i.filter(item => Number(item._o) == 1);
							syncItems = dataGameItems.i.map((data, x) => {
								return Number(data._id);
							});
							syncItemsFull = dataGameItems.i.map((data, x) => {
								// console.log(data);
								return {
									id: Number(data._id), // номер
									lvl: Number(data._u), // уровень
									stones: [
										[Number(data._st11), Number(data._st12)], // раздел, уровень
										[Number(data._st21), Number(data._st22)], // раздел, уровень
										[Number(data._st31), Number(data._st32)] // раздел, уровень
									],
									bonus: [Number(data._st_dmg), Number(data._st_en), Number(data._st_end)]
								};
							});
						} else {
							syncUserGame = {
								_a1: "0",
								_a2: "0",
								_a3: "0",
								_a4: "0",
								_a5: "0",
								_a_c: "0",
								_aid: "0",
								_al: "0",
								_ap: "0",
								_bd: "0",
								_car1_lvl: "0",
								_clan_d: "0",
								_clan_id: "0",
								_clan_r: "0",
								_d1: "0",
								_d2: "0",
								_d3: "0",
								_d4: "0",
								_d5: "0",
								_d6: "0",
								_d7: "0",
								_d8: "0",
								_d9: "0",
								_d10: "0",
								_d11: "0",
								_dmgi: "0",
								_end: "0",
								_endi: "0",
								_exId: "0",
								_exp: "0",
								_fbId: "0",
								_gmId: "0",
								_hp: "0",
								_id: "0",
								_kgId: "0",
								_l_t: "0",
								_loc: "0",
								_loot: "0",
								_luck: "0",
								_lucki: "0",
								_lvl: "0",
								_mhp: "0",
								_mmId: "0",
								_mobId: "0",
								_name: "0",
								_okId: "0",
								_pet: "0",
								_rbId: "0",
								_room: "0",
								_s1: "0",
								_s2: "0",
								_s3: "0",
								_s4: "0",
								_type: "0",
								_va: "0",
								_vet: "0",
								_vi: "0",
								_vkId: "0"
							};
							syncItems = [];
							syncItemsFull = [];
						}
					} else {
						syncUserGame = {
							_a1: "0",
							_a2: "0",
							_a3: "0",
							_a4: "0",
							_a5: "0",
							_a_c: "0",
							_aid: "0",
							_al: "0",
							_ap: "0",
							_bd: "0",
							_car1_lvl: "0",
							_clan_d: "0",
							_clan_id: "0",
							_clan_r: "0",
							_d1: "0",
							_d2: "0",
							_d3: "0",
							_d4: "0",
							_d5: "0",
							_d6: "0",
							_d7: "0",
							_d8: "0",
							_d9: "0",
							_d10: "0",
							_d11: "0",
							_dmgi: "0",
							_end: "0",
							_endi: "0",
							_exId: "0",
							_exp: "0",
							_fbId: "0",
							_gmId: "0",
							_hp: "0",
							_id: "0",
							_kgId: "0",
							_l_t: "0",
							_loc: "0",
							_loot: "0",
							_luck: "0",
							_lucki: "0",
							_lvl: "0",
							_mhp: "0",
							_mmId: "0",
							_mobId: "0",
							_name: "0",
							_okId: "0",
							_pet: "0",
							_rbId: "0",
							_room: "0",
							_s1: "0",
							_s2: "0",
							_s3: "0",
							_s4: "0",
							_type: "0",
							_va: "0",
							_vet: "0",
							_vi: "0",
							_vkId: "0"
						};
						syncItems = [];
						syncItemsFull = [];
						this.openSnackbar({text: `Авторизуйте профиль на сервере ${serverHub[server-1]?.name} и обновите приложение`, icon: 'error'});
						// OpenModal(`alert`, {header: 'Ошибка получения данных персонажа', subheader: `Авторизуйтесь на ${version} сервере и обновите приложение`}, null, 'card');
					}
					syncUser = dataVK;
					this.setState({ user: {vk: dataVK, game: null} });
				}
				let allDataVK = await getBridge('VKWebAppCallAPIMethod', {"method": "users.get", "params": {"user_ids": this.state.storeProfiles.map(profile => profile.id).join(','), "fields": "photo_100,photo_200,photo_max_orig", "v": '5.130', "access_token": "9942dca8c434ee910f1745a2989105b6b66d712e4f6d96b474278ca18ea7e6d7a8db5f4e569b16c6d1d20"}});
				this.state.storeProfilesFull = [...this.state.storeProfiles];
				for (let storeProfileData of allDataVK?.response) {
					let storeProfile = this.state.storeProfiles.findIndex(profile => profile.id == storeProfileData.id);
					if (storeProfile != -1) {
						this.state.storeProfilesFull[storeProfile] = {
							...this.state.storeProfiles[storeProfile],
							first_name: storeProfileData.first_name == 'DELETED' ? 'Player' : storeProfileData.first_name,
							last_name: storeProfileData.first_name == 'DELETED' ? storeProfileData.id : storeProfileData.last_name,
							photo_100: storeProfileData.photo_100,
							photo_200: storeProfileData.photo_200,
							photo_max_orig: storeProfileData.photo_max_orig
						}
					};
				}
				this.state.storeProfilesFull[this.state.storeProfilesIndex] = {
					...this.state.storeProfiles[this.state.storeProfilesIndex],
					first_name: dataVK.first_name,
					last_name: dataVK.last_name,
					photo_100: dataVK.photo_100,
					photo_200: dataVK.photo_200,
					photo_max_orig: dataVK.photo_max_orig
				};
				this.setState({ popout: null });
			}
		};
		referals = async(parent, child, mode) => {
			console.log(parent, child, mode);
			if (mode == 'set') {
			}
		};
		startApp = async(resize = false) => {
			const { loadProfile, setTheme, checkServer, setActivePanel } = this;
			queryParams = parseQueryString(window.location.search);
			hashParams = parseQueryString(window.location.hash);
			logger(['%c[Warlord Helper] Params', 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;'], [{
				label: 'queryParams',
				message: queryParams
			}, {
				label: 'hashParams',
				message: hashParams
			}]);
			await (!isEmbedded) && setTheme();
			if (isEmbedded) await checkServer();
			if (isEmbedded && serverStatus) {
				if (!hashParams) hashParams = {"": undefined};
				if (Object.keys(hashParams).indexOf('dev') != -1) {
					isDev = true;
				}
				if (Object.keys(hashParams).indexOf('mask') != -1) {
					isMask = Number(Object.values(hashParams)[Object.keys(hashParams).indexOf('mask')]);
				}
				if (Object.keys(hashParams).indexOf('ref') != -1) {
					let parent = Number(Object.values(hashParams)[Object.keys(hashParams).indexOf('ref')]);
					let child = Number(queryParams.vk_user_id);
					if (!isNaN(parent) && !isNaN(child)) {
						await this.referals(parent, child, 'set');
					}
				}
				let storeProfiles = await this.Storage({key: 'storeProfiles', defaultValue: JSON.stringify([{
					server: 1,
					id: Number(queryParams.vk_user_id),
					login: Number(queryParams.vk_user_id),
					auth: null,
					main: true
				}, {
					id: null
				}, {
					id: null
				}, {
					id: null
				}, {
					id: null
				}])});
				// await this.Storage({key: 'storeProfiles', delete: true});
				if (storeProfiles && storeProfiles.value) {
					this.state.storeProfiles = JSON.parse(storeProfiles.value);
				} else return;
				this.state.storeProfilesFull = this.state.storeProfiles.slice();
				logger(['%c[Warlord Helper] storeProfiles', 'background: #182b3c; color: #fafeff; padding: 5px; border-radius: 4px;'], this.state.storeProfiles);
				await loadProfile(Object.keys(hashParams).indexOf('dev') != -1, resize, 1, Object.keys(hashParams).indexOf('view') != -1);
			} else {
				setActivePanel(null);
				this.setState({ activeStory: 'home', popout: null, isVK: false });
			}
			setTimeout(() => {
				if (this.isObject(hashParams)) {
					Object.keys(hashParams).map((key) => {
						let value = hashParams[key];
						if (key === 'view') {
							this.setState({ activeStory: value });
						}
						if (key === 'panel' && typeof hashParams.view != 'undefined') {
							setActivePanel(value);
						}
						setTimeout(() => {
							if (key === 'modal' && typeof hashParams.view != 'undefined' && typeof hashParams.panel != 'undefined') {
								try {
									document.querySelector(`#modal_${value}`).click();
								} catch (error) {
									
								}
							}
						}, 0);
					});
					if (Object.keys(hashParams).indexOf('promo') != -1) {
						let promoKey = Object.values(hashParams)[Object.keys(hashParams).indexOf('promo')];
						if (promoKey == 'arenaItems') {
							this.OpenModal('mediaArenaItems');
						}
						if (promoKey == 'eventsItems') {
							this.OpenModal('mediaEventsItems');
						}
					}
				}
			}, 0)
		};
		modal = () => (
			<ModalRoot activeModal={this.state.activeModal} onClose={() => this.CloseModal()}> 
				<MODAL_alert id='alert' onClose={() => this.BackModal()} state={this.state} options={this} data={this.state.dataModal} />
				<MODAL_donut id='donut' onClose={() => this.BackModal()} state={this.state} />
				<MODAL_description id='description' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} data={this.state.dataModal} />
				<MODAL_item id='item' onClose={() => this.BackModal()} state={this.state} options={this} data={this.state.dataModal} />
				<MODAL_getSettings id='getSettings' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} data={this.state.dataModal} isDonut={isDonut} />
				<MODAL_getSettings__id id='getSettings-id' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} />
				<MODAL_getSettings__login dynamicContentHeight id='getSettings-login' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} />
				<MODAL_getSettings__password id='getSettings-password' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} />
				<MODAL_getSettings__server id='getSettings-server' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} />
				<MODAL_getSettings__order dynamicContentHeight id='getSettings-order' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} storeProfiles={this.state.storeProfiles} storeProfilesFull={this.state.storeProfilesFull} storeProfilesSize={this.state.storeProfilesSize} />
				<MODAL_mediaArenaItems dynamicContentHeight id='mediaArenaItems' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} authorization={DEFAULT_AUTHORIZATION[this.state.server-1] || {}} api_id={api_id} />
				<MODAL_mediaEventsItems dynamicContentHeight id='mediaEventsItems' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} authorization={DEFAULT_AUTHORIZATION[this.state.server-1] || {}} api_id={api_id} />
				<MODAL_mediaSales id='mediaSales' onClose={() => this.BackModal()} setState={this.transmittedSetState} state={this.state} options={this} />
			</ModalRoot>
		);
		SortableItems = () => (
			<React.Fragment>
				<CardGrid size="m">
					<Card className="DescriptionCardWiki">
						<Cell mode="selectable" checked={this.state.checkItems.item} after={<Icon24TshirtOutline style={{color: this.state.checkItems.item ? 'var(--accent)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.isCheckItems(e, 'item')}>Предмет</Cell>
					</Card>
					<Card className="DescriptionCardWiki">
						<Cell mode="selectable" checked={this.state.checkItems.scroll} after={<Icon24StickerOutline style={{color: this.state.checkItems.scroll ? 'var(--accent)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.isCheckItems(e, 'scroll')}>Заточка</Cell>
					</Card>
					<Card className="DescriptionCardWiki">
						<Cell mode="selectable" checked={this.state.checkItems.collection} after={<Icon24CubeBoxOutline style={{color: this.state.checkItems.collection ? 'var(--accent)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.isCheckItems(e, 'collection')}>Коллекция</Cell>
					</Card>
					<Card className="DescriptionCardWiki">
						<Cell mode="selectable" checked={this.state.checkItems.personal} after={<Icon24CubeBoxOutline style={{color: this.state.checkItems.personal ? 'var(--destructive)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.isCheckItems(e, 'personal')}>Личная коллекция</Cell>
					</Card>
					{isDonut && <Card className="DescriptionCardWiki">
						<Cell mode="selectable" checked={this.state.checkItems.stock} after={<Icon24CheckCircleOutline style={{color: this.state.checkItems.stock ? 'var(--dynamic_green)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.isCheckItems(e, 'stock')}>Наличие предмета</Cell>
					</Card>}
				</CardGrid>
			</React.Fragment>
		);
		async componentDidMount() {
			await this.startApp();
			if (isEmbedded&&serverStatus) {
				let promo_1 = await this.Storage({key: 'promo_1', defaultValue: 'true'});
				let promo_2 = await this.Storage({key: 'promo_2', defaultValue: 'false'});
				let promo_4 = await this.Storage({key: 'promo_4', defaultValue: 'false'});
				let promo_3 = await this.Storage({key: 'promo_3', defaultValue: 'false'});
				if (promo_3.value !== 'true' && !this.state.activeModal) return this.OpenModal('mediaSales');
				if (promo_1.code !== 1 && !isDonut && !this.state.activeModal) return this.OpenModal('donut');
				if (promo_2.value !== 'true' && !this.state.activeModal) return this.OpenModal('mediaArenaItems');
				if (promo_4.value !== 'true' && !this.state.activeModal) return this.OpenModal('mediaEventsItems');
			}
		};
		render() {
			const { activeStory, activePanel, popout, user, theme } = this.state;
			const { onStoryChange, numberForm, numberSpaces, setActivePanel, modal } = this;
			return (
				<SplitLayout style={{ justifyContent: "center" }} popout={popout} modal={modal()}>
					{isDesktop && activeStory && (
						<SplitCol fixed width="280px" maxWidth="280px">
							<Panel id="navigation">
								<Group>
									{isEmbedded&&serverStatus&&<React.Fragment>
									<RichCell
										disabled
										className="RichCell--Header"
										before={<Avatar badge={<div style={{ backgroundImage: `url(${serverHub[server-1]?.logo})`, backgroundSize: 'cover', backgroundPosition: 'center', width: 16, height: 16, }}/>} size={36} src={user && user.vk ? user.vk.photo_200 : 'https://vk.com/images/camera_200.png'}/>}
										caption={`${serverHub[server-1]?.name}, ${isDev ? 'режим разработчика' : isDonut ? 'полный доступ' : 'обычный доступ'}`}
									>{user?.vk?.first_name ? `${user.vk.first_name} ${user.vk.last_name}` : 'Пользователь'}</RichCell>
									<Spacing size={16} />
									</React.Fragment>}
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'home'}
										data-story="home"
										onClick={onStoryChange}
										before={<Icon28HomeOutline />}
										description="Новости приложения"
									>Главная</RichCell>
									{isEmbedded&&serverStatus && <RichCell
										className="RichCell--Context"
										disabled={activeStory === 'profile'}
										data-story="profile"
										onClick={onStoryChange}
										before={<Icon28UserOutline />}
									>Мой профиль</RichCell>}
									{(this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 1 || this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 2)&&<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'rating'}
										data-story="rating"
										onClick={onStoryChange}
										before={<Icon28UserCardOutline />}
									>Рейтинг</RichCell>}
									{/* {isEmbedded && <RichCell
										className="RichCell--Context"
										disabled={activePanel === 'tasks'}
										data-story="tasks"
										onClick={() => setActivePanel('tasks')}
										before={<Icon28UserCircleOutline />}
										after={isEmbedded&&<Counter size="s" mode="prominent">НОВОЕ</Counter>}
									>Задания</RichCell>} */}
									<Spacing separator size={16} />
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'map'}
										data-story="map"
										onClick={onStoryChange}
										before={<Icon28GlobeOutline />}
										description="Рейды, приключения"
									>Карта</RichCell>
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'bosses'}
										data-story="bosses"
										onClick={onStoryChange}
										before={<Icon28PawOutline />}
										description="Cписки боссов"
									>Боссы</RichCell>
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'arena'}
										data-story="arena"
										onClick={onStoryChange}
										before={<Icon28Smiles2Outline />}
										description="Сезоны, сундуки"
									>Арена</RichCell>
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'character'}
										data-story="character"
										onClick={onStoryChange}
										before={<Icon28IncognitoOutline />}
										description="Питомцы, достижения"
									>Персонаж</RichCell>
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'guild'}
										data-story="guild"
										onClick={onStoryChange}
										before={<Icon28Users3Outline />} 
										description="Кузница, набеги"
									>Гильдия</RichCell>
									<RichCell
										className="RichCell--Context"
										disabled={activeStory === 'other'}
										data-story="other"
										onClick={onStoryChange}
										before={<Icon28GridSquareOutline />} 
										description="События, лотерея"
										// after={isEmbedded&&<Counter size="s" mode="prominent">НОВОЕ</Counter>}
									>Разное</RichCell>
									{!isEmbedded&&<><Spacing separator size={16} />
									<RichCell
										className="RichCell--Context"
										onClick={() => this.setTheme(true)}
										before={theme == 'bright_light' ? <Icon28MoonOutline/> : <Icon28SunOutline/>}
										description={theme == 'bright_light' ? 'Установлена светлая тема' : 'Установлена тёмная тема'}
									>{theme == 'bright_light' ? 'Тёмная тема' : 'Светлая тема'}</RichCell></>}
									{isEmbedded&&serverStatus&&<Footer style={{display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0 0 0', cursor: 'pointer', userSelect: 'none', gap: 8, color: serverStatusTime<50?'var(--dynamic_green)':serverStatusTime<150?'var(--dynamic_orange)':'var(--dynamic_red)'}} onClick={() => this.checkServer()}><Icon12OnlineVkmobile/>Задержка сервера {serverStatusTime} мс.</Footer>}
								</Group>
							</Panel>
						</SplitCol>
					)}
					<SplitCol animate={!isDesktop} spaced={isDesktop} width={isDesktop && activeStory ? '560px' : '100%'} maxWidth={isDesktop && activeStory ? '560px' : '100%'}>
						<Epic activeStory={activeStory} tabbar={!isDesktop && activeStory &&
							<Tabbar>
								<TabbarItem
									onClick={onStoryChange}
									selected={['home', 'map', 'bosses', 'arena', 'character', 'guild', 'other'].includes(activeStory)}
									data-story="home"
									text="Главная"
								><Icon28NewsfeedOutline/></TabbarItem>
								{isEmbedded&&serverStatus&&<TabbarItem
									indicator={isDonut&&<Badge style={{backgroundColor: 'rgb(255, 174, 38)'}}/>}
									onClick={onStoryChange}
									selected={activeStory === 'profile'}
									data-story="profile"
									text={user && user.vk ? `${user.vk.first_name} ${user.vk.last_name}` : 'Пользователь'}
								><Avatar size={28} src={user && user.vk ? user.vk.photo_200 : 'https://vk.com/images/camera_200.png'}/></TabbarItem>}
							</Tabbar>
						}>



							<View id="home" activePanel={!activePanel ? 'home' : activePanel}>
								<Panel id="home">
									{!isDesktop && <PanelHeader className='HeaderFix'><PanelHeaderContent status={`Версия ${wikiVersion}`}>Warlord Helper</PanelHeaderContent></PanelHeader>}
									<Group separator={isDesktop ? "auto" : "hide"} className="RoundSeparators">
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true}><PanelHeaderContent status={`Версия ${wikiVersion}`}>Warlord Helper</PanelHeaderContent></PanelHeader>}
										<Gallery 
											bullets={false} 
											isDraggable={false} 
											showArrows 
											className={`Gallery__banners infinityGallery ${!isDesktop&&'isDraggable'}`} 
											slideWidth={isDesktop?375:318+8} 
											align="center" 
											timeout="5000"
											getRef={this.ref__mainSlider}
											slideIndex={this.state.mainSlider}
											onChange={(index) => this.infinityGallery(index, dataMain.banners.length, 'mainSlider', this.ref__mainSlider)}
										>
											{[1, 2, 3].map(()=>dataMain.banners.map((data, x) => <Banner actions={<Button href={data.link} target="_blank" size={isDesktop?"l":"s"}>{data.action}</Button>} key={x} className="Gallery__banner" mode="image" size="m" background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data.icon})`}}/>
												</React.Fragment>}/>))}
										</Gallery>
										{isDesktop && <React.Fragment>
											<Spacing size={8}/>
											<CardGrid size="s" className="CardsNews">
												{dataMain.news.map((data, x) =>
													<Card key={x}>
														<Link href={data.link} target="_blank">
															<HorizontalCell size='l' header={data.title} subtitle={data.description}>
																<Avatar size={128} mode='image' style={{
																	backgroundImage: `url(${pathImages}${data.icon})`
																}}/>
															</HorizontalCell>
														</Link>
													</Card>
												)}
											</CardGrid>
										</React.Fragment>}
										{!isDesktop && <React.Fragment>
											<Spacing size={8}/>
											<Group separator="hide">
												<CardGrid className={`CardsNews withIcon CardGrid--xs`}>
													<Card data-story="map" onClick={onStoryChange}><HorizontalCell size='l' header="Карта"><Icon28GlobeOutline style={{['--fill']: 'var(--systemBlue)' }}/></HorizontalCell></Card>
													<Card data-story="bosses" onClick={onStoryChange}><HorizontalCell size='l' header="Боссы"><Icon28PawOutline style={{['--fill']: 'var(--systemRed)' }}/></HorizontalCell></Card>
													<Card data-story="arena" onClick={onStoryChange}><HorizontalCell size='l' header="Арена"><Icon28Smiles2Outline style={{['--fill']: 'var(--systemOrange)' }}/></HorizontalCell></Card>
													<Card data-story="character" onClick={onStoryChange}><HorizontalCell size='l' header="Персонаж"><Icon28IncognitoOutline style={{['--fill']: 'var(--systemGreen)' }}/></HorizontalCell></Card>
													<Card data-story="guild" onClick={onStoryChange}><HorizontalCell size='l' header="Гильдия"><Icon28Users3Outline style={{['--fill']: 'var(--systemYellow)' }}/></HorizontalCell></Card>
													<Card data-story="other" onClick={onStoryChange}><HorizontalCell size='l' header="Разное"><Icon28GridSquareOutline style={{['--fill']: 'var(--systemPurple)' }}/></HorizontalCell></Card>
													<Card data-story="rating" onClick={onStoryChange}><HorizontalCell size='l' header="Рейтинг"><Icon28UserCardOutline style={{['--fill']: 'var(--systemIndigo)' }}/></HorizontalCell></Card>
													<Card><HorizontalCell disabled size='l' header=" "><Icon28GridSquareOutline style={{['--fill']: '#505050' }}/></HorizontalCell></Card>
												</CardGrid>
												<Spacing size={16} separator/>
												<CardGrid className={`CardsNews withIcon CardGrid--xs`}>
													{isEmbedded&&<Card onClick={() => this.OpenModal('mediaSales')}><HorizontalCell size='l' header="Акция"><Icon28LikeOutline style={{['--fill']: 'var(--systemRed)' }}/></HorizontalCell></Card>}
													{isEmbedded&&<Card onClick={() => this.OpenModal('donut')}><HorizontalCell size='l' header="Подписка"><Icon28LikeOutline style={{['--fill']: 'var(--systemTeal)' }}/></HorizontalCell></Card>}
													{isEmbedded&&<Card><Link href={`https://vk.com/@wiki.warlord-authorization`} target="_blank"><HorizontalCell size='l' header="Вход"><Icon28KeyOutline style={{['--fill']: 'var(--systemTeal)' }}/></HorizontalCell></Link></Card>}
													<Card><Link href={`https://vk.com/@wiki.warlord-faq`} target="_blank"><HorizontalCell size='l' header="Помощь"><Icon28HelpOutline style={{['--fill']: 'var(--systemTeal)' }}/></HorizontalCell></Link></Card>
													{!isEmbedded&&<Card><HorizontalCell disabled size='l' header=" "><Icon28GridSquareOutline style={{['--fill']: '#505050' }}/></HorizontalCell></Card>}
													{!isEmbedded&&<Card><HorizontalCell disabled size='l' header=" "><Icon28GridSquareOutline style={{['--fill']: '#505050' }}/></HorizontalCell></Card>}
													{!isEmbedded&&<Card><HorizontalCell disabled size='l' header=" "><Icon28GridSquareOutline style={{['--fill']: '#505050' }}/></HorizontalCell></Card>}
												</CardGrid>
											</Group>
											<Spacing size={20*2+8} className="withRound"/>
											<Group>
												<Spacing size={8}/>
												{isEmbedded?<React.Fragment><Title className="Group__Head" level="1" weight="2">Привет, {user && user.vk ? user.vk.first_name : 'Пользователь'}</Title>
												<Title className="Group__Subhead" level="1" weight="1">новости приложения для тебя</Title>
												</React.Fragment>:<React.Fragment><Title className="Group__Head" level="1" weight="2">Новости</Title>
												<Title className="Group__Subhead" level="1" weight="1">новости приложения</Title>
												</React.Fragment>}
												<Spacing size={16}/>
												<CardScroll size="m" className="CardsNews">
													{dataMain.news.map((data, x) =>
														<Card key={x}>
															<Link href={data.link} target="_blank">
																<HorizontalCell size='l' header={data.title} subtitle={data.description}>
																	<Avatar size={128} mode='image' style={{
																		backgroundImage: `url(${pathImages}${data.icon})`
																	}}/>
																</HorizontalCell>
															</Link>
														</Card>
													)}
												</CardScroll>
											</Group>
										</React.Fragment>}
									</Group>
								</Panel>
								{/* <Tasks 
									id="tasks"
									view="home"
									isDesktop={isDesktop}
									activeStory={this.state.activeStory}
									activePanel={this.state.activePanel}
									setActivePanel={this.setActivePanel}
									snackbar={this.state.snackbar}
									openSnackbar={this.openSnackbar}
									setPopout={(popout) => this.setState({ popout: popout })}
									Storage={this.Storage}
									params={{hashParams: hashParams, queryParams: queryParams}}
								/> */}
								<Panel id="referals">
									{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => setActivePanel('home')}/>}>Рефералы</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} before={<PanelHeaderBack onClick={() => setActivePanel('home')}/>} after={isEmbedded&&<PanelHeaderButton onClick={() => bridge.send("VKWebAppCopyText", {"text": `https://vk.com/app7787242#view=${this.state.activeStory}&panel=${this.state.activePanel}`}, this.openSnackbar({text: 'Ссылка на подраздел скопирована', icon: 'done'}))}><Icon28CopyOutline/></PanelHeaderButton>}>Рефералы</PanelHeader>}
										<Placeholder 
											icon={<Icon56LikeOutline width="56" height="56" style={{color: 'var(--systemRed)'}}/>}
											header="В разработке"
										>
											Функция ещё не готова,<br/>но совсем скоро всё будет
										</Placeholder>
									</Group>
									{this.state.snackbar}
								</Panel>
							</View>



							<View id="profile" activePanel={!activePanel ? 'profile' : activePanel}>
								<Panel id="profile">
									{!isDesktop && <PanelHeader before={<PanelHeaderButton onClick={() => this.OpenModal(`getSettings-order`)}>Изменить</PanelHeaderButton>}>Мой профиль</PanelHeader>}
									{user.vk && <Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)} before={<PanelHeaderButton onClick={() => this.OpenModal(`getSettings-order`)}>Изменить</PanelHeaderButton>}>Мой профиль</PanelHeader>}
										<PullToRefresh onRefresh={() => this.storeProfilesRefresh()} isFetching={this.state.fetching}>
											<Spacing size={6} />
											<Gallery
												getRef={this.storeProfilesGalleryMainRef}
												onDragStart={(event) => {
													const main = this.storeProfilesGalleryChildRef.current.childNodes[0];
													const child = this.storeProfilesGalleryMainRef.current.childNodes[0];
													if (!main || !child) return;
													let start = Number(child.getAttribute('start')) || 0;
													if (start == 0) {
														start = Math.abs(this.getMatrix(child).x);
														main.setAttribute('start', main.style.transform);
														child.setAttribute('start', start);
													} else {
														let end = main.scrollWidth / 100 * ((start - event.shiftX) / (child.scrollWidth / 100)) * -1;
														if (end > 0) end = 0;
														main.style.transform = `translateX(${end}px)`;
													}
												}}
												onDragEnd={(event) => {
													const main = this.storeProfilesGalleryMainRef.current.childNodes[0];
													const child = this.storeProfilesGalleryChildRef.current.childNodes[0];
													if (!main || !child) return;
													if ((event.shiftXAbs <= 6 && event.shiftXAbs != 0) || ((event.shiftXAbs + Math.abs(this.getMatrix(main).x)) > (main.scrollWidth - main.offsetWidth))) child.style.transform = child.getAttribute('start');
													main.removeAttribute('start');
													child.removeAttribute('start');
												}}
												className="GradientGallery"
												bullets={false}
												showArrows
												onChange={(e) => isDonut&&this.storeProfiles(e)}
												slideIndex={isDonut?this.state.storeProfilesIndex:0}
												slideWidth={isDesktop ? '25%' : '35%'}
												align="center"
											>
												{isDonut ? this.state.storeProfiles.map((item, x) => item.id ? <React.Fragment key={x}>
													<div className={x == this.state.storeProfilesIndex ? "selected" : ""} key={x}>
														<Avatar className={['vk', 'vk', 'yandex', 'ok', 'ok'][serverHub[item.server-1]?.id-1]} badge={<div style={{ backgroundImage: `url(${serverHub[item.server-1]?.logo})`, backgroundSize: 'cover', backgroundPosition: 'center', width: 24, height: 24, }}/>} size={96} src={this.state.storeProfilesFull[x].photo_200 ? this.state.storeProfilesFull[x].photo_200 : 'https://vk.com/images/camera_200.png'} />
													</div>
												</React.Fragment> : <React.Fragment key={x}>
													<div>
														<Avatar size={96} shadow={false}><Icon56FaceIdOutline/></Avatar>
													</div>
												</React.Fragment>) : <div className="selected">
													<Avatar className={['vk', 'vk', 'yandex', 'ok', 'ok'][serverHub[this.state.storeProfilesFull[0].server-1]?.id-1]} badge={<div style={{ backgroundImage: `url(${serverHub[this.state.storeProfilesFull[0].server-1]?.logo})`, backgroundSize: 'cover', backgroundPosition: 'center', width: 24, height: 24, }}/>} size={96} src={this.state.storeProfilesFull[0].photo_200 ? this.state.storeProfilesFull[0].photo_200 : 'https://vk.com/images/camera_200.png'} />
												</div>}
											</Gallery>
											<Gallery
												getRef={this.storeProfilesGalleryChildRef}
												onDragStart={(event) => {
													const main = this.storeProfilesGalleryMainRef.current.childNodes[0];
													const child = this.storeProfilesGalleryChildRef.current.childNodes[0];
													if (!main || !child) return;
													let start = Number(child.getAttribute('start')) || 0;
													if (start == 0) {
														start = Math.abs(this.getMatrix(child).x);
														main.setAttribute('start', main.style.transform);
														child.setAttribute('start', start);
													} else {
														let end = main.scrollWidth / 100 * ((start - event.shiftX) / (child.scrollWidth / 100)) * -1;
														if (end > 0) end = 0;
														main.style.transform = `translateX(${end}px)`;
													}
												}}
												onDragEnd={(event) => {
													const main = this.storeProfilesGalleryMainRef.current.childNodes[0];
													const child = this.storeProfilesGalleryChildRef.current.childNodes[0];
													if (!main || !child) return;
													if ((event.shiftXAbs <= 6 && event.shiftXAbs != 0) || ((event.shiftXAbs + Math.abs(this.getMatrix(child).x)) > (child.scrollWidth - child.offsetWidth))) main.style.transform = main.getAttribute('start');
													main.removeAttribute('start');
													child.removeAttribute('start');
												}}
												className="GradientGallery GradientGallery--nav"
												bullets={false}
												onChange={(e) => isDonut&&this.storeProfiles(e)}
												slideIndex={isDonut?this.state.storeProfilesIndex:0}
												slideWidth={'100%'}
												align="center"
											>
												{isDonut ? this.state.storeProfiles.map((item, x) => item.id ? <React.Fragment key={x}>
													<div className={x == this.state.storeProfilesIndex ? "selected" : ""} key={x}>
														<Title level="2" weight="2">{this.state.storeProfilesFull[x].first_name ? `${this.state.storeProfilesFull[x].first_name}\n${this.state.storeProfilesFull[x].last_name}` : `Player\n${item.id}`}</Title>
														<Link style={{ marginTop: 6, color: 'var(--text_link)' }} href={`https://vk.com/id${this.state.storeProfilesFull[x].id}`} target="_blank">@id{this.state.storeProfilesFull[x].id}</Link>
														<Text style={{ marginTop: 2, color: 'var(--text_secondary)' }}>{serverHub[item.server-1]?.name}, {serverHub[item.server-1]?.company}</Text>
													</div>
												</React.Fragment> : <React.Fragment key={x}>
													<div>
														<Title level="2" weight="2">Профиль</Title>
														<Link style={{ marginTop: 8, color: 'var(--text_secondary)' }}>Свободный слот</Link>
													</div>
												</React.Fragment>) : <div className="selected">
													<Title level="2" weight="2">{this.state.storeProfilesFull[0].first_name ? `${this.state.storeProfilesFull[0].first_name}\n${this.state.storeProfilesFull[0].last_name}` : `Player\n${this.state.storeProfilesFull[0].id}`}</Title>
													<Link style={{ marginTop: 6, color: 'var(--text_link)' }} href={`https://vk.com/id${this.state.storeProfilesFull[0].id}`} target="_blank">@id{this.state.storeProfilesFull[0].id}</Link>
													<Text style={{ marginTop: 2, color: 'var(--text_secondary)' }}>{serverHub[this.state.storeProfilesFull[0].server-1]?.name}, {serverHub[this.state.storeProfilesFull[0].server-1]?.company}</Text>
												</div>}
											</Gallery>
											<Spacing size={12} />
											<div>
												<Button stretched size="m" mode="tertiary" onClick={() => this.BotAPI('getAuth', null, null, null, {stage: 'modal'})}>Настройки профиля</Button>
											</div>
											<Spacing separator size={12} />
											<React.Fragment>
												{/* <SimpleCell onClick={() => setActivePanel('11', true)} before={<Avatar mode="app" src={`${pathImages}labels/20.png`} />} description="Генератор изображений" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Коллекции</SimpleCell>
												<Spacing separator size={12} /> */}
												{/* <SimpleCell onClick={() => setActivePanel('8', true)} before={<Avatar mode="app" src={`${pathImages}labels/29.png`} />} description="Автоматизация" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Боссы</SimpleCell> */}
												<SimpleCell onClick={() => setActivePanel('6', true)} before={<Avatar mode="app" src={`${pathImages}labels/4.png`} />} description="Автоматизация" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Рейды</SimpleCell>
												<SimpleCell onClick={() => setActivePanel('7', true)} before={<Avatar mode="app" src={`${pathImages}labels/30.png`} />} description="Автоматизация" expandable indicator={<React.Fragment>
													{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{numberSpaces(syncUserGame._ap)}</span>
													<span className="Subhead">{numberForm(syncUserGame._ap, ['кубок', 'кубка', 'кубков'])}</span></React.Fragment>}
												</React.Fragment>}>Арена</SimpleCell>
												<SimpleCell onClick={() => setActivePanel('9', true)} before={<Avatar mode="app" src={`${pathImages}labels/14.png`} />} description="Автоматизация" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Ресурсы</SimpleCell>
												<SimpleCell onClick={() => setActivePanel('10', true)} before={<Avatar mode="app" src={`${pathImages}labels/20.png`} />} description="Автоматизация" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Кузница</SimpleCell>
												<Spacing separator size={12} />
												<SimpleCell onClick={() => setActivePanel('1', true)} before={<Avatar mode="app" src={`${pathImages}labels/12.png`} />} description="Ассортимент предметов" expandable indicator={<React.Fragment>
													{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{syncItems.length} / {Items.length}</span>
													<span className="Subhead">{numberForm(Items.length, ['предмет', 'предмета', 'предметов'])}</span></React.Fragment>}
												</React.Fragment>}>Магазин</SimpleCell>
												<SimpleCell onClick={() => setActivePanel('2', true)} before={<Avatar mode="app" src={`${pathImages}labels/20.png`} />} description="Ассортимент коллекций" expandable indicator={<React.Fragment>
													{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{Collections.items.map((item) => syncItems.indexOf(item) == -1 ? 0 : 1).reduce((x, y) => x + y)} / {Collections.items.length}</span>
													<span className="Subhead">{numberForm(Collections.items.length, ['коллекция', 'коллекции', 'коллекций'])}</span></React.Fragment>}
												</React.Fragment>}>Коллекции</SimpleCell>
												<SimpleCell onClick={() => setActivePanel('3', true)} before={<Avatar mode="app" src={`${pathImages}labels/31.png`} />} description="Предметы и камни" expandable indicator={<React.Fragment>
													{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{syncItems.length}</span>
													<span className="Subhead">{numberForm(syncItems.length, ['предмет', 'предмета', 'предметов'])}</span></React.Fragment>}
												</React.Fragment>}>Инкрустация</SimpleCell>
												{(this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 1 || this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 2)&&<SimpleCell onClick={() => setActivePanel('5', true)} before={<Avatar mode="app" src={`${pathImages}labels/23.png`} />} description="Друзья и характеристики" expandable indicator={<React.Fragment>
													<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
												</React.Fragment>}>Друзья</SimpleCell>}
												{this.state.id == 153968505&&<SimpleCell onClick={() => setActivePanel('4', true)} before={<Avatar mode="app" src={`${pathImages}labels/28.png`} />} description="Список донов" expandable indicator={<React.Fragment>
													{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{dataDonutUser.response.count}</span>
													<span className="Subhead">{numberForm(dataDonutUser.response.count, ['дон', 'дона', 'донов'])}</span></React.Fragment>}
												</React.Fragment>}>Доны</SimpleCell>}
											</React.Fragment>
										</PullToRefresh>
									</Group>}
									{this.state.snackbar}
								</Panel>
								<PANEL_profile__1 id='1' parent='profile' state={this.state} options={this} syncItems={syncItems} />
								<PANEL_profile__2 id='2' parent='profile' state={this.state} options={this} syncItems={syncItems} />
								<PANEL_profile__3 id='3' parent='profile' state={this.state} options={this} syncItems={syncItemsFull} />
								<PANEL_profile__4 id='4' parent='profile' state={this.state} options={this} dataDonutUser={dataDonutUser} />
								<PANEL_profile__5 id='5' parent='profile' state={this.state} options={this} authorization={DEFAULT_AUTHORIZATION[this.state.server-1] || {}} api_id={api_id}/>
								<PANEL_profile__6 id='6' parent='profile' state={this.state} options={this} />
								<PANEL_profile__7 id='7' parent='profile' state={this.state} options={this} />
								{/* <PANEL_profile__8 id='8' parent='profile' state={this.state} options={this} /> */}
								<PANEL_profile__9 id='9' parent='profile' state={this.state} options={this} />
								<PANEL_profile__10 id='10' parent='profile' state={this.state} options={this} />
								{/* <PANEL_profile__11 id='11' parent='profile' state={this.state} options={this} /> */}
							</View>



							<VIEW_rating id='rating' parent='rating' state={this.state} options={this} setState={this.transmittedSetState} game={syncUserGame} server={server}/>



							<View id="map" activePanel={!activePanel ? 'map' : activePanel}>
								<Panel id="map">
									{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Карта</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Карта</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataMap.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Информация карты"
												subheader="Мустафа, обыск, походы, рейды, приключения, районы, захват"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											<SimpleCell onClick={() => setActivePanel('1')} before={<Avatar mode="app" src={`${pathImages}labels/1.png`} />} description="Предметы и цены" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.shop.length}</span>
												<span className="Subhead">{numberForm(dataMap.shop.length, ['предмет', 'предмета', 'предметов'])}</span>
											</React.Fragment>}>Мустафа</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/2.png`} />} description="Постройки для обыска" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.builds.length}</span>
												<span className="Subhead">{numberForm(dataMap.builds.length, ['постройка', 'постройки', 'построек'])}</span>
											</React.Fragment>}>Обыск</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('3')} before={<Avatar mode="app" src={`${pathImages}labels/3.png`} />} description="Походы и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.crusade.points.length}</span>
												<span className="Subhead">{numberForm(dataMap.crusade.points.length, ['поход', 'похода', 'походов'])}</span>
											</React.Fragment>}>Походы</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('4')} before={<Avatar mode="app" src={`${pathImages}labels/4.png`} />} description="Рейды и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.raids.length}</span>
												<span className="Subhead">{numberForm(dataMap.raids.length, ['рейд', 'рейда', 'рейдов'])}</span>
											</React.Fragment>}>Рейды</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('5')} before={<Avatar mode="app" src={`${pathImages}labels/5.png`} />} description="Приключения и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.adventures.length}</span>
												<span className="Subhead">{numberForm(dataMap.adventures.length, ['приключение', 'приключения', 'приключений'])}</span>
											</React.Fragment>}>Приключения</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('6')} before={<Avatar mode="app" src={`${pathImages}labels/6.png`} />} description="Описания районов" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.regions.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}</span>
												<span className="Subhead">{numberForm(dataMap.regions.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['район', 'района', 'районов'])}</span>
											</React.Fragment>}>Районы</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('7')} before={<Avatar mode="app" src={`${pathImages}labels/7.png`} />} description="Районы для захвата" expandable indicator={<React.Fragment>
												<span className="Text">{dataMap.capture.length}</span>
												<span className="Subhead">{numberForm(dataMap.capture.length, ['район', 'района', 'районов'])}</span>
											</React.Fragment>}>Захват</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_map__1 id='1' parent='map' state={this.state} options={this} />
								<PANEL_map__2 id='2' parent='map' state={this.state} options={this} />
								<PANEL_map__3 id='3' parent='map' state={this.state} options={this} />
								<PANEL_map__4 id='4' parent='map' state={this.state} options={this} />
								<PANEL_map__5 id='5' parent='map' state={this.state} options={this} />
								<PANEL_map__6 id='6' parent='map' state={this.state} options={this} />
								<PANEL_map__7 id='7' parent='map' state={this.state} options={this} />
							</View>



							<View id="bosses" activePanel={!activePanel ? 'bosses' : activePanel}>
								<Panel id="bosses">
									{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Боссы</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Боссы</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataBosses.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Информация боссов"
												subheader="Калькулятор, список боссов"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											{isEmbedded&&serverStatus&&<SimpleCell onClick={() => setActivePanel('1', true)} before={<Avatar mode="app" src={`${pathImages}labels/8.png`} />} description="Затраты на убийство боссов" expandable indicator={<React.Fragment>
												<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
											</React.Fragment>}>Калькулятор</SimpleCell>}
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/29.png`} />} description="Боссы и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataBosses.bosses.map((item) => item.mobs.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}</span>
												<span className="Subhead">{numberForm(dataBosses.bosses.map((item) => item.mobs.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['босс', 'босса', 'боссов'])}</span>
											</React.Fragment>}>Список боссов</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_bosses__1 id='1' parent='bosses' state={this.state} options={this} game={syncUserGame} />
								<PANEL_bosses__2 id='2' parent='bosses' state={this.state} options={this} />
							</View>




							<View id="arena" activePanel={!activePanel ? 'arena' : activePanel}>
								<Panel id="arena">
									{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Арена</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Арена</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataArena.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Информация арены"
												subheader="Калькулятор, сезоны, лиги, сундуки"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											{isEmbedded&&serverStatus&&(this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 1 || this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 2)&&<React.Fragment>
												<SimpleCell onClick={() => this.OpenModal('mediaArenaItems')} before={<Icon28GraphOutline/>} expandable>Анализ сезонов</SimpleCell>
												<Spacing separator size={12} />
											</React.Fragment>}
											{isEmbedded&&serverStatus&&<SimpleCell onClick={() => setActivePanel('1', true)} before={<Avatar mode="app" src={`${pathImages}labels/8.png`} />} description="Затраты на прохождение арены" expandable indicator={<React.Fragment>
												<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
											</React.Fragment>}>Калькулятор</SimpleCell>}
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/9.png`} />} description="Сезоны и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataArena.season.map((item) => item.month.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}</span>
												<span className="Subhead">{numberForm(dataArena.season.map((item) => item.month.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['сезон', 'сезона', 'сезонов'])}</span>
											</React.Fragment>}>Сезоны</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('3')} before={<Avatar mode="app" src={`${pathImages}labels/10.png`} />} description="Лиги и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataArena.league.length}</span>
												<span className="Subhead">{numberForm(dataArena.league.length, ['лига', 'лиги', 'лиг'])}</span>
											</React.Fragment>}>Лиги</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('4')} before={<Avatar mode="app" src={`${pathImages}labels/11.png`} />} description="Сундуки и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataArena.chest.length}</span>
												<span className="Subhead">{numberForm(dataArena.chest.length, ['сундук', 'сундука', 'сундуков'])}</span>
											</React.Fragment>}>Сундуки</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_arena__1 id='1' parent='arena' state={this.state} options={this} />
								<PANEL_arena__2 id='2' parent='arena' state={this.state} options={this} />
								<PANEL_arena__3 id='3' parent='arena' state={this.state} options={this} />
								<PANEL_arena__4 id='4' parent='arena' state={this.state} options={this} />
							</View>




							<View id="character" activePanel={!activePanel ? 'character' : activePanel}>
								<Panel id="character">
									{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Персонаж</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Персонаж</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataCharacter.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Информация персонажа"
												subheader="Таланты, достижения, ресурсы, питомцы, аватары, фоны"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											<SimpleCell onClick={() => setActivePanel('1')} before={<Avatar mode="app" src={`${pathImages}labels/12.png`} />} description="Таланты персонажа" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.talents.length}</span>
												<span className="Subhead">{numberForm(dataCharacter.talents.length, ['талант', 'таланта', 'талантов'])}</span>
											</React.Fragment>}>Таланты</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/13.png`} />} description="Достижения и их условия" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.achievements.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}</span>
												<span className="Subhead">{numberForm(dataCharacter.achievements.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['достижение', 'достижения', 'достижений'])}</span>
											</React.Fragment>}>Достижения</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('3')} before={<Avatar mode="app" src={`${pathImages}labels/14.png`} />} description="Ресурсы и их получение" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.resources.length}</span>
												<span className="Subhead">{numberForm(dataCharacter.resources.length, ['ресурс', 'ресурса', 'ресурсов'])}</span>
											</React.Fragment>}>Ресурсы</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('4')} before={<Avatar mode="app" src={`${pathImages}labels/15.png`} />} description="Питомцы и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.pets.length}</span>
												<span className="Subhead">{numberForm(dataCharacter.pets.length, ['питомец', 'питомеца', 'питомецев'])}</span>
											</React.Fragment>}>Питомцы</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('6')} before={<Avatar mode="app" src={`${pathImages}labels/16.png`} />} description="Аватары и их получение" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.avatars.length}</span>
												<span className="Subhead">{numberForm(dataCharacter.avatars.length, ['аватар', 'аватара', 'аватаров'])}</span>
											</React.Fragment>}>Аватары</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('5')} before={<Avatar mode="app" src={`${pathImages}labels/17.png`} />} description="Фоны и их получение" expandable indicator={<React.Fragment>
												<span className="Text">{dataCharacter.backgrounds.length}</span>
												<span className="Subhead">{numberForm(dataCharacter.backgrounds.length, ['фон', 'фона', 'фонов'])}</span>
											</React.Fragment>}>Фоны</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_character__1 id='1' parent='character' state={this.state} options={this} />
								<PANEL_character__2 id='2' parent='character' state={this.state} options={this} />
								<PANEL_character__3 id='3' parent='character' state={this.state} options={this} />
								<PANEL_character__4 id='4' parent='character' state={this.state} options={this} />
								<PANEL_character__5 id='5' parent='character' state={this.state} options={this} />
								<PANEL_character__6 id='6' parent='character' state={this.state} options={this} />
							</View>




							<View id="guild" activePanel={!activePanel ? 'guild' : activePanel}>
								<Panel id="guild">
								{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Гильдия</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Гильдия</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataGuild.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Информация гильдии"
												subheader="Калькулятор, улучшения, кузница, академия, набеги, рейды"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											{isEmbedded&&serverStatus&&<SimpleCell onClick={() => setActivePanel('1', true)} before={<Avatar mode="app" src={`${pathImages}labels/18.png`} />} description="Затраты на казну гильдии" expandable indicator={<React.Fragment>
												<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
											</React.Fragment>}>Калькулятор</SimpleCell>}
											<SimpleCell onClick={() => setActivePanel('7')} before={<Avatar mode="app" src={`${pathImages}labels/28.png`} />} description="Значение званий" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.rangs.length}</span>
												<span className="Subhead">{numberForm(dataGuild.rangs.length, ['звание', 'звания', 'званий'])}</span>
											</React.Fragment>}>Звания</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/19.png`} />} description="Улучшения и их уровни" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.builds.length}</span>
												<span className="Subhead">{numberForm(dataGuild.builds.length, ['постройка', 'постройки', 'построек'])}</span>
											</React.Fragment>}>Улучшения</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('3')} before={<Avatar mode="app" src={`${pathImages}labels/20.png`} />} description="Экипировка и цены" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.items.length}</span>
												<span className="Subhead">{numberForm(dataGuild.items.length, ['предмет', 'предмета', 'предметов'])}</span>
											</React.Fragment>}>Кузница</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('4')} before={<Avatar mode="app" src={`${pathImages}labels/21.png`} />} description="Навыки и их уровни" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.academy.length}</span>
												<span className="Subhead">{numberForm(dataGuild.academy.length, ['навык', 'навыка', 'навыков'])}</span>
											</React.Fragment>}>Академия</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('5')} before={<Avatar mode="app" src={`${pathImages}labels/22.png`} />} description="Набеги и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.raids.length}</span>
												<span className="Subhead">{numberForm(dataGuild.raids.length, ['набег', 'набега', 'набегов'])}</span>
											</React.Fragment>}>Набеги</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('6')} before={<Avatar mode="app" src={`${pathImages}labels/23.png`} />} description="Рейды и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataGuild.bosses.length}</span>
												<span className="Subhead">{numberForm(dataGuild.bosses.length, ['рейд', 'рейда', 'рейдов'])}</span>
											</React.Fragment>}>Рейды</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_guild__1 id='1' parent='guild' state={this.state} options={this} />
								<PANEL_guild__2 id='2' parent='guild' state={this.state} options={this} />
								<PANEL_guild__3 id='3' parent='guild' state={this.state} options={this} />
								<PANEL_guild__4 id='4' parent='guild' state={this.state} options={this} />
								<PANEL_guild__5 id='5' parent='guild' state={this.state} options={this} />
								<PANEL_guild__6 id='6' parent='guild' state={this.state} options={this} />
								<PANEL_guild__7 id='7' parent='guild' state={this.state} options={this} />
							</View>



							
							<View id="other" activePanel={!activePanel ? 'other' : activePanel}>
								<Panel id="other">
								{!isDesktop && <PanelHeader after={!isEmbedded&&this.getCopy(this.state.activeStory)} before={<PanelHeaderBack onClick={() => this.setState({ activeStory: 'home', activePanel: 'home' })}/>}>Разное</PanelHeader>}
									<Group>
										{isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} after={this.getCopy(this.state.activeStory)}>Разное</PanelHeader>}
										<Gallery bullets={false} showArrows className="Gallery__banners" style={{'--offset': isDesktop?'14px':'24px'}} slideWidth='100%' align="center" timeout="5000">
											{dataOther.images.map((data, x) => <Banner key={x} className="Gallery__banner --shadow" mode="image" size="m" 
												header="Прочая информация"
												subheader="Калькулятор, новые предметы, события, лотерея, обыск друзей"
												background={<React.Fragment>
													<Spinner size="large" className="Gallery__bannerPreload" />
													<div className="Gallery__bannerImage" style={{backgroundImage: `url(${pathImages}${data})`}}/>
												</React.Fragment>}
											/>)}
										</Gallery>
										<React.Fragment>
											<Spacing size={6} />
											{isEmbedded&&serverStatus&&(this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 1 || this.state.storeProfiles[this.state.storeProfilesIndex]?.server == 2)&&<React.Fragment>
												<SimpleCell onClick={() => this.OpenModal('mediaEventsItems')} before={<Icon28GraphOutline/>} expandable>Анализ ивентов</SimpleCell>
												<Spacing separator size={12} />
											</React.Fragment>}
											{isEmbedded&&serverStatus&&<SimpleCell onClick={() => setActivePanel('1', true)} before={<Avatar mode="app" src={`${pathImages}labels/26.png`} />} description="Затраты на улучшение предмета" expandable indicator={<React.Fragment>
												<span className="Text">{!isDonut&&<Icon28DonateCircleFillYellow width={24} height={24}/>}</span>
											</React.Fragment>}>Калькулятор</SimpleCell>}
											{isEmbedded&&serverStatus&&<SimpleCell onClick={() => setActivePanel('5', true)} before={<Avatar mode="app" src={`${pathImages}labels/20.png`} />} description="Последние добавленные предметы" expandable indicator={<React.Fragment>
												{!isDonut ? <span className="Text"><Icon28DonateCircleFillYellow width={24} height={24}/></span> : <React.Fragment><span className="Text">{dataOther.new.length}</span>
												<span className="Subhead">{numberForm(dataOther.new.length, ['предмет', 'предмета', 'предметов'])}</span></React.Fragment>}
											</React.Fragment>}>Новые предметы</SimpleCell>}
											<SimpleCell onClick={() => setActivePanel('3')} before={<Avatar mode="app" src={`${pathImages}labels/28.png`} />} description="Ивенты и награды" expandable indicator={<React.Fragment>
												<span className="Text">{dataOther.events.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}</span>
												<span className="Subhead">{numberForm(dataOther.events.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['событие', 'события', 'событий'])}</span>
											</React.Fragment>}>События</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('2')} before={<Avatar mode="app" src={`${pathImages}labels/27.png`} />} description="Награды с лото" expandable indicator={<React.Fragment>
												<span className="Text">{dataOther.lottery.length}</span>
												<span className="Subhead">{numberForm(dataOther.lottery.length, ['предмет', 'предмета', 'предметов'])}</span>
											</React.Fragment>}>Лотерея</SimpleCell>
											<SimpleCell onClick={() => setActivePanel('4')} before={<Avatar mode="app" src={`${pathImages}labels/30.png`} />} description="Награды с обыска" expandable indicator={<React.Fragment>
												<span className="Text">{dataOther.search.length}</span>
												<span className="Subhead">{numberForm(dataOther.search.length, ['предмет', 'предмета', 'предметов'])}</span>
											</React.Fragment>}>Обыск друзей</SimpleCell>
										</React.Fragment>
									</Group>
									{this.state.snackbar}
								</Panel>
								<PANEL_other__1 id='1' parent='other' state={this.state} options={this} />
								<PANEL_other__2 id='2' parent='other' state={this.state} options={this} />
								<PANEL_other__3 id='3' parent='other' state={this.state} options={this} />
								<PANEL_other__4 id='4' parent='other' state={this.state} options={this} />
								<PANEL_other__5 id='5' parent='other' state={this.state} options={this} />
							</View>
						</Epic>
					</SplitCol>
				</SplitLayout>
			);
		};
	};
	window.innerWidth = window.innerWidth;
	window.innerHeight = window.innerHeight;
	// return <ConfigProvider platform={isDesktop ? 'ios' : usePlatform()}><Wiki/></ConfigProvider>;
	
	
	return <ConfigProvider scheme="inherit" platform='ios' webviewType='internal'><Wiki/></ConfigProvider>;
}, {
	viewWidth: true
});

ReactDOM.createRoot(document.getElementById('root')).render(<AdaptivityProvider><AppRoot><App/></AppRoot></AdaptivityProvider>);