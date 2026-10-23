import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	HorizontalCell,
	Spinner,
	Avatar
} from '@vkontakte/vkui';

import Items from '../../data/items.json';
import dataOther from '../../data/other.json';
import dataGuild from '../../data/guild.json';

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
		const title = 'Кузница';
		const description = 'Гильдия';
		const avatar = 'labels/20.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Аметисты и Топазы можно получить только вкладываясь в улучшения навыков и при пополнении казны<br/>Заточки можно купить после покупки самого предмета</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataGuild.items && <CardGrid size={state.isDesktop ? "m" : "l"}>
						{dataGuild.items.map((data, x) => {
							return options.getItemPreview(Items[data.id], x, `Cтаж от ${data.days} ${options.numberForm(data.days, ['день', 'дней', 'дней'])}`, 'enable', false, false, () => options.OpenModal(`description`, (data.modal = x+1, data), 20));
						})}
					</CardGrid>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;