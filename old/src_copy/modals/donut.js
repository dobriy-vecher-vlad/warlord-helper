import React from 'react';
import {
	Title,
	Button,
	Div,
	Counter,
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
	Icon24FavoriteOutline,
	Icon24StickerOutline,
	Icon24LikeOutline,
	Icon24HammerOutline
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
					<Title style={{ margin: '32px 16px', textAlign: 'center' }} level="2" weight="medium">Подписка</Title>
					<div style={{ margin: '16px 8px', gap: 8, display: 'flex', flexDirection: 'column'}}>
						<Cell className="DescriptionWiki" before={<Icon24AddCircleDottedOutline />} description="Привязывай профили и получай выгоду на всех">Профили</Cell>
						<Cell after={<Counter size="s" mode="prominent">Популярное</Counter>} className="DescriptionWiki" before={<Icon24SkullOutline />} description="Проходите в автоматическом режиме выбранный рейд всего за 2 минуты">Автоматическое прохождение рейдов</Cell>
						<Cell after={<Counter size="s" mode="prominent">Популярное</Counter>} className="DescriptionWiki" before={<Icon24CupOutline />} description="Набирайте в автоматическом режиме очки арены и занимайте первые места">Автоматическое прохождение арены</Cell>
						<Cell after={<Counter size="s" mode="primary">Новое</Counter>} className="DescriptionWiki" before={<Icon24HammerOutline />} description="Удобно сортируйте и улучшайте в один клик любой предмет">Автоматическая кузница</Cell>
						<Cell className="DescriptionWiki" before={<Icon24Users3Outline />} description="Сканируйте всех ваших друзей, выводя их в удобном и сортируемом списке">Сканер друзей</Cell>
						<Cell className="DescriptionWiki" before={<Icon24TshirtOutline />} description="Напротив каждого предмета в приложении будет указываться его наличие у вас">Наличие предметов</Cell>
						<Cell className="DescriptionWiki" before={<Icon24MoneyCircleOutline />} description="Список предметов с подробной информацией">Магазин, Коллекции и Инкрустация</Cell>
						<Cell className="DescriptionWiki" before={<Icon24PollOutline />} description="Считайте затраты на боссов, арену, казну гильдии и предметы ещё эффективнее">Калькуляторы</Cell>
						{/* <Cell className="DescriptionWiki" before={<Icon24FavoriteOutline />} description="Иконка в виде звёздочки в комментариях и доступ к эксклюзивным записям">Значок и стена</Cell> */}
						{/* <Cell className="DescriptionWiki" before={<Icon24StickerOutline />} description="Эксклюзивные стикеры VK Donut при каждом продлении подписки">Стикеры</Cell> */}
						{/* <Cell className="DescriptionWiki" before={<Icon24LikeOutline />} description="Вы увеличиваете шанс появления новых функций">Поддержка проекта</Cell> */}
					</div>
					<div style={{display: 'flex', flexDirection: 'column', margin: 16}}>
						<Button href="https://vk.com/donut/wiki.warlord" stretched target="_blank" size="l" mode="primary">Оформить за 50₽ в месяц</Button>
					</div>
				</Div>
    		</ModalCard>
		);
	};
};
export default MODAL;