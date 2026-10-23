import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	Header,
	CardScroll,
	HorizontalCell,
	Spinner,
	Avatar,
	Card,
	Counter
} from '@vkontakte/vkui';

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
		const title = 'События';
		const description = 'Разное';
		const avatar = 'labels/28.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Ивенты это уникальные события, которые запускаются во время крупных праздников<br/>Участие в ивенте доступно для каждого игрока, и не требует никаких затрат</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataOther.events.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header indicator={<Counter size="s" mode="prominent">{data.items.length}</Counter>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.items.map((data, y) => {
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 24)}>
										<HorizontalCell size='m' header={data.name} subtitle={data.date}>
											<Spinner size="regular" className="Horizontal__imagePreload" />
											<Avatar size={88} mode='app' src={`${pathImages}${data.icon}`}/>
										</HorizontalCell>
									</Card>
								})}
							</CardScroll>
						</div>
					)}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;