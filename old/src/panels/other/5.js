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
		const title = 'Новые предметы';
		const description = 'Разное';
		const avatar = 'labels/20.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>В игру регулярно поступают новые предметы, этот раздел отображает последние добавленные предметы и указывает их наличие у вас</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataOther.new && <CardGrid size={state.isDesktop ? "m" : "l"}>
						{dataOther.new.map((data, x) => {
							return options.getItemPreview(Items[data], x);
						})}
					</CardGrid>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;