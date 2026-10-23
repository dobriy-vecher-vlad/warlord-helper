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
			key: this.props.state.id ? this.props.state.id : ''
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
					after={<PanelHeaderSubmit disabled={!(Number(key) > 0)} onClick={() => setState({ id: key }, options.BackModal())}/>}
				>Идентификатор</ModalPageHeader>}
			>
				<Div>
					<FormItem
						top="Цифровой идентификатор профиля"
						status={Number(key) != 0 ? 'valid' : 'error'}
						bottom={Number(key) != 0 ? 'Идентификатор введён верно!' : 'Пожалуйста, введите идентификатор'}
					>
						<Input
							type="number"
							name="id"
							placeholder="id"
							max="999999999"
							min="1"
							value={key}
							onChange={e => this.setState({ key: Math.max(Number(e.target.min), Math.min(Number(e.target.max), e.target.value))})}
							after={<IconButton hoverMode="opacity" aria-label="Очистить поле" onClick={() => this.setState({ key: '' })}><Icon16Clear/></IconButton>}
						/>
					</FormItem>
					<SimpleCell href="https://vk.com/@wiki.warlord-authorization?anchor=navigatsia" target="_blank" subtitle="Статья" before={<Icon28DocumentTextOutline/>} expandable>Получение идентификатора</SimpleCell>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;