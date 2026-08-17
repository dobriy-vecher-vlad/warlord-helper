import React from 'react';
import {
	Panel,
	Group,
	Avatar,
	Button,
	Spacing,
	Placeholder
} from '@vkontakte/vkui';
import { Icon56DonateOutline } from '@vkontakte/icons';
import TableCell from '../../components/tableCell';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			donutsPage: 0,
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
		let dataDonutUser = this.props.dataDonutUser.response.items.map(user => {
			if (this.props.dataDonutUser.response.items.filter(item => item.id == user.id)[0] == user) {
				user.fromDonut = false;
				user.fromService = false;
				if (this.props.dataDonutUser.response.items.filter(item => item.id == user.id).length == 2) {
					user.fromDonut = true;
					user.fromService = true;
				}
				if (user.hasOwnProperty('sex')) {
					user.fromService = true;
				} else {
					user.fromDonut = true;
				}
				return user;
			}
		}).filter(user => user).sort(function(a, b) {
			let itemA = (a.fromDonut && a.fromService) ? 1 : a.fromService ? 2 : 3;
			let itemB = (b.fromDonut && b.fromService) ? 1 : b.fromService ? 2 : 3;
			return itemA < itemB ? -1 : 1;
		});
		const { donutsPage } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Доны';
		const description = 'Мой профиль';
		const avatar = 'labels/28.png';
		const grid = state.isDesktop ? {display: 'grid', alignItems: 'center', gridTemplateColumns: '32px 32px 30% calc(75% - 30% - 32px - 32px) auto', gridGap: '8px'} : {display: 'grid', alignItems: 'center', gridTemplateColumns: '32px 32px 30% auto', gridGap: '16px'};
		const count = dataDonutUser.length;
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					{dataDonutUser.length?<React.Fragment>
						<div className='Sticky Sticky__top withSeparator'>
							{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
							<div className="TableCell HorizontalRating">
								<div className="TableCell__content" style={grid}>
									<div
										style={{color: 'var(--text_secondary)'}}
										className="TableCell__row"
									><span>#</span></div>
									<div style={{height: 32}}/>
									<div
										style={{color: 'var(--text_secondary)'}}
										className="TableCell__row"
									><span>имя</span></div>
									<div
										style={{color: 'var(--text_secondary)', justifyContent: 'flex-end'}}
										className="TableCell__row"
									><span>подписка</span></div>
									<div
										style={{color: 'var(--text_secondary)', justifyContent: 'flex-end'}}
										className="TableCell__row"
									><span>id</span></div>
								</div>
							</div>
							<Spacing size={8} />
						</div>
						<div className="Scroll HorizontalRating" style={{maxHeight: state.isDesktop ? '392px' : 'unset', minHeight: state.isDesktop ? 'unset' : 'unset'}}>
							{dataDonutUser.slice(donutsPage*count, (donutsPage+1)*count).map((data, x) => <TableCell
								key={x}
								count={options.numberSpaces(donutsPage*count+x+1, ' ')}
								href={`https://vk.com/id${data.id}`}
								style={grid}
								avatar={<Avatar size={32} src={data.photo_200} />}
								rows={state.isDesktop?[{
									title: `${data.first_name} ${data.last_name}`
								}, {
									title: `${data.fromDonut?'стандартная':''}${data.fromDonut&&data.fromService?' + ':''}${data.fromService?'системная':''}`,
									right: true
								}, {
									title: data.id,
									right: true
								}]:[{
									title: `${data.first_name} ${data.last_name}`
								}, {
									title: `${data.fromDonut?'стандартная':''}${data.fromDonut&&data.fromService?' + ':''}${data.fromService?'системная':''}`,
									right: true
								}]}
							/>)}
						</div>
					</React.Fragment>:<Placeholder action={<Button href="https://vk.com/donut/wiki.warlord" target="_blank" size="m" mode="commerce">Узнать подробнее</Button>} icon={<Icon56DonateOutline width="56" height="56" style={{color: '#ffae26'}} />} header="VK Donut">Донов пока нет,<br/>но ты можешь быть первым</Placeholder>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;