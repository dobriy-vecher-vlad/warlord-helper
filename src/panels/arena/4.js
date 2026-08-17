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

import dataArena from '../../data/arena.json';

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
		const title = 'Сундуки';
		const description = 'Арена';
		const avatar = 'labels/11.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Из сундуков могут выпасть предметы, заточки, а также ценные ресурсы<br/>Трофейные сундуки могут выпасть только с противника, который состоит в гильдии</React.Fragment>)}
						<Spacing size={8} />
					</div>
					<CardGrid size="s" className={`Horizontal__Cells ${state.isDesktop&&"size-x4 auto"}`}>
						{dataArena.chest.map((data, x) =>
							<Card key={x} id={`modal_${x+1}`} onClick={() => options.OpenModal(`description`, (data.modal = x+1, data), 12)}>
								<HorizontalCell size='m' header={data.title} subtitle={data.description}>
									<span className="Horizontal__imageTitle">{options.getTime(data.time)}</span>
									<Spinner size="regular" className="Horizontal__imagePreload" />
									<Avatar size={88} mode='app' src={`${pathImages}${data.icon}`}/>
								</HorizontalCell>
							</Card>
						)}
					</CardGrid>
					<div className='Sticky Sticky__bottom withSeparator'>
						<Spacing size={8} />
						{options.SortableItems()}
					</div>
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;