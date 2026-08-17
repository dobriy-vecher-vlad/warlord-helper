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
	Link
} from '@vkontakte/vkui';

import dataMap from '../../data/map.json';
import dataArena from '../../data/arena.json';
import { Icon12ChevronOutline } from '@vkontakte/icons';

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
		const title = 'Приключения';
		const description = 'Карта';
		const avatar = 'labels/5.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Приключения доступны с 30 уровня и в день возможно войти в приключения не более 8 раз<br/>После прохождения всех этажей, открывается возможность получать заточки за каждый бой</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataMap.adventures.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header aside={<Link id={`modal_${x+1}`} onClick={() => options.OpenModal(`description`, (data.scrolls.modal = x+1, 
								{...data.scrolls, 
									items: [
										data.floors.map(data => 
											data.items.map(item => 
												({id: item.id, scroll: true})
											)[0]
										)
									][0].concat(dataArena.season.map(season => 
										season.month.map(month => 
											month.items.map(item => 
												({id: item.id, scroll: true})
											)
										)
									).flat(2))
								}
							), 6)}>Посмотреть заточки <Icon12ChevronOutline/></Link>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.floors.map((data, y) => {
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 5)}>
										<HorizontalCell size='m' header={data.title} subtitle={`Враги от ${options.numberSpaces(data.guards[0])} HP`}>
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