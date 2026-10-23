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
	Counter,
	CardScroll
} from '@vkontakte/vkui';

import dataCharacter from '../../data/character.json';

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
		const title = 'Достижения';
		const description = 'Персонаж';
		const avatar = 'labels/13.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Почти каждое достижние имеет 10 стадий, которых {dataCharacter.achievements.map((item) => item.items.map(() => 1).reduce((x, y) => x + y)).reduce((x, y) => x + y)} в игре<br/>За каждую стадию достижения игрок получает награду в виде 1 рубина</React.Fragment>)}
						<Spacing size={8} />
					</div>
					{dataCharacter.achievements.map((data, x) =>
						<div className="Horizontal__cellsWrap" key={x}>
							{x!=0&&<Spacing separator size={16} />}
							<Header indicator={<Counter size="s" mode="prominent">{data.items.length}</Counter>}>{data.title}</Header>
							<CardScroll size="s" className="Horizontal__Cells">
								{data.items.map((data, y) => {
									return <Card key={y} id={`modal_${x+1}${y+1}`} onClick={() => options.OpenModal(`description`, (data.modal = Number((x+1)+""+(y+1)), data), 14)}>
										<HorizontalCell size='m' header={data.name} subtitle={data.description}>
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