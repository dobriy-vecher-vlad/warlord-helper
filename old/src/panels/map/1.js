import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid
} from '@vkontakte/vkui';

import Items from '../../data/items.json';
import dataMap from '../../data/map.json';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null
		};
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
		const title = 'Мустафа';
		const description = 'Карта';
		const avatar = 'labels/1.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Мустафа продаёт различные товары, начиная от ресурсов, заканчивая элементами коллекций<br/>Список товаров обновляется каждые 8 часов</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataMap.shop && <CardGrid size={state.isDesktop ? "m" : "l"}>
						{dataMap.shop.map((data, x) => {
							return options.getItemPreview(Items[data.id], x, null, data.tooltip == 'Предмет' ? true : false, data.tooltip == 'Коллекция' ? true : false);
						})}
					</CardGrid>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;