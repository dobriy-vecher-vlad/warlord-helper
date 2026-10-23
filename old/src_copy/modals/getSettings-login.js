import React from 'react';
import {
	FormItem,
	Input,
	Div,
	ModalPageHeader,
	PanelHeaderSubmit,
	PanelHeaderBack,
	IconButton,
	ModalPage,
	SimpleCell,
	Spacing,
	Button,
	FormLayoutGroup,
	FormStatus,
	withModalRootContext
} from '@vkontakte/vkui';
import {
	Icon16Clear, Icon28DocumentTextOutline
} from '@vkontakte/icons';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			key: this.props.state.login ? this.props.state.login : '',
			loading: false,
			servers: false,
		};
	};
	async checkUID() {
		this.setState({ loading: true }, () => this.props.updateModalHeight());
		let servers = await this.props.state.getGame(this.props.state.server, null, {
			login: String(this.state.key).trim(),
		}, 2, true);
		if (Array.isArray(servers) && servers?.filter(server => server._uid != '0')?.length) {
			this.setState({ servers: servers.filter(server => server._uid != '0').map(server => ({
				ID: String(this.state.key).trim(),
				UID: server._uid,
				name: server._n,
			})) }, () => this.props.updateModalHeight());
		} else {
			this.setState({ servers: String(this.state.key).trim() }, () => this.props.updateModalHeight());
		}
		this.setState({ loading: false }, () => this.props.updateModalHeight());
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
	};
	render() {
		const { setState, state, options } = this.props;
		const { key } = this.state;
		return (
			<ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalPageHeader
					before={<PanelHeaderBack onClick={() => options.BackModal()}/>}
					after={<PanelHeaderSubmit disabled={!(String(key).trim().length > 0)} onClick={() => setState({ login: String(key).trim() }, options.BackModal())}/>}
				>Логин авторизации</ModalPageHeader>}
			>
				<Div>
					<FormLayoutGroup mode="horizontal">
						<FormItem
							top="Логин авторизации игры" 
							status={String(key).trim().length != 0 ? 'valid' : 'error'}
							bottom={String(key).trim().length != 0 ? 'Логин введён верно!' : 'Пожалуйста, введите логин'}
						>
							<Input
								type="text"
								name="login_key"
								placeholder="login_key"
								maxLength={44}
								value={key}
								onChange={e => this.setState({ key: e.target.value })}
								after={<IconButton hoverMode="opacity" aria-label="Очистить поле" onClick={() => this.setState({ key: '' })}><Icon16Clear/></IconButton>}
							/>
						</FormItem>
						{this.props.state.server&&<Button disabled={!String(key).trim().length} size="l" style={{ marginTop: state.isDesktop ? '-5px' : 0, marginLeft: '8px' }} appearance="accent" mode="secondary" loading={this.state.loading} onClick={() => this.checkUID()}>Проверить</Button>}
					</FormLayoutGroup>
					{this.state.servers && <>
						{Array.isArray(this.state.servers) ? 
							<FormStatus style={{margin: !state.isDesktop&&'0 12px'}} header={`Сервера на сайте ${this.props.state.serverHub[this.props.state.server-1]?.company}`} mode="default">{this.state.servers.map((server, key) => <div key={key}>Логин {server.UID} на сервере {server.name}</div>)}</FormStatus> :
							<FormStatus style={{margin: !state.isDesktop&&'0 12px'}} header={`Сервера на сайте ${this.props.state.serverHub[this.props.state.server-1]?.company}`} mode="default">Логин {this.state.servers} не существует</FormStatus>
						}
						<Spacing size={12} />
					</>}
					<SimpleCell href="https://vk.com/@wiki.warlord-authorization?anchor=navigatsia" target="_blank" subtitle="Статья" before={<Icon28DocumentTextOutline/>} expandable>Получение логина</SimpleCell>
				</Div>
			</ModalPage>
		);
	};
};
export default withModalRootContext(MODAL);