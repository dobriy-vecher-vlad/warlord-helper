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
	SimpleCell
} from '@vkontakte/vkui';
import {
	Icon16Clear, Icon28DocumentTextOutline
} from '@vkontakte/icons';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			key: this.props.state.auth ? this.props.state.auth : ''
		};
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
					after={<PanelHeaderSubmit disabled={!(String(key).length > 0)} onClick={() => setState({ auth: key }, options.BackModal())}/>}
				>Пароль авторизации</ModalPageHeader>}
			>
				<Div>
					<FormItem
						top="Пароль авторизации игры" 
						status={String(key).length != 0 ? 'valid' : 'error'}
						bottom={String(key).length != 0 ? 'Пароль введён верно!' : 'Пожалуйста, введите пароль'}
					>
						<Input
							type="text"
							name="password_key"
							placeholder="password_key"
							maxLength={44}
							value={key}
							onChange={e => this.setState({ key: e.target.value })}
							after={<IconButton hoverMode="opacity" aria-label="Очистить поле" onClick={() => this.setState({ key: '' })}><Icon16Clear/></IconButton>}
						/>
					</FormItem>
					<SimpleCell href="https://vk.com/@wiki.warlord-authorization?anchor=poluchenie-parolya-shag-1" target="_blank" subtitle="Статья" before={<Icon28DocumentTextOutline/>} expandable>Получение пароля</SimpleCell>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;