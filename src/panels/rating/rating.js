import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	Header,
	Link,
	Footer,
	Avatar,
	PanelHeader,
	PanelHeaderBack,
	Input,
	Tabs,
	TabsItem,
	InitialsAvatar,
	View,
	Div,
	Text,
	Button,
} from '@vkontakte/vkui';

import { ReactComponent as SVG_sadFace } from '../../modals/sadFace.svg';
import Skeleton from '../../components/skeleton';
import TableCell from '../../components/tableCell';
import { Icon12ChevronOutline } from '@vkontakte/icons';
import PANEL_rating__1 from '../../panels/rating/1';

let ratingProfilesTime = null;
let ratingProfilesData = [{
	name: 'Уровень',
	subname: 'личная статистика',
	items: []
}, {
	name: 'Атака',
	subname: 'личная статистика',
	items: []
}, {
	name: 'Здоровье',
	subname: 'личная статистика',
	items: []
}, {
	name: 'Кубки',
	subname: 'награда арены',
	items: []
}, {
	name: 'Навыки',
	subname: 'общая сумма',
	items: []
}];
let ratingGuildsTime = null;
let ratingGuildsData = [{
	name: 'Уровень',
	subname: 'навыки и постройки',
	items: []
}, {
	name: 'Стража',
	subname: 'атака и здоровье',
	items: []
}, {
	name: 'Таран',
	subname: 'атака и здоровье',
	items: []
}, {
	name: 'Атака',
	subname: 'статистика состава',
	items: []
}, {
	name: 'Здоровье',
	subname: 'статистика состава',
	items: []
}, {
	name: 'Уровень',
	subname: 'статистика состава',
	items: []
}, {
	name: 'Посещаемость',
	subname: 'за неделю',
	items: []
}, {
	name: 'Убито боссов',
	subname: 'за неделю',
	items: []
}, {
	name: 'Совершено набегов',
	subname: 'за неделю',
	items: []
}];
let tab = 2;

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			rating: null,
			currentRating: null,
			mainUserID: Number(this?.props?.game?._vkId) || null,
			mainGuildID: Number(this?.props?.game?._clan_id) || null,
			tab: tab,
			server: this.props.server || 1,
			error: false
		};
		this._isMounted = false;
	};
	convert = (word, symbols) => {
		let answer = '';
		for (let symbol of word.split('')) answer += symbols[symbol] == undefined ? symbol : symbols[symbol];
		return answer;
	};
	convertLayout = (word, search) => {
		let symbols = [{
			'q': 'й',
			'w': 'ц',
			'e': 'у',
			'r': 'к',
			't': 'е',
			'y': 'н',
			'u': 'г',
			'i': 'ш',
			'o': 'щ',
			'p': 'з',
			'a': 'ф',
			's': 'ы',
			'd': 'в',
			'f': 'а',
			'g': 'п',
			'h': 'р',
			'j': 'о',
			'k': 'л',
			'l': 'д',
			';': 'ж',
			'\'': 'э',
			'z': 'я',
			'x': 'ч',
			'c': 'с',
			'v': 'м',
			'b': 'и',
			'n': 'т',
			'm': 'ь',
			',': 'б',
			'.': 'ю',
		}, {
			'й': 'q',
			'ц': 'w',
			'у': 'e',
			'к': 'r',
			'е': 't',
			'н': 'y',
			'г': 'u',
			'ш': 'i',
			'щ': 'o',
			'з': 'p',
			'ф': 'a',
			'ы': 's',
			'в': 'd',
			'а': 'f',
			'п': 'g',
			'р': 'h',
			'о': 'j',
			'л': 'k',
			'д': 'l',
			'ж': ';',
			'э': '\'',
			'я': 'z',
			'ч': 'x',
			'с': 'c',
			'м': 'v',
			'и': 'b',
			'т': 'n',
			'ь': 'm',
			'б': ',',
			'ю': '.',
		}];
		let answer = this.convert(word, symbols[0]);
		if (search && !(new RegExp(answer, 'i').test(search))) answer = this.convert(word, symbols[1]);
		return answer;
	};
	convertTranslit = (word, search) => {
		let symbols = [{
			'а': 'a',
			'б': 'b',
			'в': 'v',
			'г': 'g',
			'д': 'd',
			'е': 'e',
			'ё': 'e',
			'ж': 'zh',
			'з': 'z',
			'и': 'i',
			'й': 'y',
			'к': 'k',
			'л': 'l',
			'м': 'm',
			'н': 'n',
			'о': 'o',
			'п': 'p',
			'р': 'r',
			'с': 's',
			'т': 't',
			'у': 'u',
			'ф': 'f',
			'х': 'h',
			'ц': 'c',
			'ч': 'ch',
			'ш': 'sh',
			'щ': 'sch',
			'ь': '',
			'ы': 'y',
			'ъ': '',
			'э': 'e',
			'ю': 'yu',
			'я': 'ya',
		}, {
			'a': 'а',
			'b': 'б',
			'v': 'в',
			'g': 'г',
			'd': 'д',
			'e': 'е',
			'zh': 'ж',
			'z': 'з',
			'i': 'и',
			'y': 'й',
			'k': 'к',
			'l': 'л',
			'm': 'м',
			'n': 'н',
			'o': 'о',
			'p': 'п',
			'r': 'р',
			's': 'с',
			't': 'т',
			'u': 'у',
			'f': 'ф',
			'h': 'х',
			'c': 'ц',
			'ch': 'ч',
			'sh': 'ш',
			'sch': 'щ',
			'yu': 'ю',
			'ya': 'я',
		}];
		let answer = this.convert(word, symbols[0]);
		if (search && !(new RegExp(answer, 'i').test(search))) answer = this.convert(word, symbols[1]);
		return answer;
	};
	calcTag = async(name, reserve) => {
		if (name) {
			let search = /^(.+?) /.exec(name.replace(/{|}|\[|]|-|_/g, ' ').replace(/ +/g, ' ').replace(/^\s/g, ''));
			if (search?.[1]?.length < 5) {
				name = search[1];
			} else name = reserve ? await this.calcTag(reserve) : '#';
		} else name = '#';
		return name.slice(0, 3);
	};
	calcInitialsAvatarColor = (v) => v%6+1;
	loadRating = async() => {
		const { getData } = this.props.state;
		tab = this.state.tab;
		let rating = null;
		let count = 0;
		let error = 0;
		let getTime = (native = false) => {
			let date = new Date(+new Date - count * 86400000).toLocaleString("ru", {
				timezone: 'UTC',
				year: 'numeric',
				month: 'numeric',
				day: 'numeric'
			}).replace(/(\d*).(\d*).(\d*)/g, '$3.$2.$1');
			return native ? new Date(date).getTime() : date;
		};
		if (this.state.tab == 1) {
			do {
				let time = ratingProfilesTime || this._isMounted && getTime();
				let dataRating;
				if (!ratingProfilesTime) {
					dataRating = this._isMounted && await getData(`https://warlord.website.yandexcloud.net/data/users/${['ermun', 'antares'][this.state.server-1]}/${time}.json`);
					if (dataRating && typeof dataRating === 'object') {
						ratingProfilesData[0].items = dataRating.sort((a, b) => {
							return b.exp - a.exp
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.lvl,
							avatar: user.avatar
						}));
						ratingProfilesData[1].items = dataRating.sort((a, b) => {
							return b.dmg - a.dmg
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.dmg,
							avatar: user.avatar
						}));
						ratingProfilesData[2].items = dataRating.sort((a, b) => {
							return b.hp - a.hp
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.hp * 15,
							avatar: user.avatar
						}));
						ratingProfilesData[3].items = dataRating.sort((a, b) => {
							return b.cups - a.cups
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.cups,
							avatar: user.avatar
						}));
						ratingProfilesData[4].items = dataRating.sort((a, b) => {
							return b.hp - a.hp
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.hp * 15,
							avatar: user.avatar
						}));
						ratingProfilesData[4].items = dataRating.sort((a, b) => {
							return b.skills.reduce((first, second) => first + second) - a.skills.reduce((first, second) => first + second)
						}).map(user => ({
							id: user.vkId,
							name: user.name,
							title: user.skills.reduce((first, second) => first + second),
							avatar: user.avatar
						}));

						ratingProfilesTime = time;
						rating = {
							items: dataRating,
							time: time
						};
					} else error++;
				} else {
					rating = {
						items: ratingProfilesData[0].items,
						time: time
					};
				}
				count++;
			} while (rating == null && error < 10 && this._isMounted);
		}
		if (this.state.tab == 2) {
			do {
				let time = ratingGuildsTime || this._isMounted && getTime();
				let milliseconds = getTime(true);
				let dataRating;
				if (!ratingGuildsTime) {
					dataRating = this._isMounted && await getData(`https://warlord.website.yandexcloud.net/data/guilds/${['ermun', 'antares'][this.state.server-1]}/${time}.json`);
					if (dataRating && typeof dataRating === 'object') {
						for (let guild of dataRating) {
							guild.leader = guild?.users?.find(user => user.id == guild.leader)?.vkId || guild.leader;
							guild.tag = await this.calcTag(guild.users.find(user => user.id == guild.leader)?.name, guild.users[0].name);
						}
						ratingGuildsData[0].items = dataRating.sort((a, b) => {
							return b.lvl - a.lvl
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.lvl,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[1].items = dataRating.sort((a, b) => {
							return b.guard.reduce((first, second) => first + second) - a.guard.reduce((first, second) => first + second)
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.guard.reduce((first, second) => first + second),
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[2].items = dataRating.sort((a, b) => {
							return b.ram.reduce((first, second) => first + second) - a.ram.reduce((first, second) => first + second)
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.ram.reduce((first, second) => first + second),
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[3].items = dataRating.sort((a, b) => {
							return b.users.reduce((first, second) => ({dmg: first.dmg + second.dmg})).dmg - a.users.reduce((first, second) => ({dmg: first.dmg + second.dmg})).dmg
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.users.reduce((first, second) => ({dmg: first.dmg + second.dmg})).dmg,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[4].items = dataRating.sort((a, b) => {
							return b.users.reduce((first, second) => ({hp: first.hp + second.hp})).hp - a.users.reduce((first, second) => ({hp: first.hp + second.hp})).hp
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.users.reduce((first, second) => ({hp: first.hp + second.hp})).hp*15,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[5].items = dataRating.sort((a, b) => {
							return b.users.reduce((first, second) => ({lvl: first.lvl + second.lvl})).lvl - a.users.reduce((first, second) => ({lvl: first.lvl + second.lvl})).lvl
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.users.reduce((first, second) => ({lvl: first.lvl + second.lvl})).lvl,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[6].items = dataRating.sort((a, b) => {
							return Math.ceil(100 / (b.users.length / b.users.filter(user => user.date[1] < 86400*7).length)) - Math.ceil(100 / (a.users.length / a.users.filter(user => user.date[1] < 86400*7).length))
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: `${Math.ceil(100 / (guild.users.length / guild.users.filter(user => user.date[1] < 86400*7).length))}%`,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[7].items = dataRating.sort((a, b) => {
							return b.actions.bosses.filter(boss => boss.time > milliseconds-86400000*7).length - a.actions.bosses.filter(boss => boss.time > milliseconds-86400000*7).length
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.actions.bosses.filter(boss => boss.time > milliseconds-86400000*7).length,
							leader: guild.leader,
							tag: guild.tag
						}));
						ratingGuildsData[8].items = dataRating.sort((a, b) => {
							return b.actions.wars.to.filter(war => war.time > milliseconds-86400000*7).length - a.actions.wars.to.filter(war => war.time > milliseconds-86400000*7).length
						}).map(guild => ({
							id: guild.id,
							name: guild.name,
							title: guild.actions.wars.to.filter(war => war.time > milliseconds-86400000*7).length,
							leader: guild.leader,
							tag: guild.tag
						}));

						ratingGuildsTime = time;
						rating = {
							items: dataRating,
							time: time
						};
					} else error++;
				} else {
					rating = {
						items: ratingGuildsData[0].items,
						time: time
					};
				}
				count++;
			} while (rating == null && error < 10 && this._isMounted);
		}
		this._isMounted && this.setState({rating: error == 10 ? false : rating, error: error == 10});
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		this._isMounted = true;
		this._isMounted && await this.loadRating();
	};
	async componentWillUnmount () {
		if (this._isMounted) for (let rating of ratingProfilesData) rating.items = [];
		if (this._isMounted) ratingProfilesTime = null;
		if (this._isMounted) for (let rating of ratingGuildsData) rating.items = [];
		if (this._isMounted) ratingGuildsTime = null;
		this._isMounted = false;
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { setState, state, options, parent } = this.props;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const grid = state.isDesktop ? {display: 'grid', alignItems: 'center', gridTemplateColumns: '40px 32px auto auto', gridGap: '8px'} : {display: 'grid', alignItems: 'center', gridTemplateColumns: '40px 32px auto auto', gridGap: '16px'};
		return (
			<View id="rating" activePanel={!state.activePanel ? 'rating' : state.activePanel}>
				<Panel id={this.props.id}>
					{!state.isDesktop && <PanelHeader className='HeaderWithTabs' after={!state.isEmbedded&&options.getCopy(parent)} before={<PanelHeaderBack onClick={() => setState({ activeStory: 'home', activePanel: 'home' })}/>}>
						<Tabs>
							<TabsItem onClick={() => this.setState({ rating: null, tab: 1 }, () => this.loadRating())} selected={this.state.tab == 1}>Профили</TabsItem>
							<TabsItem onClick={() => this.setState({ rating: null, tab: 2 }, () => this.loadRating())} selected={this.state.tab == 2}>Гильдии</TabsItem>
						</Tabs>
					</PanelHeader>}
					{state.isDesktop && <Group>
						<PanelHeader className='HeaderFix HeaderWithTabs' fixed={false} separator={false} after={options.getCopy(parent)}>
							<Tabs>
								<TabsItem onClick={() => this.setState({ rating: null, tab: 1 }, () => this.loadRating())} selected={this.state.tab == 1}>Профили</TabsItem>
								<TabsItem onClick={() => this.setState({ rating: null, tab: 2 }, () => this.loadRating())} selected={this.state.tab == 2}>Гильдии</TabsItem>
							</Tabs>
						</PanelHeader>
					</Group>}
					{!this.state.error?<>
						{this.state.tab == 1 && <>
							<div className={`HorizontalRatingsGroup`}>
								{ratingProfilesData.map((rating, x) => <Group separator="hide" key={x} style={{gridColumnStart: x == 0 ? 'span 2' : ''}}>
									<div className="HorizontalRating">
										{rating?.items?.length?<React.Fragment>
											<Header subtitle={rating.subname} title={rating.name} mode="primary" aside={<Link onClick={() => this.setState({ currentRating: {...rating, tab: 1, id: this.state.mainUserID} }, () => options.setActivePanel('1'))}>Список <Icon12ChevronOutline /></Link>}>{rating.name}</Header>
											<div>
												{rating?.items?.slice(0, 3).map((user, x) => <TableCell
													key={x}
													count={options.numberSpaces(x+1, ' ')}
													href={`https://vk.com/id${user.id}`}
													style={grid}
													avatar={<Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} size={32}/>}
													rows={[{
														title: user.name?user.name:`Player\n${user.id}`
													}, {
														title: Number.isInteger(user.title) ? options.numberSpaces(user.title, ' ') : user.title,
														right: true
													}]}
												/>)}
												<Spacing size={16} separator />
												{this.state.mainUserID ? [this.state.mainUserID&&rating?.items?.find(user => user.id == this.state.mainUserID)?rating?.items?.find(user => user.id == this.state.mainUserID):rating?.items[rating?.items?.length-1]].map((user, x) => <TableCell
													key={x}
													count={options.numberSpaces(rating?.items?.indexOf(user)+1, ' ')}
													href={`https://vk.com/id${user.id}`}
													style={grid}
													avatar={<Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} size={32}/>}
													rows={[{
														title: user.name?user.name:`Player\n${user.id}`
													}, {
														title: Number.isInteger(user.title) ? options.numberSpaces(user.title, ' ') : user.title,
														right: true
													}]}
												/>) : <TableCell
													count={'-'}
													style={grid}
													avatar={<InitialsAvatar size={32}>#</InitialsAvatar>}
													rows={[{
														title: '-'
													}, {
														title: '-',
														right: true
													}]}
												/>}
											</div>
										</React.Fragment>:<React.Fragment>
											<Header subtitle={<Skeleton height={14} width={125} marginTop={2}/>} mode="primary" aside={<Skeleton height={20} width={50}/>}><Skeleton height={20} width={100} marginBottom={2}/></Header>
											<div>
												{new Array(3).fill(null).map((user, x) => <div key={x} className="TableCell">
													<div className="TableCell__content" style={grid}>
														<Skeleton height={16}/>
														<Skeleton height={32} borderRadius="50%"/>
														<Skeleton height={16}/>
														<Skeleton height={16}/>
													</div>
												</div>)}
												<Spacing size={16} separator />
												<div className="TableCell">
													<div className="TableCell__content" style={grid}>
														<Skeleton height={16}/>
														<Skeleton height={32} borderRadius="50%"/>
														<Skeleton height={16}/>
														<Skeleton height={16}/>
													</div>
												</div>
											</div>
										</React.Fragment>}
									</div>
								</Group>)}
							</div>
							{state.isDesktop&&<Spacing size={16} />}
							<Group>
								{state.isDesktop&&
									(this.state?.rating?.items?<Input
										type="text"
										name="id"
										placeholder="Введите номер профиля"
										align="center"
										defaultValue={this.state.mainUserID}
										onChange={event => {
											let id = Number(event.target.value);
											if (id != 0 && id != NaN && Number.isInteger(id) && this.state.rating.items.find(user => user.vkId == id || user.id == id)) return this.setState({ mainUserID: id});
											
											let isFind = false;
											let search = String(event.target.value || '').trim().toLowerCase().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
											if (search?.length) {
												for (let option of this.state.rating.items) {
													let value = String(option.name || '').trim().toLowerCase();
													if (value?.length) {
														if (new RegExp(search, 'i').test(value)) {
															isFind = true;
															this.setState({ mainUserID: option.id });
															break;
														} else if (new RegExp(search.replace(/\s/g, ''), 'i').test(value.replace(/\s/g, ''))) {
															isFind = true;
															this.setState({ mainUserID: option.id });
															break;
														} else if (search.length >= 1 && new RegExp(this.convertLayout(search, value), 'i').test(value)) {
															isFind = true;
															this.setState({ mainUserID: option.id });
															break;
														} else if (search.length >= 1 && new RegExp(this.convertTranslit(search, value), 'i').test(value)) {
															isFind = true;
															this.setState({ mainUserID: option.id });
															break;
														}
													}
												}
												if (isFind) return;
											}

											return this.setState({ mainUserID: undefined });
										}}
									/>:<Skeleton height={36}/>)}
								{state.isDesktop&&<Spacing size={8} />}
								{this.state?.rating?.items?<Footer style={{margin: 0}}>{this.state.server == 1 ? 'Эрмун' : 'Антарес'}, обновлено {this.state.rating.time.replace(/(\d*).(\d*).(\d*)/g, '$3.$2.$1')} в 12:00, {options.numberSpaces(this.state.rating.items.length, ' ')} игроков</Footer>:<Footer style={{margin: 0}}><Skeleton height={16} width={'35%'} margin={'auto'}/></Footer>}
								{!state.isDesktop&&<Spacing size={8} />}
							</Group>
						</>}
						{this.state.tab == 2 && <>
							<div className={`HorizontalRatingsGroup`}>
								{ratingGuildsData.map((rating, x) => <Group separator="hide" key={x} style={{gridColumnStart: x == 0 ? 'span 2' : ''}}>
									<div className="HorizontalRating">
										{rating?.items?.length?<React.Fragment>
											<Header subtitle={rating.subname} title={rating.name} mode="primary" aside={<Link onClick={() => this.setState({ currentRating: {...rating, tab: 2, id: this.state.mainGuildID} }, () => options.setActivePanel('1'))}>Список <Icon12ChevronOutline /></Link>}>{rating.name}</Header>
											<div>
												{rating?.items?.slice(0, 3).map((guild, x) => <TableCell
													key={x}
													count={options.numberSpaces(x+1, ' ')}
													href={`https://vk.com/id${guild.leader}`}
													style={grid}
													avatar={<InitialsAvatar gradientColor={this.calcInitialsAvatarColor(guild.id)} size={32}>{guild.tag}</InitialsAvatar>}
													rows={[{
														title: guild.name?guild.name:`Guild\n${guild.id}`
													}, {
														title: Number.isInteger(guild.title) ? options.numberSpaces(guild.title, ' ') : guild.title,
														right: true
													}]}
												/>)}
												<Spacing size={16} separator />
												{this.state.mainGuildID ? [this.state.mainGuildID&&rating?.items?.find(guild => guild.id == this.state.mainGuildID)?rating?.items?.find(guild => guild.id == this.state.mainGuildID):rating?.items[rating?.items?.length-1]].map((guild, x) => <TableCell
													key={x}
													count={options.numberSpaces(rating?.items?.indexOf(guild)+1, ' ')}
													href={`https://vk.com/id${guild.leader}`}
													style={grid}
													avatar={<InitialsAvatar gradientColor={this.calcInitialsAvatarColor(guild.id)} size={32}>{guild.tag}</InitialsAvatar>}
													rows={[{
														title: guild.name?guild.name:`Guild\n${guild.id}`
													}, {
														title: Number.isInteger(guild.title) ? options.numberSpaces(guild.title, ' ') : guild.title,
														right: true
													}]}
												/>) : <TableCell
													count={'-'}
													style={grid}
													avatar={<InitialsAvatar size={32}>#</InitialsAvatar>}
													rows={[{
														title: '-'
													}, {
														title: '-',
														right: true
													}]}
												/>}
											</div>
										</React.Fragment>:<React.Fragment>
											<Header subtitle={<Skeleton height={14} width={125} marginTop={2}/>} mode="primary" aside={<Skeleton height={20} width={50}/>}><Skeleton height={20} width={100} marginBottom={2}/></Header>
											<div>
												{new Array(3).fill(null).map((guild, x) => <div key={x} className="TableCell">
													<div className="TableCell__content" style={grid}>
														<Skeleton height={16}/>
														<Skeleton height={32} borderRadius="50%"/>
														<Skeleton height={16}/>
														<Skeleton height={16}/>
													</div>
												</div>)}
												<Spacing size={16} separator />
												<div className="TableCell">
													<div className="TableCell__content" style={grid}>
														<Skeleton height={16}/>
														<Skeleton height={32} borderRadius="50%"/>
														<Skeleton height={16}/>
														<Skeleton height={16}/>
													</div>
												</div>
											</div>
										</React.Fragment>}
									</div>
								</Group>)}
							</div>
							{state.isDesktop&&<Spacing size={16} />}
							<Group>
								{state.isDesktop&&
									(this.state?.rating?.items?<Input
										type="text"
										name="id"
										placeholder="Введите номер гильдии"
										align="center"
										defaultValue={this.state.mainGuildID}
										onChange={event => {
											let id = Number(event.target.value);
											if (id != 0 && id != NaN && Number.isInteger(id) && this.state.rating.items.find(guild => guild.id == id)) return this.setState({ mainGuildID: id});
											
											let isFind = false;
											let search = String(event.target.value || '').trim().toLowerCase().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
											if (search?.length) {
												for (let option of this.state.rating.items) {
													let value = String(option.name || '').trim().toLowerCase();
													if (value?.length) {
														if (new RegExp(search, 'i').test(value)) {
															isFind = true;
															this.setState({ mainGuildID: option.id });
															break;
														} else if (new RegExp(search.replace(/\s/g, ''), 'i').test(value.replace(/\s/g, ''))) {
															isFind = true;
															this.setState({ mainGuildID: option.id });
															break;
														} else if (search.length >= 1 && new RegExp(this.convertLayout(search, value), 'i').test(value)) {
															isFind = true;
															this.setState({ mainGuildID: option.id });
															break;
														} else if (search.length >= 1 && new RegExp(this.convertTranslit(search, value), 'i').test(value)) {
															isFind = true;
															this.setState({ mainGuildID: option.id });
															break;
														}
													}
												}
												if (isFind) return;
											}

											return this.setState({ mainGuildID: undefined });
										}}
									/>:<Skeleton height={36}/>)}
								{state.isDesktop&&<Spacing size={8} />}
								{this.state?.rating?.items?<Footer style={{margin: 0}}>{this.state.server == 1 ? 'Эрмун' : 'Антарес'}, обновлено {this.state.rating.time.replace(/(\d*).(\d*).(\d*)/g, '$3.$2.$1')} в 12:00, {options.numberSpaces(this.state.rating.items.length, ' ')} гильдий</Footer>:<Footer style={{margin: 0}}><Skeleton height={16} width={'35%'} margin={'auto'}/></Footer>}
								{!state.isDesktop&&<Spacing size={8} />}
							</Group>
						</>}
					</>:<Group>
						<Div style={{textAlign: 'center', padding: 0, minHeight: 438, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
							<SVG_sadFace style={{height: 150, width: 150}}/>
							<Text style={{fontSize: '24px', lineHeight: '1.25', fontWeight: 600, color: 'var(--text_primary)', width: '50%', marginBottom: 12}}>Произошла ошибка</Text>
							<Text style={{fontSize: '17px', lineHeight: '1.25', fontWeight: 500, color: 'var(--text_primary)', width: '50%', marginBottom: 12}}>Превышено количество попыток</Text>
							<Button mode="tertiary" size="l" onClick={() => this.setState({ rating: null, error: false }, () => this.loadRating())}><span style={{color: 'var(--dynamic_blue)'}}>Обновить</span></Button>
						</Div>
					</Group>}
					{this.state.snackbar}
				</Panel>
				<PANEL_rating__1 id='1' parent='rating' state={this.props.state} currentRating={this.state.currentRating} options={this.props.options} />
			</View>
		);
	};
};
export default PANEL;