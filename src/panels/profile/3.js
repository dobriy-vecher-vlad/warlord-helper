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
	CardScroll,
	Gradient
} from '@vkontakte/vkui';
import InfiniteScroll from "react-infinite-scroll-component";
import { Icon28CoinsOutline, Icon28DiamondOutline, Icon28GiftOutline, Icon28StatisticsOutline } from '@vkontakte/icons';

import Items from '../../data/items.json';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			tabs: 1,
			mode: { yesStock: true, noStock: true },
			items: this.props.syncItems,
			currentItems: null,
			allItems: null,
			stats: [0, 0, 0, 0, 0, 0]
		};
		this.Scroll = React.createRef();
	};
	async updateItems() {
		if (this.Scroll && this.Scroll.current) this.Scroll.current.scrollTo({ top: 0 });
		if (!this.props.state.isDesktop) document.querySelector('html').scrollTo({ top: 0 });
		let allItems = this.state.tabs == 1 ? Items : Items.filter(item => item.type == this.state.tabs);
		for (let item of allItems) {
			let find = this.state.items.find(i => i.id == item.id);
			if (find) {
				item.bought = true;
				item.lvl = find.lvl;
				item.bonus = find.bonus;
				item.stones = find.stones;
			} else {
				item.bought = false;
			}
		}
		allItems = allItems.filter(item => item.bought == true);
		allItems.sort(function(a, b) {
			if (b.lvl < a.lvl) return -1;
			if (b.lvl > a.lvl) return 1;
			if (b.bonus[0]+b.bonus[1]+b.bonus[2]*15 < a.bonus[0]+a.bonus[1]+a.bonus[2]*15) return -1;
			if (b.bonus[0]+b.bonus[1]+b.bonus[2]*15 > a.bonus[0]+a.bonus[1]+a.bonus[2]*15) return 1;
		});
		this.setState({ currentItems: allItems.slice(0, 24), allItems, stats: [
			allItems.length,
			allItems.length&&allItems.map(item => item.stones.map((stone) => stone[0] == 0 ? 0 : 1).reduce((x, y) => x + y)).reduce((x, y) => x + y),
			allItems.length&&allItems.map(item => item.lvl).reduce((x, y) => x + y),
			allItems.length&&allItems.map(item => item.bonus[0]).reduce((x, y) => x + y),
			allItems.length&&allItems.map(item => item.bonus[2]).reduce((x, y) => x + y),
			allItems.length&&allItems.map(item => item.bonus[1]).reduce((x, y) => x + y)
		] });
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
	}
	render() {
		const { state, options, parent } = this.props;
		const { currentItems, allItems, stats } = this.state;
		const pathImages = 'https://dobriy-vecher-vlad.github.io/warlord-helper/media/images/';
		const title = '??????????????????????';
		const description = '?????? ??????????????';
		const avatar = 'labels/31.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						<Tabs mode="default">
							<HorizontalScroll getScrollToLeft={i => i - 240} getScrollToRight={i => i + 240}>
								<TabsItem onClick={() => this.setState({ tabs: 1 }, this.updateItems)} selected={this.state.tabs === 1}>??????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 2 }, this.updateItems)} selected={this.state.tabs === 2}>????????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 4 }, this.updateItems)} selected={this.state.tabs === 4}>??????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 3 }, this.updateItems)} selected={this.state.tabs === 3}>??????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 12 }, this.updateItems)} selected={this.state.tabs === 12}>????????????????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 6 }, this.updateItems)} selected={this.state.tabs === 6}>????????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 14 }, this.updateItems)} selected={this.state.tabs === 14}>????????????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 5 }, this.updateItems)} selected={this.state.tabs === 5}>??????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 13 }, this.updateItems)} selected={this.state.tabs === 13}>??????????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 15 }, this.updateItems)} selected={this.state.tabs === 15}>????????</TabsItem>
								<TabsItem onClick={() => this.setState({ tabs: 16 }, this.updateItems)} selected={this.state.tabs === 16}>??????????????????</TabsItem>
							</HorizontalScroll>
						</Tabs>
						<Spacing size={8} style={{padding: 0, marginTop: !state.isDesktop ? '-8px' : ''}}/>
						<Gradient style={{margin: state.isDesktop ? '-7px -7px 0 -7px' : 0}}>
							<CardScroll>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`${options.numberForm(stats[0], ['??????????????', '??????????????', '??????????????'])}`}><span>{options.numberSpaces(stats[0])} {options.numberForm(stats[0], ['????????', '????????', '??????????'])}</span></InfoRow>
									<Icon28CoinsOutline style={{['--fill']: 'var(--systemOrange)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`${options.numberForm(stats[1], ['????????????????', '??????????????????', '??????????????????'])}`}><span>{options.numberSpaces(stats[1])} {options.numberForm(stats[1], ['????????????', '??????????', '????????????'])}</span></InfoRow>
									<Icon28DiamondOutline style={{['--fill']: 'var(--systemRed)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`${options.numberForm(stats[2], ['??????????????', '????????????????', '????????????????'])}`}><span>{options.numberSpaces(stats[2])} {options.numberForm(stats[2], ['??????????????', '????????????', '??????????????'])}</span></InfoRow>
									<Icon28StatisticsOutline style={{['--fill']: 'var(--systemBlue)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`?????????? ???? ????????????`}><span>{options.numberSpaces(stats[3])} {options.numberForm(stats[3], ['????????', '??????????', '??????????'])}</span></InfoRow>
									<Icon28GiftOutline style={{['--fill']: 'var(--systemGreen)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`?????????? ???? ????????????`}><span>{options.numberSpaces(stats[4]*15)} {options.numberForm(stats[4]*15, ['????????????????', '????????????????', '????????????????'])}</span></InfoRow>
									<Icon28GiftOutline style={{['--fill']: 'var(--systemGreen)' }}/>
								</Card>
								<Card className="beautifulCard" mode="outline">
									<InfoRow header={`?????????? ???? ????????????`}><span>{options.numberSpaces(stats[5])} {options.numberForm(stats[5], ['??????????????', '??????????????', '??????????????'])}</span></InfoRow>
									<Icon28GiftOutline style={{['--fill']: 'var(--systemGreen)' }}/>
								</Card>
							</CardScroll>
						</Gradient>
					</div>
					{currentItems && currentItems.length > 0 ? <div ref={this.Scroll} className="Scroll" id="Scroll" style={{maxHeight: state.isDesktop ? '420px' : 'unset'}}>
						<InfiniteScroll
							dataLength={currentItems.length}
							next={() => this.setState((state) => ({
								currentItems: state.currentItems.concat(allItems.slice(state.currentItems.length, state.currentItems.length+24))
							}))}
							hasMore={allItems.length > currentItems.length}
							loader={<Spinner size="regular" style={{ margin: '20px 0' }} />}
							scrollableTarget={state.isDesktop?"Scroll":false}
						><CardGrid size={state.isDesktop ? "s" : "m"}>
							{currentItems.map((data, x) => options.getItemPreview(data, x, true, false, false, true))}
						</CardGrid></InfiniteScroll>
					</div>:<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="?????? ??????????????????"></Cell>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;