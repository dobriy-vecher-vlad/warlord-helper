import React from 'react';
import {
	Spacing,
	Div,
	Text,
	ModalPage,
	Button
} from '@vkontakte/vkui';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
	};
	shouldComponentUpdate() {
		return false;
	};
	render() {
		const { data } = this.props;
		return (
			<ModalPage id={this.props.id}>
				<Div style={{textAlign: 'center', padding: 0}}>
					<div className="ImageLabel ImageLabel--error"></div>
					<Spacing separator size={12} />
					<Spacing size={6} />
					<Text style={{fontSize: '18px', lineHeight: '20px', fontWeight: 600, color: 'var(--text_primary)', width: '50%', margin: 'auto', marginBottom: 6}}>{data.header?data.header:'Неизвестная ошибка'}</Text>
					<Text style={{fontSize: '15px', lineHeight: '20px', fontWeight: 'normal', color: 'var(--text_secondary)', width: '50%', margin: 'auto'}}>{data.subheader?data.subheader:'Обновите приложение'}</Text>
					<Div style={{display: 'flex'}}>
						<Button href="https://vk.com/im?media=&sel=-138604865" target="_blank" size="l" stretched>Сообщить об ошибке</Button>
					</Div>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;