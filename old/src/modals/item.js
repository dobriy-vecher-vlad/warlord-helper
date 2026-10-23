import React from 'react';
import {
	Spacing,
	Cell,
	Div,
	ModalPage
} from '@vkontakte/vkui';
import {
	Icon24ChainOutline, Icon24StickerOutline
} from '@vkontakte/icons';

import Items from '../data/items.json';
import Bosses from '../data/bosses.json';

import dataMap from '../data/map.json';
import dataBosses from '../data/boss.json';
import dataArena from '../data/arena.json';
import dataCharacter from '../data/character.json';
import dataGuild from '../data/guild.json';

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
		const { state, options, data } = this.props;
		const item = Items[data.id];
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		let scroll = [];
		dataMap.adventures.find(adventure => {
			if (adventure.floors.find(floor => floor.items.find(item => item.id == data.id))) {
				let from = `${scroll.length ? 'приключение' : 'Приключение'} ${adventure.title}`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		dataMap.raids.find(raid => {
			if (raid.levels.find(level => level.items.find(item => item.id == data.id && item.scroll))) {
				let from = `${scroll.length ? 'рейд' : 'Рейд'} ${raid.title}`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		dataArena.season.find(season => season.month.find((month) => {
			if (month.items.find(item => item.id == data.id)) {
				let from = `${scroll.length ? 'любое' : 'Любое'} приключение`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		}));
		dataBosses.bosses.find(bosses => bosses.mobs.find((boss) => {
			if (boss.items.find(item => item.id == data.id && item.scroll)) {
				let from = `${scroll.length ? 'босс' : 'Босс'} ${Bosses.find(Boss => Boss.id == boss.id)?.name}`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		}));
		dataArena.chest.find(chest => {
			if (chest.items.find(item => item.id == data.id && item.scroll)) {
				let from = chest.title;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		dataCharacter.pets.find(pet => {
			if (pet.items.find(item => item.id == data.id && item.scroll)) {
				let from = `${scroll.length ? 'питомец' : 'Питомец'} ${pet.title}`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		dataGuild.items.find(reward => {
			if (reward.title == item.title) {
				let from = `${scroll.length ? 'кузница' : 'Кузница'} гильдии`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		dataGuild.bosses.find(boss => {
			if (boss.items.find(item => item.id == data.id && item.scroll)) {
				let from = `${scroll.length ? 'босс' : 'Босс'} ${boss.title}`;
				if (!scroll.map(str => str.toLowerCase()).includes(from.toLowerCase())) scroll.push(from);
			}
		});
		if (item.fragments.length) scroll.push(scroll.length ? 'коллекция' : 'Коллекция');
		return (
			<ModalPage id={this.props.id}>
				<Div style={{padding: state.isDesktop ? 12 : ''}}>
					{(state.checkItems.item || state.checkItems.collection) && 
						options.getItemCell(data, item.id, true)
					}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
					<Spacing separator size={16} />
					<Cell className="DescriptionCellButton" before={<Icon24StickerOutline />} description="Получение заточки"><span style={{whiteSpace: 'normal'}}>{scroll.length ? scroll.join(', ') : 'Нет информации'}</span></Cell>
					<Spacing separator size={16} />
					<Cell href={`${pathImages}items/${item.id}.png`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение иконки</Cell>
					<Cell href={`${pathImages}items/${item.id}b.png`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение предмета</Cell>
					{item.type == 2 && <Cell href={`${pathImages}items/${item.id}e.png`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение улучшенного предмета</Cell>}
					{!this.props.state.isDesktop&&<Spacing size={8} />}
				</Div>
    		</ModalPage>
		);
	};
};
export default MODAL;