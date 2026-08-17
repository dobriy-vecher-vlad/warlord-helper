import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	Cell,
	HorizontalScroll,
	TabsItem,
	Tabs,
	Spinner,
	Counter,
	Button,
	Placeholder,
} from '@vkontakte/vkui';
import InfiniteScroll from "react-infinite-scroll-component";
import { Icon12ArrowUp, Icon16Up, Icon56FragmentsOutline } from '@vkontakte/icons';
import Skeleton from '../../components/skeleton';

import Items from '../../data/items.json';

const enchantmentsMultiplier = [0.10, 0.15, 0.20, 0.25, 0.30, 0.10, 0.15, 0.20, 0.25, 0.30];
const enchantmentsChance = [100, 70, 35, 25, 10, 10, 10, 10, 10, 10];
const enchantmentsScrolls = [1, 3, 5, 7, 9, 12, 14, 16, 18, 20];

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			isLoad: true,
			tabs: 'm1',
			items: this.props.syncItems || [],
			placeholderSize: (68 + 16 + (this.props.state.isDesktop ? 56 : 100)) - (20 + 56 + 12),
			scrolls: null,
			profile: null,
			getGameAuth: null,
			currentItems: null,
			allItems: null,
			activeItem: false,
			resources: [{
				id: 'm1',
				name: 'Серебро',
				forms: ['серебро', 'серебра', 'серебра'],
				count: 0,
				multiplier: 120,
			}, {
				id: 'm3',
				name: 'Золото',
				forms: ['золото', 'золота', 'золота'],
				count: 0,
				multiplier: 120,
			}, {
				id: 'm2',
				name: 'Рубины',
				forms: ['рубин', 'рубина', 'рубинов'],
				count: 0,
				multiplier: 1,
			}, {
				id: 'm6',
				name: 'Турмалины',
				forms: ['турмалин', 'турмалина', 'турмалинов'],
				count: 0,
				multiplier: 5,
			}, {
				id: 'm4',
				name: 'Аметисты',
				forms: ['аметист', 'аметиста', 'аметистов'],
				count: 0,
				multiplier: 7,
			}, {
				id: 'm5',
				name: 'Топазы',
				forms: ['топаз', 'топаза', 'топазов'],
				count: 0,
				multiplier: 8,
			}, {
				id: 'm9',
				name: 'Редкие жемчужины',
				forms: ['жемчужина', 'жемчужины', 'жемчужин'],
				count: 0,
				multiplier: 0,
			}],
		};
		this.Scroll = React.createRef();
		this._isMounted = false;
	};
	async updateItems(isUpgrade = false) {
		const { state } = this.props;
		const { getGame, server } = this.props.state;
		const { BotAPI, openSnackbar, setActivePanel } = this.props.options;
		if (!isUpgrade) {
			this.state.activeItem = false;
			if (this.Scroll && this.Scroll.current) this.Scroll.current.scrollTo({ top: 0 });
			if (!this.props.state.isDesktop) document.querySelector('html').scrollTo({ top: 0 });
		}
		this._isMounted && this.setState({ isLoad: true });
		let dataProfile;
		if (!this.state.profile || isUpgrade) {
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
			this.state.getGameAuth = {
				login: api_uid,
				password: auth_key,
			};
			dataProfile = this._isMounted && await getGame(server, {}, this.state.getGameAuth);
			if (!dataProfile?.u || !dataProfile.i.length) {
				openSnackbar({text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error'});
				this._isMounted && BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Пароль авторизации игры неисправен, введите новый', error: typeof dataProfile == 'string' ? dataProfile : dataProfile?.err_msg ? dataProfile?.err_msg : JSON.stringify(dataProfile)});
				this._isMounted && setActivePanel('profile');
				return;
			}
			this.state.getGameAuth.id = dataProfile?.u?._id || api_uid;
			this.state.profile = dataProfile;
		} else dataProfile = this.state.profile;

		this.state.resources.map(resource => resource.count = Number(dataProfile.u[`_${resource?.id}`]) || 0);
		this.state.items = [];
		let resource = this.state.resources.find(resource => resource.id == this.state.tabs);
		dataProfile.i.filter(item => Number(item._o) == 1)?.map(item => {
			try {
				let _item = Items.find(_item => _item.id == Number(item._id));
				_item.lvl = Number(item._u) || 0;
				if (resource.id == 'm9') {
					_item.scrolls = 0;
					if (_item.lvl < 5 || _item.lvl >= 10 || resource.count < enchantmentsScrolls[_item.lvl]) return;
				} else {
					if (`m${_item.currency}` != resource.id) return;
					_item.scrolls = Number(dataProfile?.iupgrade?.i?.find(item => Number(item._id) == Number(_item.id))?._cnt) || 0;
					if (_item.lvl >= 5 || _item.scrolls < [...enchantmentsScrolls].splice(0, 5)?.[_item.lvl]) return;
				}
				_item.prices = enchantmentsMultiplier.map((multiplier) => Math.ceil((_item.dmg + _item.hp) * multiplier) * (this.state.resources.find(resource => resource.id == `m${_item.currency}`)?.multiplier || 1));
				if (this.state.resources.find(resource => resource.id == `m${_item.currency}`)?.count < _item.prices[_item.lvl]) {
					_item.blocked = true;
				} else _item.blocked = false;
				_item.enchantments = {
					dmg: enchantmentsMultiplier.map((multiplier) => Math.ceil(_item.dmg * multiplier || 0)),
					hp: enchantmentsMultiplier.map((multiplier) => Math.ceil(_item.hp * multiplier || 0)),
				};
				this.state.items.push(_item);
			} catch (error) { }
		});
		let allItems = this.state.items.sort((a, b) => b.lvl - a.lvl);
		this.setState({ currentItems: allItems.slice(0, 30), allItems });
		this._isMounted && this.setState({ isLoad: false });
	};
	async upgradeItem(item) {
		const { getGame, server } = this.props.state;
		const { openSnackbar } = this.props.options;
		this.setState({ isLoad: true });
		let data = this._isMounted && await getGame(server, {
			i: 26,
			t1: item.id,
		}, this.state.getGameAuth);
		if (data?.a?._res) {
			if (data?.msg == 'Недостаточно ресурсов.') {
				openSnackbar({text: 'Недостаточно ресурсов для улучшения предмета', icon: 'error'});
			} else if (Number(data.a._res) == 1) {
				openSnackbar({text: 'Удачная попытка улучшения предмета', icon: 'done'});
			} else if (Number(data.a._res) == 2) {
				openSnackbar({text: 'Неудачная попытка улучшения предмета', icon: 'error'});
			// } else openSnackbar({text: 'Неизвестная ошибка при улучшении предмета', icon: 'error'});
			} else openSnackbar({text: icon, icon: 'error'});
		// } else openSnackbar({text: 'Неизвестная ошибка при улучшении предмета', icon: 'error'});
		} else openSnackbar({text: data, icon: 'error'});
		await this.updateItems(true);
		this.setState({ activeItem: item.id });
		this.setState({ isLoad: false });
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		this._isMounted = true;
		await this.updateItems();
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
		const { currentItems, allItems } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Кузница';
		const description = 'Мой профиль';
		const avatar = 'labels/20.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group className={this.state.isLoad ? 'State--isLoad' : ''}>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{!this.state.isLoad || currentItems ? <Tabs mode="default">
							<HorizontalScroll getScrollToLeft={i => i - 240} getScrollToRight={i => i + 240}>
								{this.state.resources.map((resource, x) => <TabsItem key={x} status={<div className="vkuiTabsItem__status--count vkuiSubhead vkuiSubhead--sizeY-compact vkuiSubhead--w-2">{options.numberSpaces(resource.count, ' ')}</div>} onClick={() => this.setState({ tabs: resource.id }, this.updateItems)} selected={this.state.tabs === resource.id}>{resource.name}</TabsItem>)}
							</HorizontalScroll>
						</Tabs> : <Skeleton height={state.isDesktop ? 44 : 48} marginLeft={state.isDesktop ? 0 : 8} marginRight={state.isDesktop ? 0 : 8} width="auto"/>}
						<Spacing size={8} style={{padding: 0, marginTop: 0}}/>
					</div>
					{!this.state.isLoad || currentItems ? <>
						{currentItems && currentItems.length > 0 ? <div ref={this.Scroll} className="Scroll" id="Scroll" style={{maxHeight: state.isDesktop ? '372px' : 'unset'}}>
							<InfiniteScroll
								dataLength={currentItems.length}
								next={() => this.setState((state) => ({
									currentItems: state.currentItems.concat(allItems.slice(state.currentItems.length, state.currentItems.length+30))
								}))}
								hasMore={allItems.length > currentItems.length}
								loader={<Spinner size="regular" style={{ margin: '20px 0' }} />}
								scrollableTarget={state.isDesktop?"Scroll":false}
							><CardGrid size={state.isDesktop ? "m" : "l"}>
								{currentItems.map((data, x) => options.getItemPreview(data, x, `${data.lvl} уровень${!data.scrolls ? '' : `, ${data.scrolls} ${options.numberForm(data.scrolls, ['заточка', 'заточки', 'заточек'])}`}`, false, false, false, () => this.setState({ activeItem: this.state.activeItem == data.id ? false : data.id }), `Card__Item--checkbox${this.state.activeItem == data.id ? ' Card__Item--active' : '' }`))}
							</CardGrid></InfiniteScroll>
						</div>:<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>}
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={8} />
							{this.state.activeItem ? <>
								{[0].map((data, x) => {
									let item = currentItems.find(item => item.id == this.state.activeItem);
									if (!item) return (<Placeholder key={x} style={{ paddingTop: this.state.placeholderSize/2+1, paddingBottom: this.state.placeholderSize/2 }} icon={<Icon56FragmentsOutline/>}>Выберите предмет для улучшения</Placeholder>);
									let scrolls = enchantmentsScrolls[item.lvl];
									let currentDmg;
									let currentHp;
									try {
										currentDmg = item.enchantments.dmg.slice(0, item.lvl).reduce((x, y) => x + y);
										currentHp = item.enchantments.hp.slice(0, item.lvl).reduce((x, y) => x + y);
									} catch (error) {
										currentDmg = 0;
										currentHp = 0;
									}
									return (<React.Fragment key={x}>
										<div style={{ marginLeft: state.isDesktop ? 0 : 8, marginRight: state.isDesktop ? 0 : 8 }}>{options.getItemPreview(item, x, `Необходимо ${options.numberSpaces(item.prices[item.lvl], ' ')} ${options.numberForm(item.prices[item.lvl], this.state.resources.find(resource => resource.id == `m${item.currency}`)?.forms)} и ${scrolls} ${options.numberForm(scrolls, item.lvl >= 5 ? ['жемчужина', 'жемчужины', 'жемчужин'] : ['заточка', 'заточки', 'заточек'])}`, false, false, false, false, false, (item.blocked ? <Button disabled={true} appearance="neutral" mode="secondary">Не хватает ресурсов</Button> : <Button loading={this.state.isLoad} before={<Icon12ArrowUp style={{color: 'var(--button_commerce_foreground,var(--vkui--color_text_contrast))'}}/>} appearance="positive" mode="primary" onClick={() => this.upgradeItem(item)}>Улучшить</Button>))}</div>
										<Spacing size={16} separator />
										<div className="CounterCell__grid">
											<div className="CounterCell">
												<div className="CounterCell__title">Урон</div>
												<div className="CounterCell__content">
													<div className="CounterCell__text">{options.numberSpaces(item.dmg + currentDmg, ' ')} DMG</div>
													<div className="CounterCell__text"><Icon16Up/> {options.numberSpaces(item.enchantments.dmg[item.lvl], ' ')} DMG</div>
												</div>
											</div>
											<div className="CounterCell">
												<div className="CounterCell__title">Здоровье</div>
												<div className="CounterCell__content">
													<div className="CounterCell__text">{options.numberSpaces((item.hp + currentHp) * 15, ' ')} HP</div>
													<div className="CounterCell__text"><Icon16Up/> {options.numberSpaces(item.enchantments.hp[item.lvl] * 15, ' ')} HP</div>
												</div>
											</div>
											<div className="CounterCell">
												<div className="CounterCell__title">Шанс</div>
												<div className="CounterCell__content">
													<div className="CounterCell__text">{enchantmentsChance[item.lvl]}%</div>
												</div>
											</div>
										</div>
									</React.Fragment>);
								})}
							</> : <Placeholder style={{ paddingTop: this.state.placeholderSize/2+1, paddingBottom: this.state.placeholderSize/2 }} icon={<Icon56FragmentsOutline/>}>Выберите предмет для улучшения</Placeholder>}
						</div>
					</>:<>
						<div className="Scroll" id="Scroll" style={{maxHeight: state.isDesktop ? '372px' : 'unset'}}>
							<CardGrid size={state.isDesktop ? "m" : "l"}>
								{new Array(10).fill(null).map((item, x) => <Card className="Card__Item" key={x}><Skeleton height={68}/></Card>)}
							</CardGrid>
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={8} />
							<Skeleton height={68} marginLeft={state.isDesktop ? 0 : 8} marginRight={state.isDesktop ? 0 : 8} width="auto"/>
							<Spacing size={16} separator />
							<div className="CounterCell__grid">
								<Skeleton height={56} width={state.isDesktop ? '30%' : '40%'}/>
								<Skeleton height={56} width={state.isDesktop ? '30%' : '40%'}/>
								<Skeleton height={state.isDesktop ? 56 : 36} width={state.isDesktop ? '30%' : '40%'}/>
							</div>
						</div>
					</>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;