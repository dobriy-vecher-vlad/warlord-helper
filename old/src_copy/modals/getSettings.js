import React from 'react';
import {
	Spacing,
	SimpleCell,
	Div,
	ModalPageHeader,
	PanelHeaderButton,
	Button,
	ModalPage,
	FormStatus
} from '@vkontakte/vkui';
import {
	Icon24Dismiss,
	Icon28FaceIdOutline,
	Icon28GlobeOutline,
	Icon28KeySquareOutline,
	Icon28WriteSquareOutline
} from '@vkontakte/icons';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isDelete: false
		};
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
	};
	shouldComponentUpdate(nextProps, nextState) {
		if (nextState && nextState.isDelete) return true;
		return false;
	};
	render() {
		const { setState, state, options, data, isDonut } = this.props;
		return (
			<ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalPageHeader after={!state.isDesktop&&<PanelHeaderButton aria-label="back" onClick={() => options.BackModal()}><Icon24Dismiss/></PanelHeaderButton>}>{data.mode == 'add' ? 'Новый профиль' : 'Настройки'}</ModalPageHeader>}
			>
				<Div style={{ padding: state.isDesktop ? 12 : '12px 0 0 0' }}>
					{data.header&&data.subheader&&<React.Fragment>
						<FormStatus style={{margin: !state.isDesktop&&'0 12px'}} header={data.header} mode="error">{data.subheader}</FormStatus>
						<Spacing size={12} />
						{data.error&&<><FormStatus style={{margin: !state.isDesktop&&'0 12px'}} header={'Ответ сервера'} mode="default">{data.error}</FormStatus>
						<Spacing size={12} /></>}
					</React.Fragment>}
					<SimpleCell disabled={!(Number(state.id) == 0) && data.mode != 'add'} onClick={() => options.OpenModal('getSettings-id')} description={data.mode == 'add' && state.storeProfiles.find(user => user.id == Number(state.id))&&<span style={{color: "var(--dynamic_red)"}}>Уже существует</span>} before={<Icon28FaceIdOutline/>} expandable indicator={<React.Fragment>
						<span className="Subhead">{state.id ? String(state.id).substring(0, 9) : `установить`}</span>
					</React.Fragment>}>Идентификатор</SimpleCell>
					<SimpleCell onClick={() => options.OpenModal('getSettings-login')} before={<Icon28WriteSquareOutline/>} expandable indicator={<React.Fragment>
						<span className="Subhead">{state.login ? String(state.login).length > 9 ? `${String(state.login).substring(0, 9)}...` : String(state.login) : `установить`}</span>
					</React.Fragment>}>Логин авторизации</SimpleCell>
					<SimpleCell onClick={() => options.OpenModal('getSettings-password')} before={<Icon28KeySquareOutline/>} expandable indicator={<React.Fragment>
						<span className="Subhead">{state.auth ? String(state.auth).length > 9 ? `${String(state.auth).substring(0, 9)}...` : String(state.auth) : `установить`}</span>
					</React.Fragment>}>Пароль авторизации</SimpleCell>
					<SimpleCell onClick={() => options.OpenModal('getSettings-server')} before={<Icon28GlobeOutline/>} expandable indicator={<React.Fragment>
						<span className="Subhead">{state.server ? `${this.props.state.serverHub[state.server-1]?.name}, ${this.props.state.serverHub[state.server-1]?.company}` : `выбрать`}</span>
					</React.Fragment>}>Игровой сервер</SimpleCell>
					<Div style={{ padding: state.isDesktop ? '12px 0 0 0' : 12 }}>
						{data.mode == 'add' ? <React.Fragment>
							<Button stretched size="l" mode="primary" disabled={(data.mode == 'add' && state.storeProfiles.find(user => user.id == Number(state.id))) || Number(state.id) == 0 || state.login == null || state.auth == null || state.server == null} onClick={() => options.addProfileInStore()}>Добавить профиль</Button>
						</React.Fragment>:<React.Fragment>
							<Button stretched size="l" mode="commerce" disabled={Number(state.id) == 0 || state.login == null || (isDonut&&!state.storeProfiles[state.storeProfilesIndex].main&&(state.auth == null))} onClick={() => options.BotAPI('getAuth', null, null, null, {stage: 'save'})}>Сохранить изменения</Button>
							{state.storeProfiles.length!=0&&!state.storeProfiles[state.storeProfilesIndex].main && <React.Fragment>
								<Spacing size={8} />
								{!this.state.isDelete ? <Button style={{color: "var(--dynamic_red)"}}  stretched size="l" mode="tertiary" onClick={() => this.setState({ isDelete: true })}>Удалить профиль</Button> : <Button stretched size="l" mode="destructive" onClick={() => options.removeProfileInStore()}>Точно удалить профиль</Button>}
							</React.Fragment>}
						</React.Fragment>}
					</Div>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;