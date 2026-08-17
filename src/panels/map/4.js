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
		const title = 'Рейды';
		const description = 'Карта';
		const avatar = 'labels/4.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Рейды доступны с 40 уровня и в день возможно войти в рейд не более 3 раз<br/>Чтобы открыть новый режим сложности, требуется убить финального босса на предыдущем режиме</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataMap.raids.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header aside={<Link href={data.map} target="_blank">Открыть карту <Icon12ChevronOutline/></Link>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.levels.map((data, y) => {
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 4)}>
										<HorizontalCell size='m' header={data.title} subtitle={data.description}>
											<Spinner size="regular" className="Horizontal__imagePreload" />
											<Avatar size={88} mode='app' src={`${pathImages}${data.icon}`}/>
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