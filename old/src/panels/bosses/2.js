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

import Bosses from '../../data/bosses.json';
import dataBosses from '../../data/boss.json';

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
		const title = 'Список боссов';
		const description = 'Боссы';
		const avatar = 'labels/29.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Всего в игре {dataBosses.bosses.map((item) => item.mobs.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)} {options.numberForm(dataBosses.bosses.map((item) => item.mobs.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y), ['босс', 'босса', 'боссов'])}, которые делятся на временных, общих, одиночных, рейдовых и уникальных<br/>Каждый босс имеет свой лимит побед и стоимость нападения</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataBosses.bosses.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header indicator={<Counter size="s" mode="prominent">{data.mobs.length}</Counter>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.mobs.map((data, y) => {
									let boss = {};
									Object.assign(boss, Bosses.find(item => item.id === data.id), data);
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (boss.modal = Number((x+1)+""+(y+1)), boss), 9)}>
										<HorizontalCell size='m' header={boss.name} subtitle={boss.description}>
											<Spinner size="regular" className="Horizontal__imagePreload" />
											<Avatar size={88} mode='app' style={{
												background: `url(${pathImages}${boss.image}) top left 25%/cover no-repeat, url(${pathImages}${boss.background}) center/cover`
											}}/>
										</HorizontalCell>
									</Card>
								})}
							</CardScroll>
						</div>
					)}
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