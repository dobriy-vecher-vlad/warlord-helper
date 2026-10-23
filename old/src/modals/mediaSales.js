import React from 'react';
import {
	Title,
	Button,
	Div,
	Text,
	Cell,
	ModalCard
} from '@vkontakte/vkui';
import {
	Icon24AddCircleDottedOutline,
	Icon24SkullOutline,
	Icon24CupOutline,
	Icon24Users3Outline,
	Icon24TshirtOutline,
	Icon24MoneyCircleOutline,
	Icon24PollOutline,
	Icon24HammerOutline,
} from '@vkontakte/icons';

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
		return (
			<ModalCard id={this.props.id}>
				<Div style={{padding: 0}}>
					<Title style={{ margin: '32px 16px', textAlign: 'center' }} level="2" weight="medium">Две подписки по цене одной</Title>
					<div style={{margin: 16}}><Text>Приведи друга, который оформит подписку по твоей рекомендации и получи подписку себе сроком на 3 месяца совершенно бесплатно.</Text></div>
					<Title style={{ margin: '16px 16px 8px 16px', textAlign: 'center' }} level="3" weight="medium">Преимущества подписки</Title>
					<div style={{ margin: '8px 8px 16px 8px', gap: 8, display: 'flex', flexDirection: 'column'}}>
						<Cell className="DescriptionWiki" before={<Icon24AddCircleDottedOutline />} description="Привязывай профили и получай выгоду на всех">Профили</Cell>
						<Cell className="DescriptionWiki" before={<Icon24SkullOutline />} description="Проходите в автоматическом режиме выбранный рейд всего за 2 минуты">Автоматическое прохождение рейдов</Cell>
						<Cell className="DescriptionWiki" before={<Icon24CupOutline />} description="Набирайте в автоматическом режиме очки арены и занимайте первые места">Автоматическое прохождение арены</Cell>
						<Cell className="DescriptionWiki" before={<Icon24HammerOutline />} description="Удобно сортируйте и улучшайте в один клик любой предмет">Автоматическая кузница</Cell>
						<Cell className="DescriptionWiki onlyIcons" before={<><Icon24Users3Outline /><Icon24TshirtOutline /><Icon24MoneyCircleOutline /><Icon24PollOutline /></>}></Cell>
					</div>
					<div style={{display: 'flex', flexDirection: 'column', margin: 16}}>
						<Button onClick={() => {this.props.options.Storage({key: 'promo_3', value: 'true'}); this.props.options.BackModal();}} stretched size="l" mode="primary">Хорошо</Button>
					</div>
				</Div>
			</ModalCard>
		);
	};
};
export default MODAL;