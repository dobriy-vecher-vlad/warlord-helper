import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	Placeholder,
	Button,
	Avatar
} from '@vkontakte/vkui';
import { Icon16ChevronOutline, Icon24SadFaceOutline, Icon28ChevronLeftOutline, Icon28Chevrons2LeftOutline } from '@vkontakte/icons';
import Skeleton from '../../components/skeleton';
import TableCell from '../../components/tableCell';

let api_id = 5536422;
let clan_id = 628113656;
let clan_auth = 'de73003f6d508e583e9c7f316024abbf';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			friendsMode: [1, true],
			friendsPage: 0,
			syncFriends: null
		};
		this._isMounted = false;
	};
	FriendsScanner = async() => {
		let syncFriends = [];
		let data = this._isMounted && await this.props.state.getBridge("VKWebAppGetAuthToken", {"app_id": 7787242, "scope": "friends"});
		if (data.error_data) {
			this._isMounted && this.props.options.OpenModal(`alert`, {header: 'Ошибка при получении друзей', subheader: `${data.error_data.error_reason}`}, null, 'card');
			this._isMounted && this.props.options.setActivePanel(this.props.parent);
		} else if (data.access_token) {
			data = this._isMounted && await this.props.state.getBridge("VKWebAppCallAPIMethod", {"method": "friends.get", "params": {"user_id": this.props.state.user?.vk?.id, "fields": "photo_50", "count": 5000, "v": "5.130", "access_token": data.access_token}});
			if (data?.response?.count && data?.response?.count !== 0) {
				for (let i = 0; i < Math.ceil(data.response.count/300); i++) {
					if (this._isMounted) {
						let dataGame = this._isMounted && await this.props.state.getGame(this.props.state.server, {
							i: 7,
							f_data: `<data>${data.response.items.slice(i*300, (i+1)*300).map((item, x) => {
								return `<u>${item.id}</u>`;
							}).join('')}</data>`,
						}, {
							login: clan_id,
							password: clan_auth,
							id: this.props.state.user?.vk?.id,
						});
						if (dataGame?.u) {
							typeof dataGame.u == 'undefined' ? dataGame.u = [] : '';
							typeof dataGame.u.length == 'undefined' ? dataGame.u = [dataGame.u] : '';
							dataGame.u.map((item, x) => {
								syncFriends.push({
									id: Number(item._vkId),
									name: item._name == '' ? `Player${item._id}` : item._name,
									vk: data.response.items.find(x => x.id === Number(item._vkId)),
									dmg: Number(item._dmgi),
									hp: (Number(item._endi) + Number(item._end)) * 15,
									lvl: Number(item._lvl),
									exp: Number(item._exp),
									skills: [Number(item._s1), Number(item._s2), Number(item._s3), Number(item._s4)],
									active: [new Date - Number(item._bd) * 1000, new Date - Number(item._l_t) * 1000]
								});
							});
							syncFriends.splice(syncFriends.findIndex(x => x.id === this.props.state.user?.vk?.id), 1);
						} else {
							this._isMounted && this.setState({syncFriends: []});
						}
					}
				}
				syncFriends.sort(function(a, b) {
					return b.dmg < a.dmg ? -1 : 1;
				}).map((item, x) => item.x = x+1);
				this._isMounted && this.setState({syncFriends});
			} else {
				this._isMounted && this.setState({syncFriends: []});
				// this.props.options.OpenModal(`alert`, {header: 'Ошибка при получении друзей', subheader: `У Вас нет друзей`}, null, 'card');
			}
		} else {
			this._isMounted && this.props.options.OpenModal(`alert`, {header: 'Ошибка при получении друзей', subheader: `${data}`}, null, 'card');
			this._isMounted && this.props.options.setActivePanel(this.props.parent);
		}
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		this._isMounted = true;
		this._isMounted && await this.FriendsScanner();
	};
	async componentDidUpdate() {
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
	};
	async componentWillUnmount () {
		this._isMounted = false;
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent } = this.props;
		const { friendsMode, friendsPage, syncFriends } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Друзья';
		const description = 'Мой профиль';
		const avatar = 'labels/23.png';
		const grid = state.isDesktop ? {display: 'grid', alignItems: 'center', gridTemplateColumns: '32px 32px 20% repeat(3, calc(80% / 3 - (32px + 32px + 110px) / 3)) 110px', width: 'calc(100% - 8px * 6)', gridGap: '8px'} : {display: 'grid', alignItems: 'center', gridTemplateColumns: '32px 32px 20% repeat(3, calc(80% / 3 - (32px + 32px) / 3))', width: 'calc(100% - 16px * 5)', gridGap: '16px'};
		const count = 50;
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					{syncFriends?syncFriends.length?<React.Fragment>
						<div className='Sticky Sticky__top withSeparator'>
							{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
							<div className="TableCell">
								<div className="TableCell__content" style={grid}>
									<div/>
									<div style={{height: 32}}/>
									<div/>
									<div
										style={{color: 'var(--text_secondary)', cursor: 'pointer'}}
										className="TableCell__row"
										onClick={() => this.setState({ friendsMode: [1, friendsMode[0] == 1 ? !friendsMode[1] : 1] })}
									><span>урон</span>{friendsMode[0] == 1 && <Icon16ChevronOutline style={{transform: !friendsMode[1] ? 'rotate(90deg)' : 'rotate(-90deg)'}}/>}</div>
									<div
										style={{color: 'var(--text_secondary)', cursor: 'pointer'}}
										className="TableCell__row"
										onClick={() => this.setState({ friendsMode: [2, friendsMode[0] == 2 ? !friendsMode[1] : 1] })}
									><span>здоровье</span>{friendsMode[0] == 2 && <Icon16ChevronOutline style={{transform: !friendsMode[1] ? 'rotate(90deg)' : 'rotate(-90deg)'}}/>}</div>
									<div
										style={{color: 'var(--text_secondary)', cursor: 'pointer'}}
										className="TableCell__row"
										onClick={() => this.setState({ friendsMode: [3, friendsMode[0] == 3 ? !friendsMode[1] : 1] })}
									><span>уровень</span>{friendsMode[0] == 3 && <Icon16ChevronOutline style={{transform: !friendsMode[1] ? 'rotate(90deg)' : 'rotate(-90deg)'}}/>}</div>
									{state.isDesktop&&<div
										style={{color: 'var(--text_secondary)', cursor: 'pointer'}}
										className="TableCell__row"
										onClick={() => this.setState({ friendsMode: [4, friendsMode[0] == 4 ? !friendsMode[1] : 1] })}
									><span>последний вход</span>{friendsMode[0] == 4 && <Icon16ChevronOutline style={{transform: !friendsMode[1] ? 'rotate(90deg)' : 'rotate(-90deg)'}}/>}</div>}
								</div>
							</div>
							<Spacing size={8} />
						</div>
						<div className="Scroll" style={{maxHeight: state.isDesktop ? '392px' : 'unset', minHeight: state.isDesktop ? 'unset' : 'unset'}}>
							{syncFriends.sort(function(a, b) {
								if (friendsMode[0] == 1) {
									if (friendsMode[1]) {
										return b.dmg < a.dmg ? -1 : 1;
									} else {
										return a.dmg < b.dmg ? -1 : 1;
									}
								}
								if (friendsMode[0] == 2) {
									if (friendsMode[1]) {
										return b.hp < a.hp ? -1 : 1;
									} else {
										return a.hp < b.hp ? -1 : 1;
									}
								}
								if (friendsMode[0] == 3) {
									if (friendsMode[1]) {
										return b.exp < a.exp ? -1 : 1;
									} else {
										return a.exp < b.exp ? -1 : 1;
									}
								}
								if (friendsMode[0] == 4) {
									if (friendsMode[1]) {
										return b.active[1] < a.active[1] ? -1 : 1;
									} else {
										return a.active[1] < b.active[1] ? -1 : 1;
									}
								}
							}).slice(friendsPage*count, (friendsPage+1)*count).map((friend, x) => <TableCell
								key={x}
								count={options.numberSpaces(friend.x, ' ')}
								href={`https://vk.com/id${friend.id}`}
								style={grid}
								avatar={<Avatar size={32} src={friend.vk.photo_50} />}
								rows={state.isDesktop?[{
									// title: `${friend.vk.first_name} ${friend.vk.last_name}`
									title: friend.name
								}, {
									title: options.numberSpaces(friend.dmg, ' ')
								}, {
									title: options.numberSpaces(friend.hp, ' ')
								}, {
									title: options.numberSpaces(friend.lvl, ' ')
								}, {
									title: new Date(friend.active[1]).toLocaleString("ru", {
										timezone: 'UTC',
										year: 'numeric',
										month: 'numeric',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric'
									})
								}]:[{
									title: friend.name
								}, {
									title: options.numberSpaces(friend.dmg, ' ')
								}, {
									title: options.numberSpaces(friend.hp, ' ')
								}, {
									title: options.numberSpaces(friend.lvl, ' ')
								}]}
							/>)}
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={10} />
							<div className="TableCell">
								<div className="TableCell__content">
									<div className="TableCell__row">
										<span style={{color: 'var(--text_secondary)'}}>Показана {options.numberSpaces(friendsPage+1, ' ')} страница из {options.numberSpaces(Math.ceil(syncFriends.length/count), ' ')}</span>
										<span style={{display: 'flex'}}>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ friendsPage: 0 })} disabled={friendsPage<=0}><Icon28Chevrons2LeftOutline/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ friendsPage: friendsPage-1 })} disabled={friendsPage<=0}><Icon28ChevronLeftOutline/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ friendsPage: friendsPage+1 })} disabled={friendsPage>=Math.ceil(syncFriends.length/count)-1}><Icon28ChevronLeftOutline style={{transform: 'rotate(180deg)'}}/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ friendsPage: Math.ceil(syncFriends.length/count)-1 })} disabled={friendsPage>=Math.ceil(syncFriends.length/count)-1}><Icon28Chevrons2LeftOutline style={{transform: 'rotate(180deg)'}}/></Button>
										</span>
									</div>
								</div>
							</div>
							<Spacing size={2} />
						</div>
					</React.Fragment>:<React.Fragment>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						<Placeholder icon={<Icon24SadFaceOutline width="56" height="56"/>} header="Друзья">У Вас нет друзей,<br/>обязательно добавьте кого-нибудь<br/>и попробуйте снова</Placeholder>
					</React.Fragment>:<React.Fragment>
						<div className='Sticky Sticky__top withSeparator'>
							{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
							<div className="TableCell">
								<div className="TableCell__content" style={grid}>
									<div/>
									<div style={{height: 32}}/>
									<div/>
									<Skeleton height={16}/>
									<Skeleton height={16}/>
									<Skeleton height={16}/>
									{state.isDesktop&&<Skeleton height={16}/>}
								</div>
							</div>
							<Spacing size={8} />
						</div>
						<div className="Scroll" style={{maxHeight: state.isDesktop ? '392px' : 'unset', minHeight: state.isDesktop ? 'unset' : 'calc(100vh - 216px)'}}>
							{new Array(state.isDesktop?10:50).fill(null).map((item, x) => <div key={x} className="TableCell">
								<div className="TableCell__content" style={grid}>
									<Skeleton height={16}/>
									<Skeleton height={32} borderRadius="50%"/>
									<Skeleton height={16}/>
									<Skeleton height={16}/>
									<Skeleton height={16}/>
									<Skeleton height={16}/>
									{state.isDesktop&&<Skeleton height={16}/>}
								</div>
							</div>)}
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={10} />
							<div className="TableCell">
								<div className="TableCell__content">
									<div className="TableCell__row">
										<Skeleton height={16} width="35%"/>
										<Skeleton height={30} width="20%"/>
									</div>
								</div>
							</div>
							<Spacing size={2} />
						</div>
					</React.Fragment>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;