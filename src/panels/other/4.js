import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid
} from '@vkontakte/vkui';

import Items from '../../data/items.json';
import dataOther from '../../data/other.json';

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
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Обыск друзей';
		const description = 'Разное';
		const avatar = 'labels/30.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Ежедневно к обыску доступно 15 друзей<br/>При обыске можно найти различные ресурсы, а также элементы коллекций</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataOther.search && <CardGrid size={state.isDesktop ? "m" : "l"}>
						{dataOther.search.map((data, x) => {
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