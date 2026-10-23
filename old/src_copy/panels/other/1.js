import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Banner,
	Card,
	Cell,
	Avatar,
	Select,
	CustomSelectOption
} from '@vkontakte/vkui';
import Skeleton from '../../components/skeleton';

import Items from '../../data/items.json';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			itemId: 0,
			item: null
		};
	};
	getEnchStat = (number) => {
		const multiplier = [0.10, 0.15, 0.20, 0.25, 0.30, 0.10, 0.15, 0.20, 0.25, 0.30];
		let result = {
			default: number,
			bonus: [],
			total: [number]
		};
		multiplier.map((item, x) => {
			result.bonus.push(Math.ceil(number * item));
			result.total.push(Math.ceil(result.total[x] + number * item));
		});
		result.total.shift();
		return result;	
	};
	getEnchStats = async(item) => {
		let result = Object.assign({}, item);
		result.dmg = await this.getEnchStat(item.dmg);
		result.hp = await this.getEnchStat(item.hp);
		return result;	
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		this.setState({ item: await this.getEnchStats(Items[this.state.itemId]) });
	};
	async componentDidUpdate() {
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent } = this.props;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Калькулятор';
		const description = 'Разное';
		const avatar = 'labels/26.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Первые пять уровней предмет улучшается за свою валюту из магазина<br/>Легендарные уровни предмета улучшаются за редкие жемчужины</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{this.state.item?<Banner
						className="BannerBoss"
						mode="image"
						size="m"
						header={this.state.item.title}
						subheader={this.state.item.description}
						actions={
							<CardGrid size="m">
								{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, x) => 
									<Card key={x}><Cell className="withAvatar" before={<Avatar size={24} mode="app">{x+1}</Avatar>} description={
										<React.Fragment>
											<span style={{color: 'var(--dynamic_red)', fontWeight: 500}}>{options.numberSpaces(this.state.item.dmg.total[x])} [+{options.numberSpaces(this.state.item.dmg.total[x]-this.state.item.dmg.default)}]</span><br/>
											<span style={{color: 'var(--dynamic_green)', fontWeight: 500}}>{options.numberSpaces(this.state.item.hp.total[x])} [+{options.numberSpaces(this.state.item.hp.total[x]-this.state.item.hp.default)}]</span>
										</React.Fragment>
									}/></Card>
								)}
							</CardGrid>
						}
						background={
							<React.Fragment>
								<img className="BannerBossItem" src={`${pathImages}items/${this.state.item.id}b.png`}/>
								<div className="BannerBossBackground" style={{backgroundImage: `url(${pathImages}bosses/backgrounds/20.png)`}}/>
							</React.Fragment>
						}
					/>:<Skeleton height="418px"/>}
					<div className='Sticky Sticky__bottom withSeparator'>
						<Spacing size={8} />
						<CardGrid size="l">
							<Select
								value={this.state.itemId}
								searchable={true}
								style={{width: '100%'}}
								onChange={(e) => this.setState({ itemId: Number(e.target.value) }, async() => this.setState({ item: await this.getEnchStats(Items[this.state.itemId]) }))}
								placeholder="Не выбран"
								options={Items.map((item, x) => ({ label: item.title, description: item.description, value: x, avatar: `${pathImages}${item.icon}` }))}
								renderOption={({ option, ...restProps }) => (
									<CustomSelectOption {...restProps} before={<Avatar size={24} src={option.avatar} />} description={option.description} />
								)}
							/>
						</CardGrid>
					</div>
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;