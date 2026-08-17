import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	Card,
	HorizontalCell,
	Spinner,
	Avatar,
	Header,
	CardScroll,
	Counter
} from '@vkontakte/vkui';

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
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Районы';
		const description = 'Карта';
		const avatar = 'labels/6.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Районы это главная часть всей игры, всего их {dataMap.regions.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)}<br/>Каждый район имеет внутри себя босса и по возможности постройку</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataMap.regions.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header indicator={<Counter size="s" mode="prominent">{data.items.length}</Counter>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.items.map((data, y) => {
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 7)}>
										<HorizontalCell size='m' header={data.title} subtitle={data.description}>
											{data.builds.length?<span className="Horizontal__imageTitle">{`${data.builds.length} ${options.numberForm(data.builds.length, ['здание', 'здания', 'зданий'])}`}</span>:''}
											{data.bosses.length?<span className="Horizontal__imageTitle">{`${data.bosses.length} ${options.numberForm(data.bosses.length, ['босс', 'босса', 'боссов'])}`}</span>:''}
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