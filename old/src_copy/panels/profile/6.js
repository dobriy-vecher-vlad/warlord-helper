import React from 'react';
import {
	Panel,
	Group,
	Spacing,
	SimpleCell,
	CardGrid,
	Card,
	Avatar,
	Button,
	Checkbox,
	Text,
	FormItem,
	Radio,
	Title,
	Footer,
	Placeholder
} from '@vkontakte/vkui';
import { Icon20ErrorCircleOutline, Icon28ListOutline } from '@vkontakte/icons';
import { ReactComponent as SVG_turmalin } from '../../svg/turmalin.svg';
import { ReactComponent as SVG_stone } from '../../svg/stone.svg';
import { ReactComponent as SVG_web } from '../../svg/web.svg';
import { ReactComponent as SVG_numberI } from '../../svg/I.svg';
import { ReactComponent as SVG_numberII } from '../../svg/II.svg';
import { ReactComponent as SVG_numberIII } from '../../svg/III.svg';
import { ReactComponent as SVG_numberIV } from '../../svg/IV.svg';
import Skeleton from '../../components/skeleton';

import Items from '../../data/items.json';
import Stones from '../../data/stones.json';

let syncBot = {
	raids: null,
	isStart: false
};
let bosses = [[
	['Страж Подземелья', 'bot/raids/6.png'],
	['Слепая Тварь', 'bot/raids/1.png'],
	['Инсектоид', 'bot/raids/5.png'],
	['Скорпион Падальщик', 'bot/raids/2.png'],
	['Кровавый Скорпион', 'bot/raids/3.png'],
	['Ледяной Скорпион', 'bot/raids/4.png']
],  [
	['Жнец Душ', 'bot/raids/25.png'],
	['Последователь Культа', 'bot/raids/24.png'],
	['Адепт Культа', 'bot/raids/23.png'],
	['Скорпион Падальщик', 'bot/raids/2.png'],
	['Кровавый Скорпион', 'bot/raids/3.png'],
	['Ледяной Скорпион', 'bot/raids/4.png']
], [
	['Магический паук', 'bot/raids/28.png'],
	['Земляной паук', 'bot/raids/26.png'],
	['Ледяной паук', 'bot/raids/27.png'],
	['Ядовитый паук', 'bot/raids/29.png'],
	['Солдат Паук', 'bot/raids/37.png']
]];
let chests = [
	['Старый сундук', 'bot/raids/92.png'],
	['Железный сундук', 'bot/raids/94.png'],
	['Сапфировый сундук', 'bot/raids/96.png'],
	['Древний сундук', 'bot/raids/98.png'],
	['Эпический сундук', 'bot/raids/100.png']
];
let reward = false;
let api_id = 5536422;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,

			isLoad: false,
			isExit: false,
			isPause: false,
			isDevLog: false,
			
			botLog: <Placeholder
				style={{overflow: "hidden"}}
				icon={<Icon28ListOutline width={56} height={56} />}
				stretched
			>
				Нет новых<br />действий
			</Placeholder>,
			botRaidsSettings: {
				barrels: true,
				chestsTier1: true,
				chestsTier2: true,
				chestsTier3: true,
				chestsTier4: true,
				chestsTier5: true,
				useScrollLightning: false,
				useScrollFire: false,
				selectedRaid: null,
				selectRaid: [{
					id: 1,
					title: 'Подземелье форта',
					icon: 'bot/raids/6.png'
				}, {
					id: 2,
					title: 'Подвал часовни',
					icon: 'bot/raids/25.png'
				}, {
					id: 3,
					title: 'Паучий лес',
					icon: 'bot/raids/28.png'
				}],
				selectedMode: null,
				selectMode: [{
					id: 0,
					title: 'Лёгкий режим',
					icon: 'bot/raids/30.png'
				}, {
					id: 1,
					title: 'Обычный режим',
					icon: 'bot/raids/31.png'
				}, {
					id: 2,
					title: 'Героический режим',
					icon: 'bot/raids/32.png'
				}, {
					id: 3,
					title: 'Легендарный режим',
					icon: 'bot/raids/33.png'
				}]
			}
		};
		this._isMounted = false;
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
			if (type == 'text') log.push({ type: 'text', message: message, color: color });
			if (type == 'boss' && color == null) {
				log.push({ type: 'boss', message: {
					avatar: message.type,
					title: 'Босс',
					time: this.props.options.getRealTime(),
					message: `Убит босс с ${this.props.options.numberSpaces(message._mhp)} HP и ${this.props.options.numberSpaces(message._dmg)} DMG`
				} });
			}
			if (type == 'chest' && color == null) {
				let data = { type: 'chest', message: {
					avatar: message.type,
					title: 'Сундук',
					time: this.props.options.getRealTime(),
					message: (message.rstep&&message.rstep.r)?[]:'Нет награды'
				} };
				if (message.rstep&&message.rstep.r) data.message.message = data.message.message.concat(this.parseReward(message.rstep.r));
				log.push(data);
			}
			if (type == 'barrel' && color == null) {
				let data = { type: 'barrel', message: {
					avatar: 'bot/raids/108.png',
					title: 'Бочка',
					time: this.props.options.getRealTime(),
					message: (message.rstep&&message.rstep.r)?[]:'Нет награды'
				} };
				if (message.rstep&&message.rstep.r) data.message.message = data.message.message.concat(this.parseReward(message.rstep.r));
				log.push(data);
			}
			if (type == 'boss' && color != null && this.state.isDevLog == true) {
				let data = { type: 'boss', message: {
					avatar: message.type,
					title: 'Босс',
					time: this.props.options.getRealTime(),
					message: color
				} };
				log.push(data);
			}
		}
		this._isMounted && this.setState({ botLog: log }, () => this._isMounted && document.querySelector('.BotLog.Scroll')&&document.querySelector('.BotLog.Scroll').scrollTo({ top: document.querySelector('.BotLog.Scroll').scrollHeight }));
	};
	BotRaids = async(mode = 'load', needSnackbar = false) => {
		if (mode == 'start') {
			syncBot.isStart = true;
			this._isMounted && this.setState({ botLog: this.state.botLog });
		}
		const { botRaidsSettings } = this.state;
		const { setBotLog } = this;
		const { OpenModal, BotAPI, openSnackbar, numberForm, setActivePanel } = this.props.options;
		const { state } = this.props;
		const { getGame, server } = this.props.state;
		if (mode == 'energy') {
			if (syncBot.raids.point) {
				let energy = 0;
				syncBot.raids.chests.filter(item => item.status == 1).map((item, x) => {
					if ((item.type == 1 && botRaidsSettings.chestsTier1) || (item.type == 2 && botRaidsSettings.chestsTier2) || (item.type == 3 && botRaidsSettings.chestsTier3) || (item.type == 4 && botRaidsSettings.chestsTier4) || (item.type == 5 && botRaidsSettings.chestsTier5)) {
						energy += item.en;
					}
				});
				syncBot.raids.barrels.filter(item => item.status == 1).map((item, x) => {
					if (botRaidsSettings.barrels) {
						energy += 3;
					}
				});
				syncBot.raids.bosses.filter(item => item.status == 0).map((item, x) => {
					if (item.type == 1) {
						energy += 6;
					} else {
						energy += 1;
					}
				});
				syncBot.raids.energy = energy;
				this._isMounted && this.setState({ isLoad: false });
				this._isMounted && needSnackbar&&await this.props.options.Storage({key: 'raidSettings', value: JSON.stringify(botRaidsSettings)});
				needSnackbar&&openSnackbar({text: `Настройки применены, на рейд необходимо ${energy} ${numberForm(energy, ['энергия', 'энергии', 'энергии'])}`, icon: 'done'});
			}
			return;
		}
		if (mode == 'pause') {
			syncBot.isStart = false;
			this._isMounted && setBotLog(`Бот поставлен на паузу, завершаем последнее действие`, 'text');
			this._isMounted && this.setState({ isPause: false, isLoad: true });
			this._isMounted && this.BotRaids('reload');
			return;
		}
		let sslt = 0;
		let api_uid = state.login || state.user?.vk?.id;
		let auth_key = state.auth;
		if (!auth_key) {
			auth_key = this._isMounted && await BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Для продолжения работы необходимо указать пароль авторизации'});
			if (auth_key == 'modal') {
				this._isMounted && setActivePanel('profile');
				return
			} else if (!auth_key) {
				// this._isMounted && OpenModal(`alert`, {header: 'Ошибка при получении auth_key', subheader: `Перезайдите в приложение и укажите новый auth_key`}, null, 'card');
				this._isMounted && setActivePanel('profile');
				return
			}
		}
		let getGameAuth = {
			login: api_uid,
			password: auth_key,
		};
		// this.setState({ popout: <ScreenSpinner /> });
		let data = {
			chests: [],
			barrels: [],
			bosses: [],
			reward: [],
			energy: syncBot&&syncBot.raids&&syncBot.raids.energy?syncBot.raids.energy:0,
			id: 0,
			mode: 0,
			point: false,
			hp: 0,
			limit: 0,
			player: null
		};
		function PriorityQueue () {
			this._nodes = [];
			this.enqueue = function (priority, key) {
				this._nodes.push({key: key, priority: priority });
				this.sort();
			};
			this.dequeue = function () {
				return this._nodes.shift().key;
			};
			this.sort = function () {
				this._nodes.sort(function (a, b) {
					return a.priority - b.priority;
				});
			};
			this.isEmpty = function () {
				return !this._nodes.length;
			};
		}
		function Graph(){
			var INFINITY = 1/0;
			this.vertices = {};
			this.addVertex = function(name, edges){
				this.vertices[name] = edges;
			};
			this.shortestPath = function (start, finish) {
				var nodes = new PriorityQueue(),
					distances = {},
					previous = {},
					path = [],
					smallest, vertex, neighbor, alt;
				for(vertex in this.vertices) {
					if(vertex === start) {
						distances[vertex] = 0;
						nodes.enqueue(0, vertex);
					} else {
						distances[vertex] = INFINITY;
						nodes.enqueue(INFINITY, vertex);
					}
					previous[vertex] = null;
				}
				while(!nodes.isEmpty()) {
					smallest = nodes.dequeue();
					if(smallest === finish) {
						path = [];
						while(previous[smallest]) {
							path.push(smallest);
							smallest = previous[smallest];
						}
						break;
					}
					if(!smallest || distances[smallest] === INFINITY){
						continue;
					}
					for(neighbor in this.vertices[smallest]) {
						alt = distances[smallest] + this.vertices[smallest][neighbor];
						if(alt < distances[neighbor]) {
							distances[neighbor] = alt;
							previous[neighbor] = smallest;
							nodes.enqueue(alt, neighbor);
						}
					}
				}
				return path;
			};
		}
		const pathToMove = [[
			{from: 1, to: [2]},
			{from: 2, to: [1, 6, 3]},
			{from: 6, to: [2, 18]},
			{from: 18, to: [6, 20]},
			{from: 20, to: [18, 5, 4]},
			{from: 5, to: [20, 4, 13]},
			{from: 4, to: [20, 5, 13]},
			{from: 13, to: [5, 4, 21]},
			{from: 21, to: [13, 7, 22, 23]},
			{from: 22, to: [21]},
			{from: 7, to: [21]},
			{from: 23, to: [21, 24, 26, 31]},
			{from: 24, to: [23, 25]},
			{from: 26, to: [23, 25]},
			{from: 25, to: [24, 26, 27]},
			{from: 27, to: [25, 28]},
			{from: 28, to: [27, 30, 29]},
			{from: 29, to: [28]},
			{from: 30, to: [28]},
			{from: 31, to: [23, 32, 33]},
			{from: 32, to: [31, 34]},
			{from: 34, to: [32, 35]},
			{from: 35, to: [34, 33]},
			{from: 33, to: [35, 31]},
			{from: 3, to: [2, 9]},
			{from: 9, to: [3, 8, 10]},
			{from: 8, to: [9, 19]},
			{from: 19, to: [8, 16]},
			{from: 16, to: [19]},
			{from: 10, to: [9, 11]},
			{from: 11, to: [10, 14, 12]},
			{from: 14, to: [11, 15]},
			{from: 15, to: [14, 44]},
			{from: 44, to: [15, 45, 42]},
			{from: 45, to: [44, 12, 47]},
			{from: 12, to: [11, 45, 46]},
			{from: 46, to: [12, 48]},
			{from: 47, to: [45, 48]},
			{from: 48, to: [46, 47, 49]},
			{from: 49, to: [48]},
			{from: 42, to: [44, 43, 41]},
			{from: 43, to: [42, 41, 58]},
			{from: 41, to: [42, 43, 40]},
			{from: 40, to: [41, 37, 39]},
			{from: 39, to: [40, 38]},
			{from: 38, to: [39]},
			{from: 37, to: [40, 36]},
			{from: 36, to: [37, 17]},
			{from: 17, to: [36]},
			{from: 58, to: [43, 57]},
			{from: 57, to: [58, 59, 56]},
			{from: 56, to: [57, 61]},
			{from: 61, to: [56, 62, 60]},
			{from: 59, to: [57, 60]},
			{from: 60, to: [59, 61]},
			{from: 62, to: [61, 63]},
			{from: 63, to: [62, 55, 64]},
			{from: 55, to: [63, 54]},
			{from: 54, to: [55, 53]},
			{from: 53, to: [54, 51]},
			{from: 51, to: [53, 50, 52]},
			{from: 52, to: [51]},
			{from: 50, to: [51]},
			{from: 64, to: [63, 65]},
			{from: 65, to: [64, 66]},
			{from: 66, to: [65, 67, 68]},
			{from: 67, to: [66]},
			{from: 68, to: [66, 70, 69]},
			{from: 69, to: [68, 70]},
			{from: 70, to: [68, 69, 71]},
			{from: 71, to: [70, 72]},
			{from: 72, to: [71, 73]},
			{from: 73, to: [72, 74]},
			{from: 74, to: [73, 75]},
			{from: 75, to: [74, 76]},
			{from: 76, to: [75, 78]},
			{from: 78, to: [76, 77, 79]},
			{from: 77, to: [78]},
			{from: 79, to: [78]}
		], [
			{from: 1, to: [2]},
			{from: 2, to: [1, 6]},
			{from: 6, to: [2, 5]},
			{from: 5, to: [6, 7, 9]},
			{from: 7, to: [5, 4]},
			{from: 4, to: [7, 3]},
			{from: 3, to: [4]},
			{from: 9, to: [5, 8, 16, 19]},
			{from: 8, to: [9, 10]},
			{from: 10, to: [8, 11, 12]},
			{from: 12, to: [11, 10, 14]},
			{from: 14, to: [15, 12]},
			{from: 15, to: [14]},
			{from: 11, to: [12, 10, 31, 22]},
			{from: 31, to: [11]},
			{from: 22, to: [11, 26]},
			{from: 26, to: [22, 49]},
			{from: 49, to: [26, 48]},
			{from: 48, to: [49, 47, 39, 50]},
			{from: 50, to: [48, 46]},
			{from: 46, to: [50, 41, 25]},
			{from: 25, to: [46, 24]},
			{from: 24, to: [25, 23, 77]},
			{from: 23, to: [24, 21]},
			{from: 21, to: [23, 16]},
			{from: 16, to: [21, 9]},
			{from: 41, to: [46, 43, 58]},
			{from: 43, to: [41, 58]},
			{from: 58, to: [41, 43, 77]},
			{from: 77, to: [24, 58, 79, 69]},
			{from: 79, to: [77, 69]},
			{from: 69, to: [77, 79, 54]},
			{from: 54, to: [69, 30]},
			{from: 30, to: [54, 63, 56]},
			{from: 56, to: [30, 29, 55]},
			{from: 55, to: [56, 64]},
			{from: 64, to: [55, 61]},
			{from: 61, to: [64]},
			{from: 29, to: [56, 36, 27]},
			{from: 27, to: [29, 67]},
			{from: 67, to: [27]},
			{from: 36, to: [29, 34]},
			{from: 34, to: [36, 28, 35]},
			{from: 28, to: [34]},
			{from: 35, to: [34, 32]},
			{from: 32, to: [35, 33]},
			{from: 33, to: [32, 20]},
			{from: 20, to: [33, 18, 17, 13]},
			{from: 18, to: [20]},
			{from: 13, to: [20]},
			{from: 17, to: [20, 19]},
			{from: 19, to: [17, 9]},
			{from: 63, to: [30, 65]},
			{from: 65, to: [63, 66]},
			{from: 66, to: [65, 68, 70]},
			{from: 68, to: [66]},
			{from: 70, to: [66, 71]},
			{from: 71, to: [70, 74, 62, 60]},
			{from: 74, to: [71, 62, 73]},
			{from: 60, to: [71, 62, 73]},
			{from: 62, to: [71, 74, 60, 73]},
			{from: 73, to: [74, 62, 60, 72]},
			{from: 72, to: [73]},
			{from: 47, to: [48, 51]},
			{from: 51, to: [47, 45, 52]},
			{from: 52, to: [51]},
			{from: 45, to: [51, 42]},
			{from: 42, to: [45, 37, 53]},
			{from: 37, to: [42, 38]},
			{from: 38, to: [37]},
			{from: 53, to: [42, 44]},
			{from: 44, to: [53]},
			{from: 39, to: [48, 78, 40]},
			{from: 40, to: [39, 76]},
			{from: 76, to: [40, 75]},
			{from: 75, to: [76, 57, 59]},
			{from: 59, to: [75, 57]},
			{from: 57, to: [59, 75]},
			{from: 78, to: [80, 39]},
			{from: 80, to: [78, 81, 83]},
			{from: 81, to: [80, 82]},
			{from: 82, to: [81]},
			{from: 83, to: [80, 84]},
			{from: 84, to: [83, 85, 91]},
			{from: 91, to: [84, 92]},
			{from: 92, to: [91, 93]},
			{from: 93, to: [92]},
			{from: 85, to: [84, 86, 88, 90]},
			{from: 86, to: [85, 87]},
			{from: 87, to: [86, 88]},
			{from: 88, to: [87, 85, 89]},
			{from: 89, to: [88, 90]},
			{from: 90, to: [89, 85]}
		], [
			{from: 1, to: [54, 17]},
			{from: 17, to: [1, 70]},
			{from: 70, to: [17, 2]},
			{from: 2, to: [70, 18]},
			{from: 18, to: [2, 68]},
			{from: 68, to: [18, 65]},
			{from: 54, to: [1, 3]},
			{from: 3, to: [54, 66]},
			{from: 66, to: [3, 65]},
			{from: 65, to: [68, 66, 34]},
			{from: 34, to: [65, 31]},
			{from: 31, to: [34, 79]},
			{from: 79, to: [31, 87]},
			{from: 87, to: [79, 73]},
			{from: 73, to: [87, 50, 74]},
			{from: 50, to: [73, 93]},
			{from: 93, to: [50, 89]},
			{from: 89, to: [93, 49]},
			{from: 49, to: [89, 92]},
			{from: 92, to: [49, 39, 41]},
			{from: 39, to: [92, 82]},
			{from: 82, to: [39]},
			{from: 41, to: [92, 28]},
			{from: 28, to: [41, 58]},
			{from: 58, to: [28, 77]},
			{from: 77, to: [58, 7, 19]},
			{from: 19, to: [77, 30]},
			{from: 30, to: [19, 52]},
			{from: 52, to: [30]},
			{from: 7, to: [77, 20]},
			{from: 20, to: [7, 33, 21]},
			{from: 33, to: [20, 29]},
			{from: 29, to: [33, 21, 55]},
			{from: 21, to: [29, 20, 35]},
			{from: 35, to: [21, 9, 15]},
			{from: 15, to: [55, 35]},
			{from: 55, to: [15, 29]},
			{from: 63, to: [55, 71, 4]},
			{from: 9, to: [35, 14]},
			{from: 14, to: [9, 43, 56, 42]},
			{from: 42, to: [14, 27]},
			{from: 27, to: [42]},
			{from: 43, to: [14, 75]},
			{from: 75, to: [43, 81]},
			{from: 81, to: [75, 16]},
			{from: 16, to: [81, 67, 32]},
			{from: 67, to: [16, 61]},
			{from: 61, to: [67]},
			{from: 32, to: [16, 56]},
			{from: 56, to: [32, 26, 14]},
			{from: 26, to: [56, 46]},
			{from: 46, to: [26, 22]},
			{from: 22, to: [46, 78]},
			{from: 78, to: [22, 83]},
			{from: 83, to: [78, 24, 45, 44]},
			{from: 44, to: [83, 8]},
			{from: 8, to: [44, 45]},
			{from: 45, to: [8, 83]},
			{from: 24, to: [83, 10, 12]},
			{from: 10, to: [24, 13]},
			{from: 12, to: [24, 13]},
			{from: 13, to: [12, 10]},
			{from: 47, to: [8, 5]},
			{from: 5, to: [47, 37]},
			{from: 37, to: [5, 88]},
			{from: 88, to: [37, 53]},
			{from: 53, to: [88, 6]},
			{from: 6, to: [53, 40]},
			{from: 40, to: [6, 4]},
			{from: 4, to: [40, 63, 90]},
			{from: 90, to: [4, 64]},
			{from: 64, to: [90, 86, 84]},
			{from: 86, to: [64]},
			{from: 84, to: [64, 25]},
			{from: 25, to: [84, 38]},
			{from: 38, to: [25]},
			{from: 71, to: [63, 60, 57]},
			{from: 60, to: [71, 51]},
			{from: 57, to: [71, 51]},
			{from: 51, to: [57, 60]},
			{from: 72, to: [51, 62]},
			{from: 62, to: [72, 74, 76]},
			{from: 74, to: [73, 62]},
			{from: 76, to: [62, 23]},
			{from: 23, to: [76, 69]},
			{from: 69, to: [23]}
		]];
		const pathFinder = async(from, to, path) => {
			let graph = new Graph();
			path.map((item, x) => {
				let data = {};
				item.to.map((item, x) => {
					data[item] = 1;
				});
				graph.addVertex(item.from, data);
			});
			// console.log(from, to, path);
			// return graph.shortestPath(String(from), String(to)).concat([String(from)]).reverse();
			return graph.shortestPath(String(from), String(to)).reverse();
		};
		const updateInfo = async(dataGame) => {
			dataGame.rc.map((item, x) => {
				data.chests.push({
					point: Number(item._p),
					type: Number(item._t),
					status: Number(item._s),
					en: Number(item._t) == 1 ? 8 :
						Number(item._t) == 2 ? 14 :
						Number(item._t) == 3 ? 17 :
						Number(item._t) == 4 ? 18 :
						Number(item._t) == 5 ? (Number(dataGame._mode) == 2 ? 25 : 20) :
						0
				});
			});
			dataGame.bp.map((item, x) => {
				data.barrels.push({
					point: Number(item._p),
					status: Number(item._s)
				});
			});
			dataGame.rb.map((item, x) => {
				data.bosses.push({
					id: Number(item._id),
					point: Number(item._p),
					type: 
						[304, 315, 380].includes(Number(item._id)) ? 1 :
						[292, 301, 303, 310, 314, 317, 319, 325, 326, 328, 371, 376, 377, 384, 387].includes(Number(item._id)) ? 2 :
						[298, 306, 307, 311, 316, 318, 320, 321, 323, 324, 372, 378, 379, 385, 388].includes(Number(item._id)) ? 3 :
						[293, 294, 297, 299, 309, 329, 330, 332, 336, 373, 374, 381, 386, 389].includes(Number(item._id)) ? 4 :
						[295, 302, 308, 312, 334, 375, 382, 383].includes(Number(item._id)) ? 5 :
						[296, 300, 305, 327, 331, 333, 335].includes(Number(item._id)) ? 6 :
						0,
					status: Number(item._s)
				});
			});
			data.reward = dataGame.r;
			if (data.reward && data.reward.i) {
				typeof data.reward.i.length == 'undefined' ? data.reward.i = [data.reward.i] : '';
			}
			data.id = Number(dataGame._id);
			data.mode = Number(dataGame._mode);
			data.point = Number(dataGame._pos);
			data.hp = Number(dataGame._hp);
		};
		const updatePath = async(mode = 'navigation', id = 1, from = 1, to = 1) => {
			if (mode == 'navigation') {
				let marks = [];
				if (botRaidsSettings.barrels) {
					data.barrels.map((item, x) => {
						if (item.status == 1) {
							marks.push({point: item.point, isVisited: false});
						}
					});
				}
				if (botRaidsSettings.chestsTier1 || botRaidsSettings.chestsTier2 || botRaidsSettings.chestsTier3 || botRaidsSettings.chestsTier4 || botRaidsSettings.chestsTier5) {
					data.chests.map((item, x) => {
						if (item.status == 1 && ((item.type == 1 && botRaidsSettings.chestsTier1) || (item.type == 2 && botRaidsSettings.chestsTier2) || (item.type == 3 && botRaidsSettings.chestsTier3) || (item.type == 4 && botRaidsSettings.chestsTier4) || (item.type == 5 && botRaidsSettings.chestsTier5))) {
							marks.push({point: item.point, isVisited: false});
						}
					});
				}
				// marks = [{point: 74, isVisited: false}, {point: 72, isVisited: false}];
				// console.log(marks);
				marks.sort(function(a, b) {
					return a.point < b.point ? -1 : 1;
				});
				// console.log(marks);
				if (syncBot.isStart) {
					this._isMounted && await updatePath('barrel', null, null, null);
					this._isMounted && await updatePath('chest', null, null, null);
					let mark = marks.find(x => x.point === data.point);
					if (mark !== undefined && !mark.isVisited) {
						mark.isVisited = true;
					}
				}
				// console.log(pathToMove[id-1]);
				for (const item of marks) {
					// console.log(marks);
					if (syncBot.isStart && !item.isVisited) {
						let paths = this._isMounted && await pathFinder(data.point, item.point, pathToMove[id-1]);
						// console.log(paths);
						for (const item of paths) {
							if (syncBot.isStart) {
								this._isMounted && await updatePath('move', id, null, Number(item));
								let mark = marks.find(x => x.point === Number(item));
								if (mark !== undefined && !mark.isVisited) {
									mark.isVisited = true;
								}
							}
						}
					}
				}
				if (syncBot.isStart) {
					syncBot.isStart = false;
					this._isMounted && setBotLog(`Собраны все возможные награды, рейд можно завершить`, 'text', 'blue');
					this._isMounted && this.setState({ isLoad: true });
					this._isMounted && this.BotRaids('reload');
				}
			}
			if (mode == 'move') {
				if (this._isMounted && await updatePath('boss', null, null, to)) {
					let dataGame = this._isMounted && await getGame(this.props.state.server, {
						i: 77,
						t: to,
					}, getGameAuth);
					// console.log(dataGame);
					if (Number(dataGame.res._v) == 1) {
						dataGame = this._isMounted && await getGame(this.props.state.server, {
							i: 81,
						}, getGameAuth);
						// console.log(dataGame);
						this._isMounted && setBotLog(`Переместились в точку ${to}`, 'text');
						data.point = to;
						this._isMounted && await updatePath('barrel', null, null, null);
						this._isMounted && await updatePath('chest', null, null, null);
					} else {
						this._isMounted && setBotLog(`Невозможно перейти в точку ${to}`, 'text', 'red');
						this._isMounted && this.BotRaids('pause');
					}
				}
			}
			if (mode == 'barrel' && botRaidsSettings.barrels) {
				// console.log('Проверяем бочку...');
				let barrel = data.barrels.find(item => item.point === data.point);
				if (barrel && barrel.status == 1) {
					let player = this._isMounted && await BotAPI('getStats', auth_key, api_uid, sslt);
					if (player) {
						if (Number(player._en >= 3)) {
							let dataGame = this._isMounted && await getGame(this.props.state.server, {
								i: 82,
							}, getGameAuth);
							// console.log(dataGame);
							barrel.status = 0;
							// setBotLog(`Открыли бочку {point: ${barrel.point}, status: ${barrel.status}}`);
							this._isMounted && setBotLog(dataGame, 'barrel');
						} else {
							this._isMounted && setBotLog(`Не хватает энергии на открытие бочки`, 'text', 'red');
							this._isMounted && this.BotRaids('pause');
						}
					} else {
						this._isMounted && setBotLog(`Ошибочные данные персонажа`, 'text', 'red');
						this._isMounted && this.BotRaids('pause');
					}
				} else if (barrel && barrel.status == 0) {
					// setBotLog(`Бочка уже открыта {point: ${barrel.point}, status: ${barrel.status}}`);
				} else if (barrel) {
					// setBotLog(`Невозможно открыть бочку {point: ${barrel.point}, status: ${barrel.status}}`);
					this._isMounted && setBotLog(`Невозможно открыть бочку`, 'text', 'red');
					this._isMounted && this.BotRaids('pause');
				} else {
					// setBotLog(`Бочка не найдена {point: ${data.point}}`);
				}
			}
			if (mode == 'boss') {
				// console.log('Проверяем босса...');
				let boss = data.bosses.find(item => item.point === to);
				if (boss && boss.status == 0) {
					let player = this._isMounted && await BotAPI('getStats', auth_key, api_uid, sslt);
					if (player) {
						if ((boss.type == 1 && Number(player._en >= 6) || boss.type != 1 && Number(player._en >= 3))) {
							let dataGame = this._isMounted && await getGame(this.props.state.server, {
								i: 11,
								t: boss.id,
								t2: 3,
								t3: 0,
								t4: 0,
								t5: 0,
							}, getGameAuth);
							// console.log(dataGame);
							if ((dataGame == null) || (dataGame && !dataGame.fight)) {
								// setBotLog(`Ошибка при создании босса, пробуем снова... {point: ${boss.point}, status: ${boss.status}}`);
								// setBotLog(`Ошибка при создании босса, пробуем снова...`);
								await wait(3000);
								dataGame = this._isMounted && await getGame(this.props.state.server, {
									i: 11,
									t: boss.id,
									t2: 3,
									t3: 0,
									t4: 0,
									t5: 0,
								}, getGameAuth);
							}
							if (dataGame && dataGame.fight) {
								let hp = Number(dataGame.fight._hp);
								let dmg = Number(dataGame.fight._dmg);
								let myhp = Number(dataGame.fight._myhp);
								let mydmg = Number(data.player._dmgi);
								let skill_3 = Number(data.player._s3);
								let свитокМолнии = Number(data.player._item1);
								let свитокОгня = Number(data.player._item3);
								let свитокМолнииУрон = Math.floor(mydmg*1.5);
								let свитокОгняУрон = mydmg*3;
								let количествоУдаров = 0;
								let количествоУдаровРуки = 0;
								let количествоУдаровМолнии = 0;
								let количествоУдаровОгня = 0;
								let количествоУдаровНавыка = 0;
								let уронПолученный = 0;
								let уронНанесённый = 0;
								let очкиНавыка = 10;
								do {
									if (очкиНавыка >= 9) {
										очкиНавыка = очкиНавыка - 9;
										hp = hp - (mydmg+skill_3*7);
										уронНанесённый = уронНанесённый + (mydmg+skill_3*7);
										количествоУдаровНавыка++;
										if (hp <= 0) break;
									}
									if (botRaidsSettings.useScrollLightning && свитокМолнии != 0) {
										hp = hp - свитокМолнииУрон;
										уронНанесённый = уронНанесённый + свитокМолнииУрон;
										свитокМолнии--;
										количествоУдаровМолнии++;
									} else if (botRaidsSettings.useScrollFire && свитокОгня != 0) {
										hp = hp - свитокОгняУрон;
										уронНанесённый = уронНанесённый + свитокОгняУрон;
										свитокОгня--;
										количествоУдаровОгня++;
									} else {
										hp = hp - mydmg;
										уронНанесённый = уронНанесённый + mydmg;
										количествоУдаровРуки++;
									}
									myhp = myhp - dmg;
									уронПолученный = уронПолученный + dmg;
									очкиНавыка++;
									количествоУдаров++;
								} while (hp > 0 && myhp > 0);
								this._isMounted && setBotLog({...dataGame.fight, type: boss.type}, 'boss', [{
									title: 'Данные боя',
									message: `Атака босса: ${this.props.options.numberSpaces(dmg)}\nЗдоровье босса: ${this.props.options.numberSpaces(hp)}\nМоя атака: ${this.props.options.numberSpaces(mydmg)}\nМоё здоровье: ${this.props.options.numberSpaces(myhp)}\nСвиток молнии: ${this.props.options.numberSpaces(свитокМолнии)}\nСвиток огня: ${this.props.options.numberSpaces(свитокОгня)}\nСвиток молнии урон: ${this.props.options.numberSpaces(свитокМолнииУрон)}\nСвиток огня урон: ${this.props.options.numberSpaces(свитокОгняУрон)}\nКоличество ударов: ${this.props.options.numberSpaces(количествоУдаров)}\nКоличество ударов руки: ${this.props.options.numberSpaces(количествоУдаровРуки)}\nКоличество ударов молнии: ${this.props.options.numberSpaces(количествоУдаровМолнии)}\nКоличество ударов огня: ${this.props.options.numberSpaces(количествоУдаровОгня)}\nКоличество ударов навыка: ${this.props.options.numberSpaces(количествоУдаровНавыка)}\nУрон полученный: ${this.props.options.numberSpaces(уронПолученный)}\nУрон нанесённый: ${this.props.options.numberSpaces(уронНанесённый)}\n`
								}]);
								if ((myhp > 0 && hp <= 0) || (myhp <= 0 && hp <= 0)) {
									let hash = this._isMounted && await BotAPI('getFightHash', null, null, null, {key: `<data><d 
										s0="${количествоУдаровРуки}"
										s1="0"
										s2="0"
										s3="${количествоУдаровНавыка}"
										s4="1"
										c1="${количествоУдаровМолнии}"
										c2="0"
										c3="${количествоУдаровОгня}"
										c4="0"
										c5="0"
										m0="3"
										r="${количествоУдаров+количествоУдаровНавыка}"
										dd="${уронНанесённый}"
										dg="${уронПолученный}"
									/></data>`.replace(/\s+/g,' ')});
									// console.log(hash);
									dataGame = this._isMounted && await getGame(this.props.state.server, {
										i: 12,
										t: hash,
									}, getGameAuth);
									// console.log(dataGame);
									if (dataGame && dataGame.fight && Number(dataGame.fight._hp) <= 0) {
										boss.status = 1;
										// setBotLog(`Убили босса {point: ${boss.point}, status: ${boss.status}}`);
										this._isMounted && setBotLog({...dataGame.fight, type: boss.type}, 'boss');
										return true;
									} else {
										// setBotLog(`Ошибка при убийстве босса {point: ${boss.point}, status: ${boss.status}}`);
										this._isMounted && setBotLog(`Ошибка при убийстве босса`, 'text', 'red');
										this._isMounted && this.BotRaids('pause');
										return false;
									}
								} else {
									// setBotLog(`Невозможно убить босса, вы умрёте {point: ${boss.point}, status: ${boss.status}}`);
									this._isMounted && setBotLog(`Невозможно убить босса, вы умрёте`, 'text', 'red');
									this._isMounted && this.BotRaids('pause');
									await wait(3000);
									dataGame = this._isMounted && await getGame(this.props.state.server, {
										i: 11,
										t: boss.id,
										t2: 3,
										t3: 0,
										t4: 0,
										t5: 0,
									}, getGameAuth);
									return false;
								}
							} else {
								// setBotLog(`Невозможно создать босса {point: ${boss.point}, status: ${boss.status}}`);
								this._isMounted && setBotLog(`Невозможно создать босса`, 'text', 'red');
								this._isMounted && this.BotRaids('pause');
								return false;
							}
						} else {
							this._isMounted && setBotLog(`Не хватает энергии на убийство босса`, 'text', 'red');
							this._isMounted && this.BotRaids('pause');
							return false;
						}
					} else {
						this._isMounted && setBotLog(`Ошибочные данные персонажа`, 'text', 'red');
						this._isMounted && this.BotRaids('pause');
					}
				} else if (boss && boss.status == 1) {
					// setBotLog(`Босс уже убит {point: ${boss.point}, status: ${boss.status}}`);
					return true;
				} else if (boss) {
					// setBotLog(`Невозможно убить босса {point: ${boss.point}, status: ${boss.status}}`);
					this._isMounted && this.BotRaids('pause');
					return false;
				} else {
					return true;
					// setBotLog(`Босс не найден {point: ${to}}`);
				}
			}
			if (mode == 'chest' && (botRaidsSettings.chestsTier1 || botRaidsSettings.chestsTier2 || botRaidsSettings.chestsTier3 || botRaidsSettings.chestsTier4 || botRaidsSettings.chestsTier5)) {
				// console.log('Проверяем сундук...');
				let chests = data.chests.find(item => item.point === data.point);
				let isChest = chests ? (chests.type == 1 && botRaidsSettings.chestsTier1) || (chests.type == 2 && botRaidsSettings.chestsTier2) || (chests.type == 3 && botRaidsSettings.chestsTier3) || (chests.type == 4 && botRaidsSettings.chestsTier4) || (chests.type == 5 && botRaidsSettings.chestsTier5) : false;
				// console.log('isChest', isChest);
				if (chests && chests.status == 1 && isChest) {
					let player = this._isMounted && await BotAPI('getStats', auth_key, api_uid, sslt);
					if (player) {
						if (Number(player._en >= chests.en)) {
							let dataGame = this._isMounted && await getGame(this.props.state.server, {
								i: 79,
								t1: 1,
							}, getGameAuth);
							// console.log(dataGame);
							chests.status = 0;
							// setBotLog(`Открыли сундук {point: ${chests.point}, status: ${chests.status}, type: ${chests.type}}`);
							dataGame.type = chests.type;
							this._isMounted && setBotLog(dataGame, 'chest');
						} else {
							this._isMounted && setBotLog(`Не хватает энергии на открытие сундука`, 'text', 'red');
							this._isMounted && this.BotRaids('pause');
						}
					} else {
						this._isMounted && setBotLog(`Ошибочные данные персонажа`, 'text', 'red');
						this._isMounted && this.BotRaids('pause');
					}
				} else if (chests && (chests.status == 0 || chests.status == 2) && isChest) {
					// setBotLog(`Сундук уже открыт {point: ${chests.point}, status: ${chests.status}, type: ${chests.type}}`);
				} else if (chests && isChest) {
					// setBotLog(`Невозможно открыть сундук {point: ${chests.point}, status: ${chests.status}, type: ${chests.type}}`);
					this._isMounted && setBotLog(`Невозможно открыть сундук`, 'text', 'red');
					this._isMounted && this.BotRaids('pause');
				} else if (isChest) {
					// setBotLog(`Сундук не найден {point: ${data.point}}`);
				}
			}
		};
		let dataGame = this._isMounted && await getGame(this.props.state.server, {}, getGameAuth);
		// console.log(dataGame);
		if (!dataGame?.u) {
			// this.setState({ popout: null });
			openSnackbar({text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error'});
			this._isMounted && BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Пароль авторизации игры неисправен, введите новый', error: typeof dataGame == 'string' ? dataGame : dataGame?.err_msg ? dataGame?.err_msg : JSON.stringify(dataGame)});
			this._isMounted && setActivePanel('profile');
			return;
		}
		getGameAuth.id = dataGame?.u?._id || api_uid;
		data.player = dataGame.u;
		if (dataGame.rstat && dataGame.rstat.s) {
			data.rstats = [];
			let rs = dataGame.rstat.s;
			typeof rs.length == 'undefined' ? rs = [rs] : '';
			for (let x = 1; x <= 3; x++) {
				for (let y = 0; y < 4; y++) {
					let item = rs.find(item => Number(item._id) === x && Number(item._m) === y);
					data.rstats.push({
						title: `${item ? Number(item._c) : 0} ${numberForm(item ? Number(item._c) : 0, ['раз', 'раза', 'раз'])}`,
						description: botRaidsSettings.selectMode[y].title,
						icon: botRaidsSettings.selectRaid[x-1].icon
					});
				}
			}
		}
		// console.log(data.rstats);
		// console.log(data.player);
		data.limit = Number(dataGame.raids_cnt._v);
		dataGame = dataGame.uraid;
		// console.log(dataGame);
		// console.log(data);
		if (mode == 'start') {
			syncBot.raids = data;
			if (dataGame == undefined && data.limit < 3) {
				dataGame = this._isMounted && await getGame(this.props.state.server, {
					i: 76,
					t: botRaidsSettings.selectedRaid,
					t1: botRaidsSettings.selectedMode,
				}, getGameAuth);
				// console.log(dataGame);
				if (dataGame !== undefined && dataGame.uraid !== undefined) {
					// this.setState({ popout: null });
					syncBot.isStart = true;
					this._isMounted && updateInfo(dataGame.uraid);
					this._isMounted && this.BotRaids('energy');
					this._isMounted && setBotLog(`Бот запущен`, 'text', 'green');
					// console.warn(botRaidsSettings);
					this._isMounted && await updatePath('navigation', botRaidsSettings.selectedRaid, 1, null);
				} else {
					// this.setState({ popout: null });
					syncBot.isStart = false;
					this._isMounted && setBotLog(`Невозможно начать рейд, ошибка при создании`, 'text', 'red');
				}
			} else if (dataGame !== undefined) {
				// this.setState({ popout: null });
				syncBot.isStart = true;
				this._isMounted && updateInfo(dataGame);
				this._isMounted && this.BotRaids('energy');
				this._isMounted && setBotLog(`Бот запущен`, 'text', 'green');
				this._isMounted && await updatePath('navigation', data.id, data.point, null);
			} else {
				// this.setState({ popout: null });
				syncBot.isStart = false;
				this._isMounted && setBotLog(`Невозможно начать рейд, лимит попыток`, 'text', 'red');
			}
		}
		if (mode == 'create') {
			// console.log(botRaidsSettings.selectedRaid, botRaidsSettings.selectedMode);
			syncBot.raids = data;
			if (dataGame == undefined && data.limit < 3) {
				dataGame = this._isMounted && await getGame(this.props.state.server, {
					i: 76,
					t: botRaidsSettings.selectedRaid,
					t1: botRaidsSettings.selectedMode,
				}, getGameAuth);
				// console.log(dataGame);
				if (dataGame !== undefined && dataGame.uraid !== undefined) {
					// this.setState({ popout: null });
					let settings = this._isMounted && await this.props.options.Storage({key: 'raidSettings', defaultValue: JSON.stringify(botRaidsSettings)});
					if (settings) {
						settings = JSON.parse(settings.value);
						if (settings) {
							botRaidsSettings.barrels = settings.barrels;
							botRaidsSettings.chestsTier1 = settings.chestsTier1;
							botRaidsSettings.chestsTier2 = settings.chestsTier2;
							botRaidsSettings.chestsTier3 = settings.chestsTier3;
							botRaidsSettings.chestsTier4 = settings.chestsTier4;
							botRaidsSettings.chestsTier5 = settings.chestsTier5;
						}
					}
					this._isMounted && updateInfo(dataGame.uraid);
					this._isMounted && this.BotRaids('energy');
				} else {
					// this.setState({ popout: null });
					syncBot.isStart = false;
					openSnackbar({text: 'Невозможно начать рейд, ошибка при создании', icon: 'error'})
				}
			} else if (dataGame !== undefined) {
				// рейд активен
				this._isMounted && this.BotRaids('energy');
			} else {
				// this.setState({ popout: null });
				syncBot.isStart = false;
				openSnackbar({text: 'Невозможно начать рейд, лимит попыток', icon: 'error'})
			}
			this._isMounted && this.setState({ isLoad: false });
		}
		if (mode == 'exit') {
			syncBot.raids = data;
			if (dataGame !== undefined) {
				this._isMounted && updateInfo(dataGame);
				this._isMounted && this.BotRaids('energy');
				let player = this._isMounted && await BotAPI('getStats', auth_key, api_uid, sslt);
				if (player) {
					if (Number(player._en >= 5)) {
						dataGame = this._isMounted && await getGame(this.props.state.server, {
							i: 80,
						}, getGameAuth);
						if (Number(dataGame.res._v) == 1) {
							this._isMounted && setBotLog(`Рейд завершён`, 'text', 'green');
							this._isMounted && await this.BotRaids('reload');
							this._isMounted && this.setBotLog('clear');
							this.state.botRaidsSettings = {
								barrels: true,
								chestsTier1: true,
								chestsTier2: true,
								chestsTier3: true,
								chestsTier4: true,
								chestsTier5: true,
								useScrollLightning: false,
								useScrollFire: false,
								selectedRaid: null,
								selectRaid: [{
									id: 1,
									title: 'Подземелье форта',
									icon: 'bot/raids/6.png'
								}, {
									id: 2,
									title: 'Подвал часовни',
									icon: 'bot/raids/25.png'
								}, {
									id: 3,
									title: 'Паучий лес',
									icon: 'bot/raids/28.png'
								}],
								selectedMode: null,
								selectMode: [{
									id: 0,
									title: 'Лёгкий режим',
									icon: 'bot/raids/30.png'
								}, {
									id: 1,
									title: 'Обычный режим',
									icon: 'bot/raids/31.png'
								}, {
									id: 2,
									title: 'Героический режим',
									icon: 'bot/raids/32.png'
								}, {
									id: 3,
									title: 'Легендарный режим',
									icon: 'bot/raids/33.png'
								}]
							};
						} else {
							this._isMounted && setBotLog(`Невозможно завершить рейд`, 'text', 'red');
						}
					} else {
						this._isMounted && setBotLog(`Не хватает энергии на завершение рейда`, 'text', 'red');
					}
				} else {
					this._isMounted && setBotLog(`Ошибочные данные персонажа`, 'text', 'red');
					this._isMounted && this.BotRaids('pause');
				}
			} else {
				this._isMounted && setBotLog(`Нет активного рейда`, 'text', 'red');
			}
			this._isMounted && this.setState({ isExit: false });
		}
		if (mode == 'load' || mode == 'reload') {
			if (dataGame !== undefined) {
				this._isMounted && updateInfo(dataGame);
				botRaidsSettings.selectedRaid = data.id;
				botRaidsSettings.selectedMode = data.mode;
			}
			syncBot.raids = data;
			if (mode == 'load') {
				// this.setState({ activeStory: 'profile' });
				// this.setState({ activePanel: '6' });
				let settings = this._isMounted && await this.props.options.Storage({key: 'raidSettings', defaultValue: JSON.stringify(botRaidsSettings)});
				if (settings) {
					settings = JSON.parse(settings.value);
					if (settings) {
						botRaidsSettings.barrels = settings.barrels;
						botRaidsSettings.chestsTier1 = settings.chestsTier1;
						botRaidsSettings.chestsTier2 = settings.chestsTier2;
						botRaidsSettings.chestsTier3 = settings.chestsTier3;
						botRaidsSettings.chestsTier4 = settings.chestsTier4;
						botRaidsSettings.chestsTier5 = settings.chestsTier5;
					}
				}
				this._isMounted && this.setState({ isLoad: false });
			}
			if (mode == 'reload') {
				this._isMounted && setBotLog(`Данные обновлены`, 'text');
				this._isMounted && this.setState({ isLoad: false });
			}
			this._isMounted && this.BotRaids('energy');
		}
		// mode !== 'start'&&this.setState({ popout: null });
	};
	updateSelect = (el) => {
		if (el.target.name) {
			const parent = el.target.parentNode.parentNode.parentNode.parentNode;
			this._isMounted && parent.classList.add('isSelected');
			this._isMounted && this.setState({ botRaidsSettings: {...this.state.botRaidsSettings, [el.target.name]: Number(el.target.value)} });
		}
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		this._isMounted = true;
		syncBot.raids = null;
		reward = false;
		await this.BotRaids('load');
	};
	async componentDidUpdate() {
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
	};
	async componentWillUnmount () {
		this._isMounted = false;
		syncBot.isStart = false;
		syncBot.raids = null;
		reward = false;
	};
	async shouldComponentUpdate(nextProps, nextState) {
		reward = false;
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent } = this.props;
		const { botRaidsSettings } = this.state;
		const { BotRaids } = this;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Рейды';
		const description = 'Мой профиль';
		const avatar = 'labels/4.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
					{syncBot.raids?syncBot.raids.point?<React.Fragment>
						<div className="Scroll" style={{maxHeight: state.isDesktop ? '299px' : 'unset'}}>
							{!this.state.isLoad?<CardGrid size={state.isDesktop ? "s" : "m"}>
								{/* <Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={state.user.vk.photo_200 ? state.user.vk.photo_200 : null} />}
										description={`${state.user.vk.first_name} ${state.user.vk.last_name}`}
									>
										{syncBot.raids.player._name !== '' ? syncBot.raids.player._name : syncBot.raids.player._vkId}
									</SimpleCell>
								</Card> */}
								{/* <Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/9.png`} />}
										description={`${syncBot.raids.limit} из 3`}
									>
										Попытки
									</SimpleCell>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/34.png`} />}
										description={`${options.numberSpaces(syncBot.raids.player._dmgi)}`}
									>
										Атака
									</SimpleCell>
								</Card> */}
								<Card className='DescriptionCardWiki' onClick={() => this.setState({ isDevLog: !this.state.isDevLog }, this.props.options.openSnackbar({text: `Режим разработчика ${this.state.isDevLog?'выключен':'включен'}`, icon: 'done'}))}>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/8.png`} />}
										description={`${botRaidsSettings.selectMode[syncBot.raids.mode].title}`}
									>
										{botRaidsSettings.selectRaid[syncBot.raids.id-1].title}
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/9.png`} />}
										description={`${syncBot.raids.limit} из 3`}
									>
										Попытки
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/7.png`} />}
										description={`${options.numberSpaces(syncBot.raids.hp)}`}
									>
										Здоровье
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/19.png`} />}
										description={`${options.numberSpaces(syncBot.raids.player._en)} из ${syncBot.raids.energy}`}
									>
										Энергия
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/17.png`} />}
										description={`${options.numberSpaces(syncBot.raids.player._item1)} ${options.numberForm(syncBot.raids.player._item1, ['свиток', 'свитка', 'свитков'])}`}
									>
										Свитки молнии
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/16.png`} />}
										description={`${options.numberSpaces(syncBot.raids.player._item3)} ${options.numberForm(syncBot.raids.player._item3, ['свиток', 'свитка', 'свитков'])}`}
									>
										Свитки огня
									</SimpleCell>
								</Card>
								{/* <Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/35.png`} />}
										description={`${syncBot.raids.point} точка`}
									>
										Позиция
									</SimpleCell>
								</Card> */}
							</CardGrid>:<CardGrid size={state.isDesktop ? "s" : "m"}>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
							</CardGrid>}
							<Spacing separator size={16} />
							<CardGrid size="m">
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											barrels: !botRaidsSettings.barrels
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.barrels}>Собирать бочки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											chestsTier1: !botRaidsSettings.chestsTier1
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.chestsTier1}>Собирать старые сундуки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											chestsTier2: !botRaidsSettings.chestsTier2
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.chestsTier2}>Собирать железные сундуки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											chestsTier3: !botRaidsSettings.chestsTier3
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.chestsTier3}>Собирать сапфировые сундуки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											chestsTier4: !botRaidsSettings.chestsTier4
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.chestsTier4}>Собирать древние сундуки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											chestsTier5: !botRaidsSettings.chestsTier5
										}
									}), () => this._isMounted && BotRaids('energy', true))} checked={botRaidsSettings.chestsTier5}>Собирать эпические сундуки</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart || botRaidsSettings.useScrollFire} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											useScrollLightning: !botRaidsSettings.useScrollLightning
										}
									}))} checked={botRaidsSettings.useScrollLightning}>Использовать свитки молнии</Checkbox>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Checkbox disabled={syncBot.isStart || botRaidsSettings.useScrollLightning} onChange={() => this.setState(prevState => ({
										botRaidsSettings: {
											...prevState.botRaidsSettings,
											useScrollFire: !botRaidsSettings.useScrollFire
										}
									}))} checked={botRaidsSettings.useScrollFire}>Использовать свитки огня</Checkbox>
								</Card>
							</CardGrid>
							{/* {!state.isDesktop && <React.Fragment>
								<div style={{
									display: 'flex',
									marginRight: state.isDesktop ? 0 : 8,
									marginLeft: state.isDesktop ? 0 : 8
								}}>
									<Button size="m" onClick={() => BotRaids('start')} disabled={syncBot.isStart} stretched mode="commerce" style={{ marginRight: 8 }}>Запустить</Button>
									<Button size="m" onClick={() => BotRaids('pause')} disabled={!syncBot.isStart} stretched mode="destructive">Остановить</Button>
								</div>
								<Spacing size={8} />
								<div style={{
									display: 'flex',
									marginRight: state.isDesktop ? 0 : 8,
									marginLeft: state.isDesktop ? 0 : 8
								}}>
									<Button size="m" onClick={() => BotRaids('exit')} disabled={!syncBot.isStart && syncBot.raids.point ? false : true} stretched mode="secondary" style={{ marginRight: 8 }}>Завершить</Button>
									<Button size="m" onClick={() => BotRaids('reload')} disabled={syncBot.isStart} stretched mode="secondary">Обновить</Button>
								</div>
							</React.Fragment>} */}
							<Spacing separator size={16} />
							{!this.state.isLoad?<React.Fragment>{syncBot.raids.id == 1 && <CardGrid size={state.isDesktop ? "s" : "m"}>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/6.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 1).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 1).length}`}
									>
										Страж Подземелья
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/1.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 2).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 2).length}`}
									>
										Слепая Тварь
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/5.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 3).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 3).length}`}
									>
										Инсектоид
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/2.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 4).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 4).length}`}
									>
										Скорпион Падальщик
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/3.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 5).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 5).length}`}
									>
										Кровавый Скорпион
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/4.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 6).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 6).length}`}
									>
										Ледяной Скорпион
									</SimpleCell>
								</Card>
							</CardGrid>}
							{syncBot.raids.id == 2 && <CardGrid size={state.isDesktop ? "s" : "m"}>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/25.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 1).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 1).length}`}
									>
										Жнец Душ
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/24.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 2).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 2).length}`}
									>
										Последователь Культа
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/23.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 3).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 3).length}`}
									>
										Адепт Культа
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/2.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 4).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 4).length}`}
									>
										Скорпион Падальщик
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/3.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 5).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 5).length}`}
									>
										Кровавый Скорпион
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/4.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 6).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 6).length}`}
									>
										Ледяной Скорпион
									</SimpleCell>
								</Card>
							</CardGrid>}
							{syncBot.raids.id == 3 && <CardGrid size={state.isDesktop ? "s" : "m"}>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/28.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 1).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 1).length}`}
									>
										Магический паук
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/26.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 2).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 2).length}`}
									>
										Земляной паук
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/27.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 3).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 3).length}`}
									>
										Ледяной паук
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/29.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 4).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 4).length}`}
									>
										Ядовитый паук
									</SimpleCell>
								</Card>
								<Card className='DescriptionCardWiki'>
									<SimpleCell
										before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/37.png`} />}
										description={`Убито ${syncBot.raids.bosses.filter(item => item.type == 5).filter(item => item.status == 1).length} из ${syncBot.raids.bosses.filter(item => item.type == 5).length}`}
									>
										Солдат Паук
									</SimpleCell>
								</Card>
							</CardGrid>}</React.Fragment>:<React.Fragment>
								<CardGrid size={state.isDesktop ? "s" : "m"}>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
								</CardGrid>
								<Spacing separator size={16} />
								<CardGrid size={state.isDesktop ? "s" : "m"}>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
								</CardGrid>
								<Spacing separator size={16} />
								<CardGrid size={state.isDesktop ? "s" : "m"}>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
									<Card className='DescriptionCardWiki withSkeleton'>
										<Skeleton height={32} width={32}/>
										<Skeleton height={state.isDesktop?38:38} width={108} />
									</Card>
								</CardGrid>
							</React.Fragment>}
							{!this.state.isLoad&&<React.Fragment>
								<Spacing separator size={16} />
								<CardGrid size={state.isDesktop ? "s" : "m"}>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/108.png`} />}
											description={`Открыто ${syncBot.raids.barrels.filter(item => item.status == 0).length} из ${syncBot.raids.barrels.length}`}
										>
											Бочки подземелья
										</SimpleCell>
									</Card>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/92.png`} />}
											description={`Открыто ${syncBot.raids.chests.filter(item => item.type == 1).filter(item => item.status == 0).length + syncBot.raids.chests.filter(item => item.type == 1).filter(item => item.status == 2).length} из ${syncBot.raids.chests.filter(item => item.type == 1).length}`}
										>
											Старые сундуки
										</SimpleCell>
									</Card>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/94.png`} />}
											description={`Открыто ${syncBot.raids.chests.filter(item => item.type == 2).filter(item => item.status == 0).length + syncBot.raids.chests.filter(item => item.type == 2).filter(item => item.status == 2).length} из ${syncBot.raids.chests.filter(item => item.type == 2).length}`}
										>
											Железные сундуки
										</SimpleCell>
									</Card>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/96.png`} />}
											description={`Открыто ${syncBot.raids.chests.filter(item => item.type == 3).filter(item => item.status == 0).length + syncBot.raids.chests.filter(item => item.type == 3).filter(item => item.status == 2).length} из ${syncBot.raids.chests.filter(item => item.type == 3).length}`}
										>
											Сапфировые сундуки
										</SimpleCell>
									</Card>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/98.png`} />}
											description={`Открыто ${syncBot.raids.chests.filter(item => item.type == 4).filter(item => item.status == 0).length + syncBot.raids.chests.filter(item => item.type == 4).filter(item => item.status == 2).length} из ${syncBot.raids.chests.filter(item => item.type == 4).length}`}
										>
											Древние сундуки
										</SimpleCell>
									</Card>
									<Card className='DescriptionCardWiki'>
										<SimpleCell
											before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/100.png`} />}
											description={`Открыто ${syncBot.raids.chests.filter(item => item.type == 5).filter(item => item.status == 0).length + syncBot.raids.chests.filter(item => item.type == 5).filter(item => item.status == 2).length} из ${syncBot.raids.chests.filter(item => item.type == 5).length}`}
										>
											Эпические сундуки
										</SimpleCell>
									</Card>
								</CardGrid>
								{syncBot.raids.reward && <React.Fragment>
									<Spacing separator size={16} />
									<CardGrid size={state.isDesktop ? "s" : "m"}>
										{syncBot.raids.reward.i && syncBot.raids.reward.i.map((data, x) => {
											reward = true;
											try {
												if (Number(data._type) == 6) {
													let item = Items.find(x => x.fragments.includes(Number(data._id)));
													return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app" src={`${pathImages}collections/${Number(data._id)}.png`} />} description="Коллекция">{item.title}</SimpleCell></Card>);
												} else if (Number(data._type) == 8) {
													let item = Items.find(x => x.id === Number(data._id));
													return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app" src={`${pathImages}${item.icon}`} />} description="Заточка">{item.title}</SimpleCell></Card>);
												} else if (Number(data._type) == 11) {
													let item = Stones.find(x => x.id === Number(data._id));
													return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app" src={`${pathImages}stones/${Number(data._id)}.png`} />} description="Камень">{item.title}</SimpleCell></Card>);
												} else if (Number(data._type) == 1) {
													return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app" src={`${pathImages}rooms/${Number(data._id)}.png`} />} description="Окружение">Новый фон</SimpleCell></Card>);
												} else {
													let item = Items.find(x => x.id === Number(data._id));
													return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app" src={`${pathImages}${item.icon}`} />} description="Предмет">{item.title}</SimpleCell></Card>);
												}
											} catch (error) {
												console.warn(data);
												return (<Card key={x} className='DescriptionCardWiki'><SimpleCell before={<Avatar className="Item" size={32} mode="app"><Icon20ErrorCircleOutline /></Avatar>} description="Предмет не найден">Ошибка</SimpleCell></Card>)
											}
										})}
										{Number(syncBot.raids.reward._exp) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/10.png`} />}
												description={`${options.numberSpaces(syncBot.raids.reward._exp)} ед.`}
											>
												Опыт
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._m1) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/12.png`} />}
												description={`${options.numberSpaces(syncBot.raids.reward._m1)} ед.`}
											>
												Серебро
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._m3) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/11.png`} />}
												description={`${options.numberSpaces(syncBot.raids.reward._m3)} ед.`}
											>
												Золото
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._m6) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/21.png`} />}
												description={`${syncBot.raids.reward._m6} ед.`}
											>
												Турмалины
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._pf1) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/20.png`} />}
												description={`${syncBot.raids.reward._pf1} ед.`}
											>
												Еда
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._i2) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/18.png`} />}
												description={`${syncBot.raids.reward._i2} ед.`}
											>
												Целебные зелья
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._i1) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/17.png`} />}
												description={`${syncBot.raids.reward._i1} ед.`}
											>
												Свитки молнии
											</SimpleCell>
										</Card>}
										{Number(syncBot.raids.reward._i3) !== 0 && <Card className='DescriptionCardWiki'>
											{reward = true}
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}bot/raids/16.png`} />}
												description={`${syncBot.raids.reward._i3} ед.`}
											>
												Свитки огня
											</SimpleCell>
										</Card>}
									</CardGrid>
									{!reward&&<Footer style={{margin: '12px 0'}}>Нет наград</Footer>}
								</React.Fragment>}
							</React.Fragment>}
						</div>
						{/* {syncBot.raids.rstats && <React.Fragment>
							<Spacing separator size={16} />
							<details className='DetailsWiki'>
								<summary>
									<SimpleCell after={<Icon24Chevron style={{color: 'var(--icon_secondary)'}}/>} description='Количество пройденных рейдов'>Достижения</SimpleCell>
								</summary>
								<Spacing size={8} />
								<CardGrid size={state.isDesktop ? "" : "m"} className={state.isDesktop ? "CardGrid--xs" : ""}>
									{syncBot.raids.rstats.map((data, x) =>
										<Card key={x} className='DescriptionCardWiki'>
											<SimpleCell
												before={<Avatar size={32} mode="app" src={`${pathImages}${data.icon}`}></Avatar>}
												description={data.description}
											>
												{data.title}
											</SimpleCell>
										</Card>
									)}
								</CardGrid>
							</details>
						</React.Fragment>} */}
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={8} />
							<div className="BotLog Scroll" style={{marginLeft: 8, marginRight: state.isDesktop?0:8}}>{!Array.isArray(this.state.botLog)?this.state.botLog:this.state.botLog.map((item, x) => {
								if (item.type == 'text') return (<span key={x} className={item.color}>{item.message}</span>)
								if (item.type == 'barrel' || item.type == 'chest' || item.type == 'boss') return (<div key={x} className="Log__message">
									<Avatar size={36} mode="app" src={`${pathImages}${item.type == 'boss'?bosses[syncBot.raids.id-1]?.[item.message.avatar-1]?.[1]:item.type == 'barrel'?item.message.avatar:chests[item.message.avatar-1][1]}`} />
									<div className="Log__message--main">
										<div className="Log__message--title">
											<span>{item.type == 'boss'?bosses[syncBot.raids.id-1]?.[item.message.avatar-1]?.[0]:item.type == 'barrel'?item.message.title:chests[item.message.avatar-1][0]}</span>
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
								</div>)
							})}</div>
							<Spacing separator size={16} style={{padding: 0, marginRight: state.isDesktop&&'-7px', marginLeft: state.isDesktop&&'-7px'}}/>
							<div style={{
								display: 'flex',
								marginRight: state.isDesktop ? 0 : 8,
								marginLeft: state.isDesktop ? 0 : 8
							}}>
								<Button size="m" mode="tertiary" onClick={() => this._isMounted && this.setBotLog('clear')} stretched>Отчистить лог действий</Button>
							</div>
							<Spacing size={8} />
							{state.isDesktop?<div style={{
								display: 'flex',
								marginRight: 0,
								marginLeft: 0
							}}>
								<Button size="m" onClick={() => this._isMounted && BotRaids('start')} disabled={syncBot.isStart||this.state.isLoad} loading={syncBot.isStart} stretched mode="commerce" style={{ marginRight: 8 }}>Запустить</Button>
								<Button size="m" onClick={() => this._isMounted && this.setState({ isPause: true }, () => BotRaids('pause'))} disabled={!syncBot.isStart||this.state.isLoad} loading={this.state.isPause} stretched mode="destructive" style={{ marginRight: 8 }}>Остановить</Button>
								<Button size="m" onClick={() => this._isMounted && this.setState({ isExit: true }, () => BotRaids('exit'))} disabled={(!syncBot.isStart && syncBot.raids.point ? false : true)||this.state.isLoad} loading={this.state.isExit} stretched mode="secondary" style={{ marginRight: 8 }}>Завершить</Button>
								<Button size="m" onClick={() => this._isMounted && this.setState({ isLoad: true }, () => BotRaids('reload'))} disabled={syncBot.isStart||this.state.isLoad} loading={this.state.isLoad} stretched mode="secondary">Обновить</Button>
							</div>:<React.Fragment>
								<div style={{
									display: 'flex',
									marginRight: 8,
									marginLeft: 8
								}}>
									<Button size="m" onClick={() => this._isMounted && BotRaids('start')} disabled={syncBot.isStart||this.state.isLoad} loading={syncBot.isStart} stretched mode="commerce" style={{ marginRight: 8 }}>Запустить</Button>
									<Button size="m" onClick={() => this._isMounted && this.setState({ isPause: true }, () => BotRaids('pause'))} disabled={!syncBot.isStart||this.state.isLoad} loading={this.state.isPause} stretched mode="destructive">Остановить</Button>
								</div>
								<Spacing size={8} />
								<div style={{
									display: 'flex',
									marginRight: 8,
									marginLeft: 8
								}}>
									<Button size="m" onClick={() => this._isMounted && this.setState({ isExit: true }, () => BotRaids('exit'))} disabled={(!syncBot.isStart && syncBot.raids.point ? false : true)||this.state.isLoad} loading={this.state.isExit} stretched mode="secondary" style={{ marginRight: 8 }}>Завершить</Button>
									<Button size="m" onClick={() => this._isMounted && this.setState({ isLoad: true }, () => BotRaids('reload'))} disabled={syncBot.isStart||this.state.isLoad} loading={this.state.isLoad} stretched mode="secondary">Обновить</Button>
								</div>
							</React.Fragment>}
						</div>
					</React.Fragment>:<React.Fragment>
						<div className="Scroll" style={{height: state.isDesktop ? '440px' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: state.isDesktop ? 'visible' : 'visible'}}>
							<CardGrid size="s" className="CustomRadioForm" onChange={(e) => this._isMounted && this.updateSelect(e)}>
								<Card>
									<Radio name="selectedRaid" value="1">
										<div className="CustomRadioForm__cell">
											{/* <Avatar mode="app" size={96} src={`${pathImages}bot/raids/109.png`} /> */}
											<SVG_turmalin className="CustomRadioForm__cell--shadow" style={{height: 75, width: 100}}/>
											<SVG_turmalin className="CustomRadioForm__cell--image" style={{height: 75, width: 100, zIndex: 1}}/>
											<Title level="2" weight="2" style={{zIndex: 1}}>{botRaidsSettings.selectRaid[0].title}</Title>
											<Text style={{ marginTop: 8, color: 'var(--text_secondary)', zIndex: 1 }}>турмалины</Text>
										</div>
									</Radio>
								</Card>
								<Card>
									<Radio name="selectedRaid" value="2" >
										<div className="CustomRadioForm__cell">
											{/* <Avatar mode="app" size={96} src={`${pathImages}bot/raids/110.png`} /> */}
											<SVG_stone className="CustomRadioForm__cell--shadow" style={{height: 75, width: 100}}/>
											<SVG_stone className="CustomRadioForm__cell--image" style={{height: 75, width: 100, zIndex: 1}}/>
											<Title level="2" weight="2" style={{zIndex: 1}}>{botRaidsSettings.selectRaid[1].title}</Title>
											<Text style={{ marginTop: 8, color: 'var(--text_secondary)', zIndex: 1 }}>камни</Text>
										</div>
									</Radio>
								</Card>
								<Card>
									<Radio name="selectedRaid" value="3">
										<div className="CustomRadioForm__cell">
											<SVG_web className="CustomRadioForm__cell--shadow" style={{height: 75, width: 100}}/>
											<SVG_web className="CustomRadioForm__cell--image" style={{height: 75, width: 100, zIndex: 1}}/>
											<Title level="2" weight="2">{botRaidsSettings.selectRaid[2].title}</Title>
											<Text style={{ marginTop: 8, color: 'var(--text_secondary)' }}>питомец</Text>
										</div>
									</Radio>
								</Card>
							</CardGrid>
							<Spacing size={8} />
							<CardGrid size={state.isDesktop?'s':'m'} className={`CustomRadioForm ${state.isDesktop&&'size-x4'}`} onChange={(e) => this._isMounted && this.updateSelect(e)}>
								<Card>
									<Radio name="selectedMode" value="0">
										<div className="CustomRadioForm__cell">
											<svg className="CustomRadioForm__cell--shadow" width="100" height="50" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="75" cy="75" r="75" fill="#7BC838"/></svg>
											<SVG_numberI className="CustomRadioForm__cell--image" style={{height: 50, width: 100, zIndex: 1}}/>
											<Spacing size={8} />
											<Title level="3" weight="2">{botRaidsSettings.selectMode[0].title}</Title>
										</div>
									</Radio>
								</Card>
								<Card>
									<Radio name="selectedMode" value="1">
										<div className="CustomRadioForm__cell">
											<svg className="CustomRadioForm__cell--shadow" width="100" height="50" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="75" cy="75" r="75" fill="#557CFD"/></svg>
											<SVG_numberII className="CustomRadioForm__cell--image" style={{height: 50, width: 100, zIndex: 1}}/>
											<Spacing size={8} />
											<Title level="3" weight="2">{botRaidsSettings.selectMode[1].title}</Title>
										</div>
									</Radio>
								</Card>
								<Card>
									<Radio name="selectedMode" value="2">
										<div className="CustomRadioForm__cell">
											<svg className="CustomRadioForm__cell--shadow" width="100" height="50" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="75" cy="75" r="75" fill="#B14296"/></svg>
											<SVG_numberIII className="CustomRadioForm__cell--image" style={{height: 50, width: 100, zIndex: 1}}/>
											<Spacing size={8} />
											<Title level="3" weight="2">{botRaidsSettings.selectMode[2].title}</Title>
										</div>
									</Radio>
								</Card>
								<Card>
									<Radio name="selectedMode" value="3">
										<div className="CustomRadioForm__cell">
											<svg className="CustomRadioForm__cell--shadow" width="100" height="50" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="75" cy="75" r="75" fill="#FFAC0F"/></svg>
											<SVG_numberIV className="CustomRadioForm__cell--image" style={{height: 50, width: 100, zIndex: 1}}/>
											<Spacing size={8} />
											<Title level="3" weight="2">{botRaidsSettings.selectMode[3].title}</Title>
										</div>
									</Radio>
								</Card>
							</CardGrid>
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={30} />
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
								<div style={{fontSize: '16px', lineHeight: '20px', fontWeight: 600}}>{botRaidsSettings.selectedRaid==null?<span style={{color: 'var(--text_secondary)', fontWeight: 400}}>рейд</span>:botRaidsSettings.selectRaid[botRaidsSettings.selectedRaid-1].title} – {botRaidsSettings.selectedMode==null?<span style={{color: 'var(--text_secondary)', fontWeight: 400}}>режим</span>:botRaidsSettings.selectMode[botRaidsSettings.selectedMode].title}</div>
								<Spacing size={12} />
								<Button onClick={() => this._isMounted && this.setState({ isLoad: true }, () => BotRaids('create'))} disabled={botRaidsSettings.selectedRaid==null||botRaidsSettings.selectedMode==null||syncBot.raids.limit==3||this.state.isLoad} loading={this.state.isLoad} style={{padding: '2px 16px'}}>Начать рейд</Button>
								<Spacing size={8} />
								<Button mode="tertiary" style={{padding: '2px 16px'}}><span style={{fontWeight: 400}}>{syncBot.raids.limit}/3</span></Button>
							</div>
							<Spacing size={30-8} />
						</div>
					</React.Fragment>:<React.Fragment>
					<div className="Scroll" style={{height: state.isDesktop ? '299px' : 'unset', overflow: 'hidden'}}>
							<CardGrid size={state.isDesktop ? "s" : "m"}>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
								<Card className='DescriptionCardWiki withSkeleton'>
									<Skeleton height={32} width={32}/>
									<Skeleton height={state.isDesktop?38:38} width={108} />
								</Card>
							</CardGrid>
							<Spacing separator size={16} />
							<CardGrid size="m">
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
								<Card className='DescriptionCardWiki Clear'>
									<Skeleton height={36}/>
								</Card>
							</CardGrid>
							<Spacing separator size={16} />
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
								<Skeleton height={32} width="100%" marginRight={8}/>
								<Skeleton height={32} width="100%" marginRight={8}/>
								<Skeleton height={32} width="100%"/>
							</div>:<React.Fragment>
								<div style={{
									display: 'flex',
									marginRight: 8,
									marginLeft: 8
								}}>
									<Skeleton height={36} width="100%" marginRight={8}/>
									<Skeleton height={36} width="100%"/>
								</div>
								<Spacing size={8} />
								<div style={{
									display: 'flex',
									marginRight: 8,
									marginLeft: 8
								}}>
									<Skeleton height={36} width="100%" marginRight={8}/>
									<Skeleton height={36} width="100%"/>
								</div>
							</React.Fragment>}
						</div>
					</React.Fragment>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;