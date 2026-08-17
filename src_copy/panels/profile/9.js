import React from 'react';
import {
	Panel,
	Group,
	Spacing,
	Avatar,
	Button,
	Placeholder,
	PullToRefresh,
	Input,
	CardScroll,
	Card,
} from '@vkontakte/vkui';
import { Icon28ListOutline } from '@vkontakte/icons';
import Skeleton from '../../components/skeleton';

import Items from '../../data/items.json';
import Stones from '../../data/stones.json';
import Resources from '../../data/resources.json';

let syncBot = null;
let globalTimer;

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,

			isLoad: false,

			times: {
				map: '0/0',
				chest: 0,
				pet: 0,
				lottery: 0,
				daily: 0,
				vip: 0,
				guildBuilds: 0,
				guildReward: 0,
				guildWars: 0,
				search: 0,
			},
			hints: {
				map: null,
				chest: null,
				pet: null,
				lottery: null,
				daily: null,
				vip: null,
				guildBuilds: null,
				guildReward: null,
				guildWars: null,
				search: null,
			},
			data: {
				guildWars: {
					start: null,
					end: null,
				}
			},
			resources: [{
				id: 'chest',
				name: 'Сундуки',
				count: 0,
			}, {
				id: 'en',
				name: 'Энергия',
				count: 0,
			}, {
				id: 'm3',
				name: 'Золото',
				count: 0,
			}, {
				id: 'm1',
				name: 'Серебро',
				count: 0,
			}, {
				id: 'm2',
				name: 'Рубины',
				count: 0,
			}, {
				id: 'm4',
				name: 'Аметисты',
				count: 0,
			}, {
				id: 'm5',
				name: 'Топазы',
				count: 0,
			}, {
				id: 'm6',
				name: 'Турмалины',
				count: 0,
			}, {
				id: 'pf1',
				name: 'Еда',
				count: 0,
			}, {
				id: 'm9',
				name: 'Редкие жемчужины',
				count: 0,
			}, {
				id: 'm7',
				name: 'Пергаменты',
				count: 0,
			}, {
				id: 'item2',
				name: 'Целебные зелья',
				count: 0,
			}, {
				id: 'item1',
				name: 'Свитки молнии',
				count: 0,
			}, {
				id: 'item3',
				name: 'Свитки огня',
				count: 0,
			}, {
				id: 'exp',
				name: 'Опыт',
				count: 0,
			}],
			
			botLog: <Placeholder
				style={{overflow: "hidden"}}
				icon={<Icon28ListOutline width={56} height={56} />}
				stretched
			>
				Нет новых<br />действий
			</Placeholder>
		};
		this._isMounted = false;
	};
	joinReward = (rewards) => {
		let returnData = {
			i: []
		};
		for (let reward of rewards) {
			if (Array.isArray(reward)) {
				let newReward = {
					i: []
				};
				for (let item of reward) {
					if (item.hasOwnProperty('_type')) {
						newReward.i.push({...item, _id: item._item});
					} else {
						newReward = {...newReward, ...item};
					}
				}
				reward = newReward;
			}
			if (reward.i) {
				typeof reward.i.length == 'undefined' ? reward.i = [reward.i] : [];
				for (let item of reward.i) returnData.i.push(item);
				delete reward.i;
			}
			for (let key of Object.keys(reward)) returnData[key] = (Number(returnData[key]) || 0) + Number(reward[key]);
		}
		return returnData;
	};
	parseReward = (reward) => {
		let returnData = [];
		if (Array.isArray(reward)) {
			let newReward = {
				i: []
			};
			for (let item of reward) {
				if (item.hasOwnProperty('_type')) {
					newReward.i.push({...item, _id: item._item});
				} else {
					newReward = {...newReward, ...item};
				}
			}
			reward = newReward;
		}
		if (reward.hasOwnProperty('_item')&&Number(reward._item)!=0&&reward.hasOwnProperty('_type')) {
			typeof reward?.i?.length == 'undefined' ? reward.i = [] : '';
			reward.i.push({
				_type: Number(reward._type),
				_id: Number(reward._item),
			});
		}
		if (reward.i) {
			typeof reward.i.length == 'undefined' ? reward.i = [reward.i] : '';
			for (let item of reward.i) {
				try {
					if (Number(item._type) == 6) {
						let itemFull = Items.find(x => x.fragments.includes(Number(item._id)));
						if (!itemFull) itemFull = Resources.find(x => x.fragments.includes(Number(item._id)));
						returnData.push({
							avatar: `collections/${Number(item._id)}.png`,
							title: 'Коллекция',
							message: itemFull.title
						});
					} else if (Number(item._type) == 8) {
						let itemFull = Items.find(x => x.id === Number(item._id));
						returnData.push({
							avatar: itemFull.icon,
							title: 'Заточка',
							message: itemFull.title
						});
					} else if (Number(item._type) == 11) {
						let itemFull = Stones.find(x => x.id === Number(item._id));
						returnData.push({
							avatar: `stones/${Number(item._id)}.png`,
							title: 'Камень',
							message: itemFull.title
						});
					} else if (Number(item._type) == 1) {
						returnData.push({
							avatar: `rooms/${Number(item._id)}.png`,
							title: 'Новый фон',
							message: 'Окружение'
						});
					} else {
						let itemFull = Items.find(x => x.id === Number(item._id));
						returnData.push({
							avatar: itemFull.icon,
							title: 'Предмет',
							message: itemFull.title
						});
					}
				} catch (error) {
					console.error(error);
					console.warn(item);
				}
			}
		}
		reward.hasOwnProperty('_m1')&&Number(reward._m1)!=0&&returnData.push({
			avatar: 'bot/raids/12.png',
			title: 'Серебро',
			message: `${this.props.options.numberSpaces(Number(reward._m1))} ед.`
		});
		reward.hasOwnProperty('_m2')&&Number(reward._m2)!=0&&returnData.push({
			avatar: 'bot/raids/13.png',
			title: 'Рубины',
			message: `${this.props.options.numberSpaces(Number(reward._m2))} ед.`
		});
		reward.hasOwnProperty('_m3')&&Number(reward._m3)!=0&&returnData.push({
			avatar: 'bot/raids/11.png',
			title: 'Золото',
			message: `${this.props.options.numberSpaces(Number( reward._m3))} ед.`
		});
		reward.hasOwnProperty('_m4')&&Number(reward._m4)!=0&&returnData.push({
			avatar: 'bot/raids/15.png',
			title: 'Аметисты',
			message: `${this.props.options.numberSpaces(Number( reward._m4))} ед.`
		});
		reward.hasOwnProperty('_m5')&&Number(reward._m5)!=0&&returnData.push({
			avatar: 'bot/raids/14.png',
			title: 'Топазы',
			message: `${this.props.options.numberSpaces(Number( reward._m5))} ед.`
		});
		reward.hasOwnProperty('_m6')&&Number(reward._m6)!=0&&returnData.push({
			avatar: 'bot/raids/21.png',
			title: 'Турмалины',
			message: `${this.props.options.numberSpaces(Number(reward._m6))} ед.`
		});
		reward.hasOwnProperty('_m7')&&Number(reward._m7)!=0&&returnData.push({
			avatar: 'bot/raids/22.png',
			title: 'Пергаменты',
			message: `${this.props.options.numberSpaces(Number(reward._m7))} ед.`
		});
		reward.hasOwnProperty('_m9')&&Number(reward._m9)!=0&&returnData.push({
			avatar: 'bot/raids/112.png',
			title: 'Редкие жемчужины',
			message: `${this.props.options.numberSpaces(Number(reward._m9))} ед.`
		});
		reward.hasOwnProperty('_i2')&&Number(reward._i2)!=0&&returnData.push({
			avatar: 'bot/raids/18.png',
			title: 'Целебные зелья',
			message: `${this.props.options.numberSpaces(Number(reward._i2))} ед.`
		});
		reward.hasOwnProperty('_i1')&&Number(reward._i1)!=0&&returnData.push({
			avatar: 'bot/raids/17.png',
			title: 'Свитки молнии',
			message: `${this.props.options.numberSpaces(Number(reward._i1))} ед.`
		});
		reward.hasOwnProperty('_i3')&&Number(reward._i3)!=0&&returnData.push({
			avatar: 'bot/raids/16.png',
			title: 'Свитки огня',
			message: `${this.props.options.numberSpaces(Number(reward._i3))} ед.`
		});
		reward.hasOwnProperty('_pf1')&&Number(reward._pf1)!=0&&returnData.push({
			avatar: 'bot/raids/20.png',
			title: 'Еда',
			message: `${this.props.options.numberSpaces(Number(reward._pf1))} ед.`
		});
		reward.hasOwnProperty('_en')&&Number(reward._en)!=0&&returnData.push({
			avatar: 'bot/raids/19.png',
			title: 'Энергия',
			message: `${this.props.options.numberSpaces(Number(reward._en))} ед.`
		});
		reward.hasOwnProperty('_exp')&&Number(reward._exp)!=0&&returnData.push({
			avatar: 'bot/raids/10.png',
			title: 'Опыт',
			message: `${this.props.options.numberSpaces(Number(reward._exp))} ед.`
		});
		return returnData;
	};
	setBotLog = async(message = 'update...', type = 'text', color = null) => {
		let log = this.state.botLog;
		if (message == 'clear') {
			log = (<Placeholder
				style={{overflow: "hidden"}}
				icon={<Icon28ListOutline width={56} height={56} />}
				stretched
			>
				Нет новых<br />действий
			</Placeholder>);
		} else {
			if (!Array.isArray(this.state.botLog)) log = [];
			if (type == 'text') {
				log.push({ type: 'text', message: message, color: color });
			} else log.push({ type: 'message', message: {
				avatar: message.avatar,
				title: message.name,
				time: this.props.options.getRealTime(),
				message: message.message
			} });
		}
		this._isMounted && this.setState({ botLog: log }, () => this._isMounted && document.querySelector('.BotLog.Scroll')&&document.querySelector('.BotLog.Scroll').scrollTo({ top: document.querySelector('.BotLog.Scroll').scrollHeight }));
	};
	BotResources = async(mode = '', action = '', needReload = true) => {
		const { setBotLog } = this;
		const { BotAPI, openSnackbar, setActivePanel, numberForm } = this.props.options;
		const { state } = this.props;
		const { getGame, server } = this.props.state;
		
		this._isMounted && this.setState({ isLoad: true });

		let api_uid = state.login || state.user.vk.id;
		let auth_key = state.auth;
		if (!auth_key) {
			auth_key = this._isMounted && await BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Для продолжения работы необходимо указать пароль авторизации'});
			if (auth_key == 'modal') {
				this._isMounted && setActivePanel('profile');
				return;
			} else if (!auth_key) {
				this._isMounted && setActivePanel('profile');
				return;
			}
		}

		let getGameAuth = {
			login: api_uid,
			password: auth_key,
		};
		let dataProfile = this._isMounted && await getGame(this.props.state.server, {}, getGameAuth);
		getGameAuth.id = dataProfile?.u?._id || api_uid;
		let dataGuild = {};
		if (Number(dataProfile?.u?._clan_id) != 0) {
			dataGuild = this._isMounted && await getGame(this.props.state.server, {
				i: 49,
				t1: dataProfile?.u?._clan_id || 0,
			}, getGameAuth);
			if (dataGuild?.clan) {
				dataGuild = dataGuild?.clan;
			} else {
				dataGuild = null;
			}
		}
		syncBot = true;
		// console.warn(dataProfile);
		// console.warn(dataGuild);
		if (!dataProfile?.u || dataGuild == null) {
			openSnackbar({text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error'});
			this._isMounted && BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Пароль авторизации игры неисправен, введите новый', error: typeof dataProfile == 'string' ? dataProfile : dataProfile?.err_msg ? dataProfile?.err_msg : JSON.stringify(dataProfile)});
			this._isMounted && setActivePanel('profile');
			return;
		}
		if (Number(dataProfile?.u?._va) == 0) {
			this.state.times.vip = null;
			this.state.hints.vip = 'Нет премиум статуса';
		}
		if (dataProfile?.j) {
			typeof dataProfile?.j?.length == 'undefined' ? dataProfile.j = [dataProfile?.j] : [];
			this.state.times.map = dataProfile?.j?.length ? `${dataProfile?.j?.filter(build => Number(build?._t) <= 0)?.length}/${dataProfile?.j?.length}` : null;
			this.state.hints.map = null;
		} else {
			this.state.times.map = null;
			this.state.hints.map = 'Нет доступных зданий';
		}
		if (dataProfile?.chests?.ch) {
			typeof dataProfile?.chests?.ch?.length == 'undefined' ? dataProfile.chests.ch = [dataProfile?.chests?.ch] : [];
			this.state.times.chest = Number(dataProfile?.chests?.ch?.find(chest => Number(chest._o) == 1)?._ot) || 'clear';
			this.state.hints.chest = null;
		} else {
			this.state.times.chest = null;
			this.state.hints.chest = 'Нет доступных сундуков';
		}
		this.state.times.lottery = Number(dataProfile?.u?._lott) || 0;
		if (Number(dataProfile?.u?._pet) == 0) {
			this.state.times.pet = null;
			this.state.hints.pet = 'Нет активного питомца';
		} else {
			if (dataProfile?.mypets?.p) {
				typeof dataProfile?.mypets?.p?.length == 'undefined' ? dataProfile.mypets.p = [dataProfile?.mypets?.p] : [];
				this.state.times.pet = Number(dataProfile?.mypets?.p?.find(pet => Number(pet._is_loot) == 1)?._end_time) || 'clear';
				this.state.hints.pet = null;
				if (this.state.times.pet == 'clear') {
					if (Number(dataProfile?.pets?.p?.find(pet => Number(pet._id) == Number(dataProfile?.u?._pet))?._lp) > Number(dataProfile?.u?._pf1)) {
						this.state.times.pet = null;
						this.state.hints.pet = 'Не хватает еды';
					}
				}
			} else {
				this.state.times.pet = null;
				this.state.hints.pet = 'Нет доступных питомцев';
			}
		}
		if (dataGuild?.bldngs?.b) {
			typeof dataGuild?.bldngs?.b?.length == 'undefined' ? dataGuild.bldngs.b = [dataGuild?.bldngs?.b] : [];
			this.state.times.guildBuilds = Number(dataGuild?.bldngs?.b?.find(build => Number(build._id) == 5)?._ptl) || 0;
			this.state.hints.guildBuilds = null;
		} else {
			this.state.times.guildBuilds = null;
			this.state.times.guildReward = null;
			this.state.hints.guildBuilds = 'Нет гильдии';
			this.state.hints.guildReward = 'Нет гильдии';
		}
		if (dataGuild?.hist?.h) {
			typeof dataGuild?.hist?.h?.length == 'undefined' ? dataGuild.hist.h = [dataGuild?.hist?.h] : [];
			this.state.times.guildWars = dataGuild?.hist?.h?.filter(event => (Number(event._t) == 18 || Number(event._t) == 20) && Number(event._v3) == 1)?.map(war => ({
				id: Number(war._v2),
				enemy: Number(war._v1),
				date: war._d
			})) || 0;
			this.state.data.guildWars.end = this.state.times.guildWars?.[0]?.id || null;
			this.state.hints.guildWars = null;
		} else {
			this.state.times.guildWars = null;
			this.state.hints.guildWars = 'Нет гильдии';
			this.state.data.guildWars.start = null;
			this.state.data.guildWars.end = null;
		}
		for (let resource of this.state.resources) resource.count = Number(dataProfile?.u?.[`_${resource.id}`]);
		this.state.resources.find(resource => resource.id == 'chest').count = Number(dataProfile?.chests?.ch?.length);

		if (mode == 'map' && action == 'collect') {
			let data;
			let reward = [];
			let count = 0;
			for (let build of dataProfile?.j || []) {
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 23,
					t1: build._r,
					t2: build._rn,
				}, getGameAuth);
				if (data?.j && data?.r) {
					count++;
					reward.push(data?.r);
				}
			}
			if (count != 0) {
				this._isMounted && setBotLog({
					avatar: `bot/resources/9_1.png`,
					name: `Обыск зданий`,
					message: this.parseReward(this.joinReward(reward)),
				}, 'message');
			} else this._isMounted && needReload && this.setBotLog(`Лимит обыска зданий`, 'text');
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'map' && action == 'upgrade') {
			let data;
			let count = 0;
			for (let build of dataProfile?.j || []) {
				let hash = this._isMounted && await BotAPI('getAcceptHash', null, null, null, {key: `${build._r}ja6`});
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 24,
					t1: build._r,
					t2: build._rn,
					g_sig: hash,
				}, getGameAuth);
				if (Number(data?.j?._ok) == 1) {
					count++;
					this._isMounted && setBotLog({
						avatar: `bot/resources/${build._r}_${build._rn}.png`,
						name: ['Магическая лавка', 'Таверна', 'Хижина отшельника', 'Постоялый двор', 'Лавка колдуньи Ванессы', 'Шахта Растхельма', 'Таверна', 'Постоялый двор', 'Постоялый двор', 'Постоялый двор'][Number(data?.j?._id)-1],
						message: `Получен ${Number(data?.j?._lvl)} уровень`,
					}, 'message');
				}
			}
			if (count == 0) this._isMounted && needReload && this.setBotLog(`Нет доступных зданий для улучшения`, 'text');
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'chest' && action == 'collect') {
			let data;
			if (dataProfile?.chests?.ch?.length) {
				let chest = dataProfile?.chests?.ch?.find(chest => Number(chest._o) == 1);
				if (chest) {
					data = this._isMounted && await getGame(this.props.state.server, {
						i: 102,
						t: chest?._id,
					}, getGameAuth);
					if (data?.r) {
						this._isMounted && setBotLog({
							avatar: `bot/resources/1_${chest._ci}.png`,
							name: ['', 'Деревянный сундук', 'Серебряный сундук', 'Золотой сундук', 'Магический сундук', 'Трофейный сундук', 'Сундук', 'Пиратский сундук'][chest._ci],
							message: this.parseReward(data?.r),
						}, 'message');
					} else this._isMounted && needReload && this.setBotLog(`Сундук ещё взламывается`, 'text');
				} else this._isMounted && needReload && this.setBotLog(`Нет доступных сундуков для открытия`, 'text');
			} else {
				this.state.times.chest = null;
				this.state.hints.chest = 'Нет доступных сундуков';
			}
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'chest' && action == 'open') {
			let data;
			if (dataProfile?.chests?.ch?.length) {
				let chest = dataProfile?.chests?.ch?.find(chest => Number(chest._o) == 0);
				if (chest) {
					data = this._isMounted && await getGame(this.props.state.server, {
						i: 100,
						t: chest?._id,
					}, getGameAuth);
					if (data?.ch) {
						this._isMounted && setBotLog({
							avatar: `bot/resources/1_${chest._ci}.png`,
							name: ['', 'Деревянный сундук', 'Серебряный сундук', 'Золотой сундук', 'Магический сундук', 'Трофейный сундук', 'Сундук', 'Пиратский сундук'][chest._ci],
							message: `Откроется через ${this.props.options.getTime(data?.ch?._ot)}`,
						}, 'message');
					} else this._isMounted && needReload && this.setBotLog(`Нет доступных мест для взлома`, 'text');
				} else this._isMounted && needReload && this.setBotLog(`Нет доступных сундуков для взлома`, 'text');
			} else {
				this.state.times.chest = null;
				this.state.hints.chest = 'Нет доступных сундуков';
			}
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'pet' && action == 'collect') {
			if (Number(dataProfile?.u?._pet) != 0) {
				let data;
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 136,
					t: dataProfile?.u?._pet,
				}, getGameAuth);
				if (data?.r) {
					this._isMounted && setBotLog({
						avatar: `bot/resources/4_${dataProfile?.u?._pet}.png`,
						name: ['', 'Полярный Тигр', 'Северный Волк', 'Дух Воды', 'Панда', 'Грабоид'][dataProfile?.u?._pet],
						message: this.parseReward(data?.r),
					}, 'message');
				} else this._isMounted && needReload && this.setBotLog(`Питомец ещё в пути`, 'text');
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'pet' && action == 'send') {
			if (Number(dataProfile?.u?._pet) != 0) {
				let data;
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 135,
					t: dataProfile?.u?._pet,
				}, getGameAuth);
				if (data?.petloot) {
					this._isMounted && setBotLog({
						avatar: `bot/resources/4_${dataProfile?.u?._pet}.png`,
						name: ['', 'Полярный Тигр', 'Северный Волк', 'Дух Воды', 'Панда', 'Грабоид'][dataProfile?.u?._pet],
						message: `Прибудет через ${this.props.options.getTime(data?.petloot?._end_time)}`,
					}, 'message');
				} else {
					if (Number(dataProfile?.pets?.p?.find(pet => Number(pet._id) == Number(dataProfile?.u?._pet))?._lp) > Number(dataProfile?.u?._pf1)) {
						this._isMounted && needReload && this.setBotLog(`На отправку питомца не хватает еды`, 'text');
					} else this._isMounted && needReload && this.setBotLog(`Питомец ещё не прибыл`, 'text');
				}
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'lottery' && action == 'collect') {
			let data;
			if (this.state.times.lottery <= 0) {
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 28,
					t1: 5,
					t2: 1,
					t3: 0,
				}, getGameAuth);
				data = data?.r?.find(reward => reward?._id == undefined);
				if (data) {
					this._isMounted && setBotLog({
						avatar: `bot/resources/3.png`,
						name: `Лотерея`,
						message: this.parseReward(data),
					}, 'message');
				} else this._isMounted && needReload && this.setBotLog(`Нет бесплатных попыток лотереи`, 'text');
			} else this._isMounted && needReload && this.setBotLog(`Нет бесплатных попыток лотереи`, 'text');
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'guildBuild' && action == 'collect') {
			if (Number(dataProfile?.u?._clan_id) != 0) {
				let data;
				let count = 0;
				for (let build of [5, 6]) {
					data = this._isMounted && await getGame(this.props.state.server, {
						i: 112,
						t: build,
					}, getGameAuth);
					if (data?.r) {
						count++;
						this._isMounted && setBotLog({
							avatar: `bot/resources/1.png`,
							name: `Здание гильдии`,
							message: this.parseReward(data?.r),
						}, 'message');
					}
				}
				if (count == 0) this._isMounted && needReload && this.setBotLog(`Нет доступных зданий для обыска`, 'text');
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'guildReward' && action == 'collect') {
			if (Number(dataProfile?.u?._clan_id) != 0) {
				let data;
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 155,
				}, getGameAuth);
				if (data?.msg == 'Необходимо состоять в Гильдии.' || data?.msg == 'Ваша гильдия не имеет захваченных территорий.' || data?.msg == 'Вы уже забрали свою долю на сегодня.') {
					this.state.times.guildReward = null;
					this.state.hints.guildReward = data?.msg.replace(/\./gm, '');
					this._isMounted && needReload && this.setBotLog(data?.msg.replace(/\./gm, ''), 'text');
				} else {
					this._isMounted && setBotLog({
						avatar: `bot/resources/2.png`,
						name: `Дань гильдии`,
						message: this.parseReward(data?.r),
					}, 'message');
					this.state.times.guildReward = null;
					this.state.hints.guildReward = 'Вы уже забрали свою долю на сегодня';
				}
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'guildWars' && action == 'collect') {
			if (Number(dataProfile?.u?._clan_id) != 0) {
				let data;
				let count = 0;
				if (this.state.data.guildWars.start && this.state.data.guildWars.end) {
					this.state.times.guildWars = [];
					for (let i = this.state.data.guildWars.start; i <= this.state.data.guildWars.end; i++) this.state.times.guildWars.push({ id: i, name: `Набег #${i}`, date: null });
				}
				for (let war of this.state.times.guildWars || []) {
					data = this._isMounted && await getGame(this.props.state.server, {
						i: 106,
						t: war.id,
					}, getGameAuth);
					if (data?.cwar?.u) {
						war.name = data?.cwar?._en || `Набег #${war.id}`;
						typeof data?.cwar?.u?.length == 'undefined' ? data.cwar.u = [data?.cwar?.u] : [];
						let reward = data?.cwar?.u?.find(user => user.hasOwnProperty('r'));
						if (reward?.r && Number(reward?._rtn) == 0) {
							data = this._isMounted && await getGame(this.props.state.server, {
								i: 125,
								t: war.id,
							}, getGameAuth);
							if (data?.r) {
								count++;
								this._isMounted && setBotLog({
									avatar: `bot/resources/6_${['', 'бандитскийлагерь', 'логовогоблинов', 'фортнежити'].indexOf(war.name.toLowerCase().replace(/ /gm, ''))}.png`,
									name: `${war.name} ${war.date}`,
									message: this.parseReward(data?.r),
								}, 'message');
							} else if (data) {
								if (!war.date) {
									this._isMounted && setBotLog({
										avatar: `bot/resources/6_${['', 'бандитскийлагерь', 'логовогоблинов', 'фортнежити'].indexOf(war.name.toLowerCase().replace(/ /gm, ''))}.png`,
										name: `${war.name}`,
										message: `Обнаружен набег #${war.id} с неизвестным состоянием`,
									}, 'message');
								}
							}
						} else if (reward) {
							if (!war.date) {
								this._isMounted && setBotLog({
									avatar: `bot/resources/6_${['', 'бандитскийлагерь', 'логовогоблинов', 'фортнежити'].indexOf(war.name.toLowerCase().replace(/ /gm, ''))}.png`,
									name: `${war.name}`,
									message: `Обнаружен набег #${war.id} с собранной наградой`,
								}, 'message');
							}
						}
					} else if (data?.cwar) {
						if (!war.date) {
							this._isMounted && setBotLog({
								avatar: `bot/resources/6_${['', 'бандитскийлагерь', 'логовогоблинов', 'фортнежити'].indexOf(war.name.toLowerCase().replace(/ /gm, ''))}.png`,
								name: `${war.name}`,
								message: `Обнаружен набег #${war.id} без вашего участия`,
							}, 'message');
						}
					} else {
						this._isMounted && this.setBotLog(`Набег #${war.id} не найден`, 'text');
					}
				}
				if (count == 0) this._isMounted && needReload && this.setBotLog(`Нет доступных набегов для сбора`, 'text');
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'daily' && action == 'collect') {
			let data;
			data = this._isMounted && await getGame(this.props.state.server, {
				i: 20,
			}, getGameAuth);
			if (Number(data.res._val) == 1) {
				this._isMounted && setBotLog({
					avatar: `bot/resources/7.png`,
					name: `Ежедневная награда`,
					message: 'Ежедневная награда собрана',
				}, 'message');
			} else this._isMounted && needReload && this.setBotLog(`Ежедневная награда уже собрана`, 'text');
			this.state.times.daily = null;
			this.state.hints.daily = 'Ежедневная награда уже собрана';
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'vip' && action == 'collect') {
			if (Number(dataProfile?.u?._va) != 0) {
				let data;
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 146,
					t: 1,
				}, getGameAuth);
				if (data?.r) {
					this._isMounted && setBotLog({
						avatar: `bot/resources/8.png`,
						name: `Ежедневная награда`,
						message: this.parseReward(data?.r),
					}, 'message');
				} else this._isMounted && needReload && this.setBotLog(`Премиум награда уже собрана`, 'text');
				this.state.times.vip = null;
				this.state.hints.vip = 'Премиум награда уже собрана';
				this._isMounted && needReload && await this.BotResources();
			}
		}
		if (mode == 'search' && action == 'collect') {
			let data;
			let reward = [];
			let count = 0;
			for (let user of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
				data = this._isMounted && await getGame(this.props.state.server, {
					i: 8,
					t: user,
				}, getGameAuth);
				if (data?.msg == 'На сегодня хватит! Можно продолжить завтра.') break;
				if (data?.r) {
					count++;
					reward.push(data?.r);
				}
			}
			if (count != 0) {
				this._isMounted && setBotLog({
					avatar: `bot/resources/9.png`,
					name: `Обыск друзей`,
					message: this.parseReward(this.joinReward(reward)),
				}, 'message');
			} else this._isMounted && needReload && this.setBotLog(`Лимит обыска друзей`, 'text');
			this.state.times.search = null;
			this.state.hints.search = 'Лимит обыска друзей';
			this._isMounted && needReload && await this.BotResources();
		}
		if (mode == 'all') {
			this._isMounted && await this.BotResources('map', 'collect', false);
			this._isMounted && await this.BotResources('chest', 'collect', false);
			this._isMounted && await this.BotResources('chest', 'open', false);
			this._isMounted && await this.BotResources('pet', 'collect', false);
			this._isMounted && await this.BotResources('pet', 'send', false);
			this._isMounted && await this.BotResources('lottery', 'collect', false);
			this._isMounted && await this.BotResources('search', 'collect', false);
			this._isMounted && await this.BotResources('daily', 'collect', false);
			this._isMounted && await this.BotResources('vip', 'collect', false);
			this._isMounted && await this.BotResources('guildBuild', 'collect', false);
			this._isMounted && await this.BotResources('guildReward', 'collect', false);
			this._isMounted && await this.BotResources('guildWars', 'collect', false);
		}

		this._isMounted && clearInterval(globalTimer);
		globalTimer = this._isMounted && setInterval(() => {
			let times = this.state.times;
			if (times.chest > 0) times = {...times, chest: times.chest-1};
			if (times.pet > 0) times = {...times, pet: times.pet-1};
			if (times.lottery > 0) times = {...times, lottery: times.lottery-1};
			if (times.guildBuilds > 0) times = {...times, guildBuilds: times.guildBuilds-1};
			this.setState({times});
		}, 1000);

		this._isMounted && this.setState({ isLoad: false });
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		this._isMounted = true;
		syncBot = null;
		await this.BotResources();
	};
	async componentDidUpdate() {
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
	};
	async componentWillUnmount () {
		this._isMounted = false;
		syncBot = null;
		clearInterval(globalTimer);
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent } = this.props;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Ресурсы';
		const description = 'Мой профиль';
		const avatar = 'labels/14.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						<CardScroll className='ResourcesGrid'>
							{this.state.resources.map((resource, x) => <Card key={x}>
								{!this.state.isLoad?<>
									<Avatar size={18} mode="image" src={`${pathImages}bot/resources/${resource.id}.png`} />
									<div>{options.numberSpaces(resource.count || 0)}</div>
								</>:<>
									<Skeleton height={18} width={18} flexShrink={0}/>
									<Skeleton height={12} width={36} flexShrink={0}/>
								</>}
							</Card>)}
						</CardScroll>
						<Spacing size={8} style={{padding: 0}}/>
					</div>
					{syncBot?<React.Fragment>
						<PullToRefresh onRefresh={() => !this.state.isLoad&&this.BotResources().then(() => this.setBotLog(`данные обновлены`, 'text'))} isFetching={this.state.isLoad}>
							<div className="Scroll" style={{maxHeight: state.isDesktop ? '314px' : 'unset'}}>
								<div className='ActionCards'>
									<div className='ActionCard' isdisabled={`${this.state.times.map == null}`}>
										{this.state.times.map == null && <div className='ActionCard__hint'>{this.state.hints.map || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Карта</div>
												<div className='ActionCard__head--after'>{this.state.times.map || '0/0'}</div>
											</div>
											<div className='ActionCard__body'>Взаимодействие со зданиями на карте</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('map', 'collect')}>Собрать</Button>
												<Button mode="secondary" loading={this.state.isLoad} onClick={() => this.BotResources('map', 'upgrade')}>Улучшить</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.chest == null}`}>
										{this.state.times.chest == null && <div className='ActionCard__hint'>{this.state.hints.chest || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Сундук</div>
												<div className='ActionCard__head--after'>{this.props.options.getTime(this.state.times.chest)}</div>
											</div>
											<div className='ActionCard__body'>Взаимодействие с сундуками в профиле</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} disabled={this.state.times.chest > 0 || this.state.times.chest == 'clear'} onClick={() => this.BotResources('chest', 'collect')}>Собрать</Button>
												<Button mode="secondary" loading={this.state.isLoad} disabled={this.state.times.chest != 'clear'} onClick={() => this.BotResources('chest', 'open')}>Взломать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.pet == null}`}>
										{this.state.times.pet == null && <div className='ActionCard__hint'>{this.state.hints.pet || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Питомец</div>
												<div className='ActionCard__head--after'>{this.props.options.getTime(this.state.times.pet)}</div>
											</div>
											<div className='ActionCard__body'>Взаимодействие с активным питомцем</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} disabled={this.state.times.pet > 0 || this.state.times.pet == 'clear'} onClick={() => this.BotResources('pet', 'collect')}>Собрать</Button>
												<Button mode="secondary" loading={this.state.isLoad} disabled={this.state.times.pet != 'clear'} onClick={() => this.BotResources('pet', 'send')}>Отправить</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.lottery == null}`}>
										{this.state.times.lottery == null && <div className='ActionCard__hint'>{this.state.hints.lottery || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Лотерея</div>
												<div className='ActionCard__head--after'>{this.props.options.getTime(this.state.times.lottery)}</div>
											</div>
											<div className='ActionCard__body'>Получение награды за лотерею</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} disabled={this.state.times.lottery > 0} onClick={() => this.BotResources('lottery', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.search == null}`}>
										{this.state.times.search == null && <div className='ActionCard__hint'>{this.state.hints.search || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Обыск друзей</div>
											</div>
											<div className='ActionCard__body'>Получение награды за обыск друзей</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('search', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.daily == null}`}>
										{this.state.times.daily == null && <div className='ActionCard__hint'>{this.state.hints.daily || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Ежедневная награда</div>
											</div>
											<div className='ActionCard__body'>Получение награды за вход в игру</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('daily', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.vip == null}`}>
										{this.state.times.vip == null && <div className='ActionCard__hint'>{this.state.hints.vip || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Премиум сундук</div>
											</div>
											<div className='ActionCard__body'>Получение награды за премиум статус</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('vip', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.guildBuilds == null}`}>
										{this.state.times.guildBuilds == null && <div className='ActionCard__hint'>{this.state.hints.guildBuilds || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Здания гильдии</div>
												<div className='ActionCard__head--after'>{this.props.options.getTime(this.state.times.guildBuilds)}</div>
											</div>
											<div className='ActionCard__body'>Получение награды за обыск зданий</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} disabled={this.state.times.guildBuilds > 0} onClick={() => this.BotResources('guildBuild', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.guildReward == null}`}>
										{this.state.times.guildReward == null && <div className='ActionCard__hint'>{this.state.hints.guildReward || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Дань гильдии</div>
											</div>
											<div className='ActionCard__body'>Получение награды за захваченные районы</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('guildReward', 'collect')}>Собрать</Button>
											</div>
										</div>
									</div>
									<div className='ActionCard' isdisabled={`${this.state.times.guildWars == null}`}>
										{this.state.times.guildWars == null && <div className='ActionCard__hint'>{this.state.hints.guildWars || 'Недоступно'}</div>}
										<div>
											<div className='ActionCard__head'>
												<div className='ActionCard__head--title'>Набеги гильдии</div>
											</div>
											<div className='ActionCard__body'>Получение награды за побеждённых врагов</div>
											<div className='ActionCard__bottom'>
												<Button mode="commerce" loading={this.state.isLoad} onClick={() => this.BotResources('guildWars', 'collect')}>Собрать</Button>
												<Input disabled={this.state.isLoad} placeholder='Начало' value={String(this.state.data.guildWars.start || '')} onChange={(e) => (this.state.data.guildWars.start = Number(e.target.value), this.setState({ data: this.state.data }))} type="number"/>
												<Input disabled={this.state.isLoad} placeholder='Конец' value={String(this.state.data.guildWars.end || '')} onChange={(e) => (this.state.data.guildWars.end = Number(e.target.value), this.setState({ data: this.state.data }))} type="number"/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</PullToRefresh>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={8} />
							<div className="BotLog Scroll" style={{marginLeft: 8, marginRight: state.isDesktop?0:8}}>{!Array.isArray(this.state.botLog)?this.state.botLog:this.state.botLog.map((item, x) => {
								if (item.type == 'text') {
									return (<span key={x} className={item.color}>{item.message}</span>);
								} else return (<div key={x} className="Log__message">
									<Avatar size={36} mode="app" src={`${pathImages}${item.message.avatar}`} />
									<div className="Log__message--main">
										<div className="Log__message--title">
											<span>{item.message.title}</span>
											<span>{item.message.time}</span>
										</div>
										<div className="Log__message--children">{Array.isArray(item.message.message)?item.message.message.map((item, x) => {
											return (<div key={x} className="Log__message">
												{item.avatar&&<Avatar className={['Предмет', 'Коллекция', 'Заточка', 'Камень'].includes(item.title)&&"Item"} size={36} mode="app" src={`${pathImages}${item.avatar}`} />}
												<div className="Log__message--main">
													<div className="Log__message--title">
														<span>{item.title}</span>
													</div>
													<div className="Log__message--children">{item.message}</div>
												</div>
											</div>)
										}):item.message.message}</div>
									</div>
								</div>);
							})}</div>
							<Spacing separator size={16} style={{padding: 0, marginRight: state.isDesktop&&'-7px', marginLeft: state.isDesktop&&'-7px'}}/>
							<div style={{
								display: 'flex',
								marginRight: state.isDesktop ? 0 : 8,
								marginLeft: state.isDesktop ? 0 : 8
							}}>
								<Button size="m" mode="tertiary" onClick={() => this.setBotLog('clear')} stretched>Отчистить лог действий</Button>
							</div>
							<Spacing size={8} />
							{state.isDesktop?<div style={{
								display: 'flex',
								marginRight: 0,
								marginLeft: 0
							}}>
								<Button size="m" onClick={() => this.BotResources('all').then(() => this.setBotLog(`все ресурсы собраны`, 'text'))} disabled={this.state.isLoad} loading={this.state.isLoad} stretched mode="commerce" style={{ marginRight: 8 }}>Собрать всё</Button>
								<Button size="m" onClick={() => this.BotResources().then(() => this.setBotLog(`данные обновлены`, 'text'))} disabled={this.state.isLoad} loading={this.state.isLoad} stretched mode="secondary">Обновить</Button>
							</div>:<div style={{
								display: 'flex',
								marginRight: 8,
								marginLeft: 8
							}}>
								<Button size="m" onClick={() => this.BotResources('all').then(() => this.setBotLog(`все ресурсы собраны`, 'text'))} disabled={this.state.isLoad} loading={this.state.isLoad} stretched mode="commerce" style={{ marginRight: 8 }}>Собрать всё</Button>
								<Button size="m" onClick={() => this.BotResources().then(() => this.setBotLog(`данные обновлены`, 'text'))} disabled={this.state.isLoad} loading={this.state.isLoad} stretched mode="secondary">Обновить</Button>
							</div>}
						</div>
					</React.Fragment>:<React.Fragment>
						<div className='ActionCards'>
							{new Array(6).fill(null).map((item, x) => <div className='ActionCard' key={x}>
								<div className='ActionCard__head'>
									<div className='ActionCard__head--title'><Skeleton height={20} width={70}/></div>
								</div>
								<div className='ActionCard__body'><Skeleton height={16} width={'75%'}/></div>
								<div className='ActionCard__bottom'>
									<Skeleton height={state.isDesktop ? 28 : 30} width={90}/>
									<Skeleton height={state.isDesktop ? 28 : 30} width={90}/>
								</div>
							</div>)}
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={8} />
							<div className="BotLog Scroll" style={{marginLeft: 8, marginRight: state.isDesktop?0:8, overflow: 'hidden'}}>
								<Skeleton height={20} width={144} flexShrink={0}/>
								<div className="Log__message">
									<Skeleton height={36} width={36} marginRight={12} flexShrink={0}/>
									<Skeleton height={36} width={234} flexShrink={0}/>
								</div>
								<Skeleton height={20} width={220} flexShrink={0}/>
								<Skeleton height={20} width={320} flexShrink={0}/>
								<div className="Log__message">
									<Skeleton height={36} width={36} marginRight={12} flexShrink={0}/>
									<Skeleton height={36} width={184} flexShrink={0}/>
								</div>
								<Skeleton height={20} width={100} flexShrink={0}/>
							</div>
							<Spacing separator size={16} style={{padding: 0, marginRight: state.isDesktop&&'-7px', marginLeft: state.isDesktop&&'-7px'}}/>
							<div style={{
								display: 'flex',
								marginRight: state.isDesktop ? 0 : 8,
								marginLeft: state.isDesktop ? 0 : 8
							}}>
								<Skeleton height={state.isDesktop?32:36}/>
							</div>
							<Spacing size={8} />
							{state.isDesktop?<div style={{
								display: 'flex',
								marginRight: 0,
								marginLeft: 0
							}}>
								<Skeleton height={32} width="100%" marginRight={8}/>
								<Skeleton height={32} width="100%"/>
							</div>:<div style={{
								display: 'flex',
								marginRight: 8,
								marginLeft: 8
							}}>
								<Skeleton height={36} width="100%" marginRight={8}/>
								<Skeleton height={36} width="100%"/>
							</div>}
					</div>
					</React.Fragment>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;