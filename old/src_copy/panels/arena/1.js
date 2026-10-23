import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	InfoRow,
	FormItem,
	Slider,
	Input,
	CardScroll
} from '@vkontakte/vkui';
import { Icon20MoneyCircleOutline, Icon20SkullOutline, Icon20StatisticsOutline } from '@vkontakte/icons';

import dataArena from '../../data/arena.json';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			currentCups: 200,
			finalCups: 200
		};
	};
	getFightPrice = (from, to) => {
		let number = 0;
		let response = from;
		for (let x = 0; x < Math.ceil((to-from)/19); x++) {
			if (response >= dataArena.league[0].from && response < dataArena.league[0].to) {
				number += dataArena.league[0].price;
				response += 19;
			} else if (response >= dataArena.league[1].from && response < dataArena.league[1].to) {
				number += dataArena.league[1].price;
				response += 19;
			} else if (response >= dataArena.league[2].from && response < dataArena.league[2].to) {
				number += dataArena.league[2].price;
				response += 19;
			} else if (response >= dataArena.league[3].from && response < dataArena.league[3].to) {
				number += dataArena.league[3].price;
				response += 19;
			} else if (response >= dataArena.league[4].from && response < dataArena.league[4].to) {
				number += dataArena.league[4].price;
				response += 19;
			} else if (response >= dataArena.league[5].from && response < dataArena.league[5].to) {
				number += dataArena.league[5].price;
				response += 19;
			} else if (response >= dataArena.league[6].from && response < dataArena.league[6].to) {
				number += dataArena.league[6].price;
				response += 19;
			} else if (response >= dataArena.league[7].from && response < dataArena.league[7].to) {
				number += dataArena.league[7].price;
				response += 19;
			} else if (response >= dataArena.league[8].from) {
				number += dataArena.league[8].price;
				response += 19;
			}
		}
		return number;
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
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
		const title = 'Калькулятор';
		const description = 'Арена';
		const avatar = 'labels/8.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>На арене идёт состязание двух игроков с примерно одинаковыми характеристиками<br/>В качестве награды за победу игрок получает: случайный сундук, 19 кубков и опыт</React.Fragment>)}
						<Spacing size={8} />
					</div>
					<CardGrid size="m">
						<Card style={{backgroundColor: "transparent"}}>
							<FormItem top="Текущее количество кубков">
								<Slider
									step={1}
									min={0}
									max={10000}
									value={Number(this.state.currentCups)}
									onChange={currentCups => this.setState({currentCups})}
								/>
							</FormItem>
							<FormItem>
								<Input value={String(this.state.currentCups)} min={0} onChange={(e) => this.setState({ currentCups: e.target.value })} type="number"/>
							</FormItem>
						</Card>
						<Card style={{backgroundColor: "transparent"}}>
							<FormItem top="Конечное количество кубков">
								<Slider
									step={1}
									min={0}
									max={10000}
									value={Number(this.state.finalCups)}
									onChange={finalCups => this.setState({finalCups})}
								/>
							</FormItem>
							<FormItem>
								<Input value={String(this.state.finalCups)} min={0} onChange={(e) => this.setState({ finalCups: e.target.value })} type="number"/>
							</FormItem>
						</Card>
					</CardGrid>
					<div style={{margin: state.isDesktop ? '-7px' : 0}}>
						<CardScroll>
							<Card className="beautifulCard" mode="outline">
								<InfoRow header="Победные бои"><span>{options.numberSpaces(Math.ceil((this.state.finalCups-this.state.currentCups)/19))} шт.</span></InfoRow>
								<Icon20SkullOutline style={{['--fill']: 'var(--systemRed)' }}/>
							</Card>
							<Card className="beautifulCard" mode="outline">
								<InfoRow header="Кубки"><span>{options.numberSpaces(Math.ceil((this.state.finalCups-this.state.currentCups)/19)*19)} ед.</span></InfoRow>
								<Icon20StatisticsOutline style={{['--fill']: 'var(--systemYellow)' }}/>
							</Card>
							<Card className="beautifulCard" mode="outline">
								<InfoRow header="Золото"><span>{options.numberSpaces(this.getFightPrice(this.state.currentCups, this.state.finalCups))} ед.</span></InfoRow>
								<Icon20MoneyCircleOutline style={{['--fill']: 'var(--systemOrange)' }}/>
							</Card>
						</CardScroll>
					</div>
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;