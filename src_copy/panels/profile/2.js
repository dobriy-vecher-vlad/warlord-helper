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
	InfoRow,
	Spinner,
	Gradient,
	CardScroll
} from '@vkontakte/vkui';
import InfiniteScroll from "react-infinite-scroll-component";
import { Icon28CancelCircleOutline, Icon28CheckCircleOutline, Icon28FavoriteOutline } from '@vkontakte/icons';

import Items from '../../data/items.json';
import Collections from '../../data/collections.json';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			tabs: 1,
			mode: { yesStock: true, noStock: true },
			items: this.props.syncItems || [],
			currentItems: null,
			allItems: null,
			hasItems: 0,
			missingItems: 0
		};
		this.Scroll = React.createRef();
	};
	async updateItems() {
		if (this.Scroll && this.Scroll.current) this.Scroll.current.scrollTo({ top: 0 });
		if (!this.props.state.isDesktop) document.querySelector('html').scrollTo({ top: 0 });
		let allItems = this.state.tabs == 1 ? Items.filter(item => Collections.items.indexOf(item.id) == -1 ? false : true) : Items.filter(item => Collections.items.indexOf(item.id) == -1 ? false : true).filter(item => item.type == this.state.tabs);
		for (let item of allItems) {
			item.bought = this.state.items.indexOf(item.id) == -1 ? false : true;
		}
		const hasItems = allItems.filter(item => item.bought == true).length;
		const missingItems = allItems.filter(item => item.bought == false).length;
		if (!this.state.mode.yesStock) {
			allItems = allItems.filter(item => item.bought == false);
		}
		if (!this.state.mode.noStock) {
			allItems = allItems.filter(item => item.bought == true);
		}
		this.setState({ currentItems: allItems.slice(0, 30), allItems, hasItems, missingItems });
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		await this.updateItems();
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
		const { currentItems, allItems, hasItems, missingItems } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Коллекции';
		const description = 'Мой профиль';
		const avatar = 'labels/20.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						<Tabs mode="default">
							<HorizontalScroll getScrollToLeft={i => i - 240} getScrollToRight={i => i + 240}>
								<TabsItem onClick={() => this.setState({ tabs: 1 }, this.updateItems)} selected={this.state.tabs === 1}>Все</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 2 }, this.updateItems)} selected={this.state.tabs === 2}>Оружие</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 4 }, this.updateItems)} selected={this.state.tabs === 4}>Шлемы</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 3 }, this.updateItems)} selected={this.state.tabs === 3}>Броня</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 12 }, this.updateItems)} selected={this.state.tabs === 12}>Наплечники</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 6 }, this.updateItems)} selected={this.state.tabs === 6}>Наручи</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 14 }, this.updateItems)} selected={this.state.tabs === 14}>Перчатки</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 5 }, this.updateItems)} selected={this.state.tabs === 5}>Штаны</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 13 }, this.updateItems)} selected={this.state.tabs === 13}>Ботинки</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 15 }, this.updateItems)} selected={this.state.tabs === 15}>Щиты</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 16 }, this.updateItems)} selected={this.state.tabs === 16}>Бижутерия</TabsItem>
							</HorizontalScroll>
						</Tabs>
						<Spacing size={8} style={{padding: 0, marginTop: !state.isDesktop ? '-8px' : ''}}/>
						<Gradient style={{margin: state.isDesktop ? '-7px -7px 0 -7px' : 0}}>
							<CardScroll>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`всего`}><span>{hasItems+missingItems} {options.numberForm(hasItems+missingItems, ['коллекция', 'коллекции', 'коллекций'])}</span></InfoRow>
									<Icon28FavoriteOutline style={{['--fill']: 'var(--systemOrange)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`${options.numberForm(hasItems, ['собрана', 'собраны', 'собрано'])}`}><span>{hasItems} {options.numberForm(hasItems, ['коллекция', 'коллекции', 'коллекций'])}</span></InfoRow>
									<Icon28CheckCircleOutline style={{['--fill']: 'var(--systemGreen)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`не ${options.numberForm(missingItems, ['собрана', 'собраны', 'собрано'])}`}><span>{missingItems} {options.numberForm(missingItems, ['коллекция', 'коллекции', 'коллекций'])}</span></InfoRow>
									<Icon28CancelCircleOutline style={{['--fill']: 'var(--systemRed)' }}/>
								</Card>
							</CardScroll>
						</Gradient>
					</div>
					{currentItems && currentItems.length > 0 ? <div ref={this.Scroll} className="Scroll" id="Scroll" style={{maxHeight: state.isDesktop ? '372px' : 'unset'}}>
						<InfiniteScroll
							dataLength={currentItems.length}
							next={() => this.setState((state) => ({
								currentItems: state.currentItems.concat(allItems.slice(state.currentItems.length, state.currentItems.length+30))
							}))}
							hasMore={allItems.length > currentItems.length}
							loader={<Spinner size="regular" style={{ margin: '20px 0' }} />}
							scrollableTarget={state.isDesktop?"Scroll":false}
						><CardGrid size={state.isDesktop ? "s" : "m"}>
							{currentItems.map((data, x) => options.getItemPreview(data, x, false, true, false))}
						</CardGrid></InfiniteScroll>
					</div>:<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>}
					<div className='Sticky Sticky__bottom withSeparator'>
						<Spacing size={8} />
						<CardGrid size="m">
							<Card className="DescriptionCardWiki">
								<Cell mode="selectable" checked={this.state.mode.yesStock} after={<Icon28CheckCircleOutline width={24} height={24} style={{color: this.state.mode.yesStock ? 'var(--dynamic_green)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) => this.setState({ mode: { ...this.state.mode, yesStock: e.target.checked } }, this.updateItems)}>Собранные предметы</Cell>
							</Card>
							<Card className="DescriptionCardWiki">
								<Cell mode="selectable" checked={this.state.mode.noStock} after={<Icon28CancelCircleOutline width={24} height={24} style={{color: this.state.mode.noStock ? 'var(--destructive)' : 'var(--icon_secondary)'}}/>} description="Отображение в списке" onChange={(e) =>this.setState({ mode: { ...this.state.mode, noStock: e.target.checked } }, this.updateItems)}>Не собранные предметы</Cell>
							</Card>
						</CardGrid>
					</div>
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;