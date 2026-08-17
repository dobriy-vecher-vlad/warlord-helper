import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	Button,
	Avatar,
	InitialsAvatar,
	Text,
	Div
} from '@vkontakte/vkui';
import { Icon28ChevronLeftOutline, Icon28Chevrons2LeftOutline } from '@vkontakte/icons';
import { ReactComponent as SVG_sadFace } from '../../modals/sadFace.svg';
import Skeleton from '../../components/skeleton';
import TableCell from '../../components/tableCell';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			ratingPage: 0,
			rating: this.props?.currentRating?.items || null
		};
	};
	calcInitialsAvatarColor = (v) => v%6+1;
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id, this.props.currentRating);
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
		const { ratingPage } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const ratingTab = this.props.currentRating;
		const title = ratingTab ? `${ratingTab.name} (${ratingTab.subname})` : 'Не определено';
		const description = ratingTab ? `Рейтинг — ${['профили', 'гильдии'][ratingTab.tab-1]}` : 'Рейтинг — не определено';
		const avatar = 'labels/23.png';
		const grid = state.isDesktop ? {display: 'grid', alignItems: 'center', gridTemplateColumns: '40px 32px auto auto', gridGap: '8px'} : {display: 'grid', alignItems: 'center', gridTemplateColumns: '40px 32px auto auto', gridGap: '16px'};
		const count = 50;
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					{this.state?.rating?<React.Fragment>
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
										style={{color: 'var(--text_secondary)'}}
										className="TableCell__row"
									><span>{ratingTab ? ratingTab.name.toLowerCase() : 'не определено'}</span></div>
								</div>
							</div>
							<Spacing size={8} />
						</div>
						<div className="Scroll HorizontalRating" style={{maxHeight: state.isDesktop ? '392px' : 'unset', minHeight: state.isDesktop ? 'unset' : 'unset'}}>
							{this.state.rating.slice(ratingPage*count, (ratingPage+1)*count).map((user, x) => <TableCell
								key={x}
								count={options.numberSpaces(ratingPage*count+x+1, ' ')}
								href={`https://vk.com/id${user.leader?user.leader:user.id}`}
								avatar={user.avatar?<Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} size={32}/>:<InitialsAvatar gradientColor={this.calcInitialsAvatarColor(user.id)} size={32}>{user.tag}</InitialsAvatar>}
								style={grid}
								rows={[{
									title: user.name?user.name:ratingTab.tab==2?`Guild\n${user.id}`:`Player\n${user.id}`
								}, {
									title: Number.isInteger(user.title) ? options.numberSpaces(user.title, ' ') : user.title,
									right: true
								}]}
							/>)}
						</div>
						<div className='Sticky Sticky__bottom withSeparator'>
							<Spacing size={10} />
							{ratingTab.id?this.state.rating.find(user => user.id == ratingTab.id)?<div className="HorizontalRating">
								{[this.state.rating.find(user => user.id == ratingTab.id)].map((user, x) => <TableCell
									key={x}
									count={options.numberSpaces(this.state.rating.findIndex(user => user.id == ratingTab.id)+1, ' ')}
									href={`https://vk.com/id${user.leader?user.leader:user.id}`}
									style={grid}
									avatar={user.avatar?<Avatar src={`${pathImages}bot/arena/avatar_${user.avatar}.png`} size={32}/>:<InitialsAvatar gradientColor={this.calcInitialsAvatarColor(user.id)} size={32}>{user.tag}</InitialsAvatar>}
									rows={[{
										title: user.name?user.name:ratingTab.tab==2?`Guild\n${user.id}`:`Player\n${user.id}`
									}, {
										title: Number.isInteger(user.title) ? options.numberSpaces(user.title, ' ') : user.title,
										right: true
									}]}
								/>)}
							</div>:<div className="HorizontalRating" style={{height: 32, color: 'var(--text_secondary)', fontSize: '13px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: !state.isDesktop&&'75%', textAlign: 'center', margin: 'auto'}}>Авторизуйте профиль на сервере Эрмун и обновите приложение</div>:<div className="HorizontalRating" style={{height: 32, color: 'var(--text_secondary)', fontSize: '13px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: !state.isDesktop&&'75%', textAlign: 'center', margin: 'auto'}}>Авторизуйтесь для отображения {ratingTab.tab==2?'вашей гильдии':'вашего профиля'} в рейтинге</div>}
							<Spacing size={16} separator />
							<div className="TableCell">
								<div className="TableCell__content">
									<div className="TableCell__row" style={{overflow: 'hidden'}}>
										<span style={{color: 'var(--text_secondary)'}}>Показана {options.numberSpaces(ratingPage+1, ' ')} страница из {options.numberSpaces(Math.ceil(this.state.rating.length/count), ' ')}</span>
										<span style={{display: 'flex', width: !state.isDesktop&&'100%', justifyContent: 'flex-end'}}>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ ratingPage: 0 })} disabled={ratingPage<=0}><Icon28Chevrons2LeftOutline/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ ratingPage: ratingPage-1 })} disabled={ratingPage<=0}><Icon28ChevronLeftOutline/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ ratingPage: ratingPage+1 })} disabled={ratingPage>=Math.ceil(this.state.rating.length/count)-1}><Icon28ChevronLeftOutline style={{transform: 'rotate(180deg)'}}/></Button>
											<Button mode="tertiary" className="ButtonIcon" onClick={() => this.setState({ ratingPage: Math.ceil(this.state.rating.length/count)-1 })} disabled={ratingPage>=Math.ceil(this.state.rating.length/count)-1}><Icon28Chevrons2LeftOutline style={{transform: 'rotate(180deg)'}}/></Button>
										</span>
									</div>
								</div>
							</div>
							<Spacing size={2} />
						</div>
					</React.Fragment>:<Div style={{textAlign: 'center', padding: 0, minHeight: state.isDesktop?438:'calc(100vh - 57px - 48px - 8px * 2)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
						<SVG_sadFace style={{height: 150, width: 150}}/>
						<Text style={{fontSize: '24px', lineHeight: '1.25', fontWeight: 600, color: 'var(--text_primary)', width: state.isDesktop?'50%':'75%', marginBottom: 12}}>Произошла ошибка</Text>
						<Text style={{fontSize: '17px', lineHeight: '1.25', fontWeight: 500, color: 'var(--text_primary)', width: state.isDesktop?'50%':'75%', marginBottom: 12}}>Отсутствуют данные для построения рейтинга</Text>
						<Button mode="tertiary" size="l" onClick={() => this.props.options.setActivePanel(parent)}><span style={{color: 'var(--dynamic_red)'}}>Вернуться назад</span></Button>
					</Div>}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;