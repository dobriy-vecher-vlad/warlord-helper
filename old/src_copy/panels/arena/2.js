import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	HorizontalCell,
	Spinner,
	Avatar,
	Header,
	CardScroll,
	Counter
} from '@vkontakte/vkui';

import Items from '../../data/items.json';
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
		const title = 'Сезоны';
		const description = 'Арена';
		const avatar = 'labels/9.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Ежемесячно в игру поступают 2 новых предмета экипировки, которые доступны в качестве награды за арену<br/>Чем выше лига - тем лучше и больше награда с ежемесячного сундука</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataArena.season.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header indicator={<Counter size="s" mode="prominent">{data.month.length}</Counter>}>{data.name}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.month.map((data, y) => {
									data.items.sort((a, b) => a.id < b.id ? -1 : 1);
									let hp = data.items.map(item => Items[item.id].hp).reduce((x, y) => x + y)*15;
									let dmg = data.items.map(item => Items[item.id].dmg).reduce((x, y) => x + y);
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 10)}>
										<HorizontalCell size='m' header={data.name} subtitle={`${Items[data.items[0].id].title} и ${Items[data.items[1].id].title}`}>
											{dmg?<span className="Horizontal__imageTitle">{`DMG ${options.numberSpaces(dmg)}`}</span>:null}
											{hp?<span className="Horizontal__imageTitle">{`HP ${options.numberSpaces(hp)}`}</span>:null}
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