import bridge from "@vkontakte/vk-bridge";
import React from 'react';
import {
	Spacing,
	Div,
	Text,
	ModalCard,
	Button,
	HorizontalCell,
	Avatar
} from '@vkontakte/vkui';

import Items from '../data/items.json';
import dataArena from '../data/arena.json';
import { Icon24DoneOutline, Icon24ShareOutline } from '@vkontakte/icons';

import { ReactComponent as SVG_sadFace } from './sadFace.svg';
import Skeleton from '../components/skeleton';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoad: true,
			items: null,
			days: 0
		};
		this._isMounted = false;
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
		this._isMounted = true;
		setTimeout(async() => {
			let hub = this._isMounted && await this.props.state.getGame(this.props.state.server, null, {
				login: this.props.state.login || this.props.state.id,
				password: this.props.state.auth || this.props.state.id,
			}, 2);
			if (Number(hub._uid) !== 0) {
				let game = this._isMounted && await this.props.state.getGame(this.props.state.server, {
					i: 39,
					t: hub._uid,
				}, this.props.authorization);
				if (game && game.i && game.i.length) {
					let syncItems = game.i.map((data, x) => {
						return Number(data._id);
					});
					let items = [];
					for (let season of dataArena.season) {
						for (let month of season.month) {
							for (let item of month.items) {
								items.push(Items[item.id]);
							}
						}
					}
					for (let item of items) item.is = syncItems.includes(item.id);
					this._isMounted && this.setState({ items, days: Math.round(Number(game.u._bd) / 60 / 60 / 24), isLoad: false });
				} else {
					this._isMounted && this.setState({ items: null, isLoad: false });
				}
			} else {
				this._isMounted && this.setState({ items: null, isLoad: false });
			}
		}, 2000);
	};
	async componentWillUnmount () {
		this._isMounted = false;
	};
	shouldComponentUpdate(nextProps, nextState) {
		if (this.state.isLoad != nextState.isLoad) return true;
		return false;
	};
	render() {
		const { isLoad, items, days } = this.state;
		const totalItemsIs = items&&items.filter(item => item.is).length;
		const itemsNotIs = items&&items.filter(item => !item.is);
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		return (
			<ModalCard id={this.props.id}>
				{isLoad ? <Div style={{textAlign: 'center', padding: 0, display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
					<Spacing size={12} />
					<Skeleton width={150} height={30}/>
					<Spacing size={15} />
					<Skeleton width={110} height={50}/>
					<Spacing size={15} />
					<Skeleton width={100} height={25}/>
					<Spacing size={12} />
					<Skeleton width={240} height={20}/>
					<Spacing size={24} />
					<Skeleton width={260} height={25}/>
					<Spacing size={12} />
					<Spacing size={6} />
					<Skeleton height={126} borderRadius={0}/>
					<Spacing size={6} />
					<Spacing size={12} />
					<div style={{display: 'flex'}}>
						<Skeleton width={150} height={this.props.state.isDesktop ? 36 : 44} marginRight={12}/>
						<Skeleton width={64} height={this.props.state.isDesktop ? 36 : 44}/>
					</div>
					<Spacing size={12} />
				</Div> : items ? <Div style={{textAlign: 'center', padding: 0}}>
					<Spacing size={12} />
					<Text style={{fontSize: '24px', lineHeight: '1.25', fontWeight: 600, color: 'var(--text_primary)', margin: 'auto'}}>Вы получили</Text>
					<Text style={{fontSize: '64px', lineHeight: '1.25', fontWeight: 700, color: 'var(--dynamic_red)', margin: 'auto', whiteSpace: 'nowrap'}}>{totalItemsIs}</Text>
					<Text style={{fontSize: '20px', lineHeight: '1.25', fontWeight: 600, color: 'var(--dynamic_red)', margin: 'auto', marginBottom: 12}}>{this.props.options.numberForm(totalItemsIs, ['предмет', 'предмета', 'предметов'])}</Text>
					<Text style={{fontSize: '17px', fontWeight: 500, color: 'var(--text_primary)', margin: 'auto', marginBottom: 24}}>— это {Math.floor(totalItemsIs*100/items.length)}% от общего арсенала</Text>
					<Text style={{fontSize: '20px', lineHeight: '1.25', fontWeight: 600, color: 'var(--text_primary)', margin: 'auto', marginBottom: 12}}>{items.length-totalItemsIs==0?`Поздравляем!`:`Вы упустили ${items.length-totalItemsIs} ${this.props.options.numberForm(items.length-totalItemsIs, ['предмет', 'предмета', 'предметов'])}`}</Text>
					<div className="HorizontalScroll--items">
						<div>
							{new Array(5).fill().map((item, x) => <HorizontalCell size='s' key={x} disabled={true}>
								<Avatar style={{width: 67, height: 71}} mode='image' className={!itemsNotIs[x]&&'Avatar--empty'} src={itemsNotIs[x]&&`${pathImages}${itemsNotIs[x].icon}`}/>
							</HorizontalCell>)}
						</div>
						<div>
							{new Array(6).fill().map((item, x) => <HorizontalCell size='s' key={x} disabled={true}>
								<Avatar style={{width: 67, height: 71}} mode='image' className={!itemsNotIs[x+5]&&'Avatar--empty'} src={itemsNotIs[x+5]&&`${pathImages}${itemsNotIs[x+5].icon}`}/>
							</HorizontalCell>)}
						</div>
					</div>
					<Div style={{display: 'flex', justifyContent: 'center'}}>
						<Button style={{color: '#fff', backgroundColor: 'var(--dynamic_red)', marginRight: 12}} before={<Icon24ShareOutline/>} size="l" onClick={() => bridge.send("VKWebAppShowWallPostBox", {
							"message": `Я в королевстве ${['Эрмун', 'Антарес'][this.props.state.server-1]} уже ${days} дней!\nЗа это время я собрал ${totalItemsIs} из ${items.length} предметов арены. А сколько у тебя?`,
							"attachments": `photo-${['138604865_457240013', '138604865_457240014', '138604865_457240015', '138604865_457240016'][this.props.options.numberRandom(0, 3)]},https://vk.com/app7787242#promo=arenaItems`
						})}>Поделиться</Button>
						<Button mode="secondary" before={<Icon24DoneOutline/>} size="l" onClick={() => {this.props.options.Storage({key: 'promo_2', value: 'true'}); this.props.options.BackModal();}}/>
					</Div>
				</Div> : <Div style={{textAlign: 'center', padding: 0, minHeight: 438, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
					<SVG_sadFace style={{height: 150, width: 150}}/>
					<Text style={{fontSize: '24px', lineHeight: '1.25', fontWeight: 600, color: 'var(--text_primary)', width: '50%', marginBottom: 12}}>Произошла ошибка</Text>
					<Text style={{fontSize: '17px', lineHeight: '1.25', fontWeight: 500, color: 'var(--text_primary)', width: '50%', marginBottom: 12}}>Вашего профиля нет на сервере {['Эрмун', 'Антарес'][this.props.state.server-1]}</Text>
					<Button mode="tertiary" size="l" onClick={() => {this.props.options.Storage({key: 'promo_2', value: 'true'}); this.props.options.BackModal();}}><span style={{color: 'var(--dynamic_red)'}}>Закрыть</span></Button>
				</Div>}
			</ModalCard>
		);
	};
};
export default MODAL;