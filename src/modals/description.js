import React from 'react';
import {
	Spacing,
	Avatar,
	ModalPageHeader,
	PanelHeaderButton,
	Div,
	CardGrid,
	Card,
	MiniInfoCell,
	RichCell,
	Cell,
	Spinner,
	FormItem,
	Input,
	Button,
	ModalPage,
	Search,
	Footer,
	Checkbox,
	FixedLayout,
	Counter
} from '@vkontakte/vkui';
import {
	Icon16Flash,
	Icon24ChainOutline,
	Icon24ChecksOutline,
	Icon24Dismiss,
	Icon24Done,
	Icon24Favorite,
	Icon28ChevronBack
} from '@vkontakte/icons';
import InfiniteScroll from "react-infinite-scroll-component";

import Items from '../data/items.json';
import Bosses from '../data/bosses.json';
import dataMap from '../data/map.json';

class DescriptionHeader extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<React.Fragment>
			<ModalPageHeader
				className="ModalPageHeader--preview"
				before={!this.props.state.isDesktop&&<PanelHeaderButton aria-label="back" onClick={() => this.props.options.BackModal()}><Icon28ChevronBack/></PanelHeaderButton>}
				after={this.props.state.isDesktop&&this.props.options.getCopy(this.props.state.activeStory, this.props.state.activePanel, this.props.data.modal)}
			/>
			<Spacing size={24} />
			{this.props.background?<Avatar mode="image" size={128} className="Avatar--preview"><div style={{background: this.props.background}}/><Avatar mode="image" size={128*2} style={{background: this.props.background}}/></Avatar>:<Avatar mode="image" size={128} src={this.props.avatar} className="Avatar--preview"><Avatar mode="image" size={128*2} src={this.props.avatar}/></Avatar>}
			<Spacing size={12} />
			<span className="DescriptionCell__text" style={{margin: 'auto', width: 'unset', display: 'block', textAlign: 'center'}}>{this.props.header}</span>
			<span className="DescriptionCell__label" style={{margin: 'auto', width: 'unset', display: 'block', textAlign: 'center'}}>{this.props.description}</span>
			<Spacing size={12} />
			<Spacing separator size={16} />
		</React.Fragment>)
	};
};
class ModalHeader extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<React.Fragment>
			{this.props.state.isDesktop?<ModalPageHeader
				after={this.props.options.getCopy(this.props.state.activeStory, this.props.state.activePanel, this.props.data.modal)}
			>{this.props.header}</ModalPageHeader>:<ModalPageHeader
				className="ModalPageHeader--content"
				before={<RichCell disabled before={(this.props.background||this.props.avatar)&&(this.props.background?<Avatar size={36} mode="app" className="Avatar--content"><div style={{background: this.props.background}}/></Avatar>:<Avatar size={36} mode="app" src={this.props.avatar} className="Avatar--content"/>)} caption={this.props.description}>{this.props.header}</RichCell>}
				after={<PanelHeaderButton aria-label="back" onClick={() => this.props.options.BackModal()}><Icon24Dismiss/></PanelHeaderButton>}
			>
			</ModalPageHeader>}
		</React.Fragment>)
	};
};
class DescriptionCell extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<MiniInfoCell className="DescriptionCell" onClick={() => {}}>
			<span className="DescriptionCell__label">{this.props.label}</span>
			<span className="DescriptionCell__text">{this.props.text}</span>
		</MiniInfoCell>)
	};
};
class DescriptionRichCell extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (<RichCell
			className="DescriptionRichCell"
			before={(this.props.avatar||this.props.counter)&&<div className={`DescriptionRichCell__avatar ${this.props.counter?'DescriptionRichCell__avatar--counter':''} ${this.props.caption?'DescriptionRichCell__avatar--caption':''}`}>
				{this.props.counter && <span className="DescriptionRichCell__counter">{this.props.counter}</span>}
				{this.props.avatar && <Avatar mode="app" className={this.props.avatarFix&&"Avatar--fix"} size={36} src={this.props.avatar}/>}
				{this.props.caption && <span className="DescriptionRichCell__caption">{this.props.caption}</span>}
			</div>}
			caption={this.props.text}
		>{this.props.label}</RichCell>)
	};
};
class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			search: "",
			searchOptions: this.props.data.options || [
				{ id: 3201, label: "Аренда автомобилей" },
				{ id: 3273, label: "Автотовары" },
				{ id: 3205, label: "Автосалон" },
				{ id: 3282, label: "Автосервис" },
				{ id: 3283, label: "Услуги для автовладельцев" },
				{ id: 3284, label: "Велосипеды" },
				{ id: 3285, label: "Мотоциклы и другая мототехника" },
				{ id: 3286, label: "Водный транспорт" },
				{ id: 3287, label: "Автопроизводитель" },
				{ id: 3288, label: "Автомойка" },
				{ id: 3117, label: "Автошкола" },
				{ id: 3118, label: "Детский сад" },
				{ id: 3119, label: "Гимназия" },
				{ id: 3120, label: "Колледж" },
				{ id: 3121, label: "Лицей" },
				{ id: 3122, label: "Техникум" },
				{ id: 3123, label: "Университет" },
				{ id: 3124, label: "Школа" },
				{ id: 3125, label: "Институт" },
				{ id: 3126, label: "Обучающие курсы" },
				{ id: 3276, label: "Дополнительное образование" },
				{ id: 3275, label: "Тренинг, семинар" },
				{ id: 3127, label: "Танцевальная школа" },
			],
			searchOptionsPage: 0,
		};
	};
	get searchOptions() {
		return this.state.searchOptions.filter(
			({ label }) => label.toLowerCase().indexOf(this.state.search.toLowerCase()) > -1
		);
	};

	async componentDidMount() {
		console.log('[MODAL] >', this.props.id, this.props.data.modalIndex);
	};
	shouldComponentUpdate(nextProps, nextState) {
		if (nextState.search != undefined) return true;
		return false;
	};
	render() {
		const { setState, state, options, data } = this.props;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		return (
			data.modalIndex == 1 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.image}`} state={state} options={options} data={data} header={data.title} description="Карта — Обыск"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.image}`} state={state} options={options} data={data} header={data.title} description="Карта — Обыск"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Ресурс для улучшения`} text={`${data.item} с босса ${data.from}`}/>
					<DescriptionCell label={`Задержка перед обыском`} text={options.getTime(data.time)}/>
					{data.region != 0 && (<>
						<Spacing separator size={16} />
						{[0].map((y, x) => {
							let region = dataMap.regions.find(region => region.items.find(location => location.id == data.region)).items.find(location => location.id == data.region);
							return (<React.Fragment key={x}>
								<DescriptionCell label={`Местоположение`} text={`${region.title} [${region.id}]`}/>
								<DescriptionCell label={`Уровень района`} text={`${region.lvl || 0} уровень`}/>
							</React.Fragment>);
						})}
					</>)}
					<Spacing separator size={16} />
					<CardGrid size="m">
					{data.levels.map((level, x) => {
						return (<Card key={x} className="DescriptionCardWiki">
							<DescriptionRichCell label={`${level[0]} ${options.numberForm(level[0], data.sign)}`} text={`${options.numberSpaces(level[1])} ${options.numberForm(level[1], ['ресурс', 'ресурса', 'ресурсов'])}`} avatar={`${pathImages}${data.icon}`} avatarFix counter={x+1}/>
						</Card>);
					})}
					</CardGrid>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 2 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Походы"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Походы"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Открытие за энергию`} text={`${data.open[0][0]} за ${data.open[0][1]}`}/>
					<DescriptionCell label={`Открытие за рубины`} text={`${data.open[1][0]} за ${data.open[1][1]}`}/>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 3 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Походы"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Походы"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Требуемый уровень`} text={`${data.lvl} уровень`}/>
					<DescriptionCell label={`Длительность похода`} text={options.getTime(data.time)}/>
					<DescriptionCell label={`Стоимость похода`} text={`${data.price} энергии`}/>
					<DescriptionCell label={`Обход противника`} text={`${data.skip} рубинов`}/>
					{data.pet && <DescriptionCell label={`Питомец`} text={data.pet}/>}
					{data.chests && <DescriptionCell label={`Дополнительная награда`} text={data.chests}/>}
					<Spacing separator size={16} />
					<Cell href={`${pathImages}${data.icon}`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение похода</Cell>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 4 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Рейды"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Рейды"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Хранитель рейда`} text={`${options.numberSpaces(data.guard[0])} здоровья\n${options.numberSpaces(data.guard[1])} атаки`}/>
					<Spacing separator size={16} />
					<CardGrid size="m">
					{data.chests.map((chest, x) => {
						return (<Card key={x} className="DescriptionCardWiki">
							<DescriptionRichCell label={`${chest.count} ${options.numberForm(chest.count, ["штука", "штуки", "штук"])}`} text={chest.title} avatar={`${pathImages}${['bot/raids/108.png', 'bot/raids/92.png', 'bot/raids/94.png', 'bot/raids/96.png', 'bot/raids/98.png', 'bot/raids/100.png'][x]}`}/>
						</Card>);
					})}
					</CardGrid>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 5 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Приключения"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Приключения"/>}
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 6 && <ModalPage
				id={this.props.id}
				header={<ModalHeader state={state} options={options} data={data} header={data.title} description="Карта — Приключения"/>}
			>
				<Div>
					{options?.getSort(data.items)?.map((item, x) => {
						if (!item) return;
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 7 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Районы"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Районы"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Номер района`} text={`${data.id} номер`}/>
					{typeof data.lvl != 'boolean' && <DescriptionCell label={`Требуемый уровень`} text={`${data.lvl} уровень`}/>}
					{typeof data.boss != 'boolean' && <DescriptionCell label={`Необходимо убить босса`} text={Bosses[data.boss].name}/>}
					{data.bosses.length !== 0 && <React.Fragment>
						<Spacing separator size={16} />
						<CardGrid size="m">
							{data.bosses.map((boss, x) => {
								return (<Card key={x} className="DescriptionCardWiki">
									<DescriptionRichCell label={Bosses[boss].name} text={Bosses[boss].description} avatar={`${pathImages}${Bosses[boss].icon}`} avatarFix/>
								</Card>);
							})}
						</CardGrid>
					</React.Fragment>}
					{data.builds.length !== 0 && <React.Fragment>
						<Spacing separator size={16} />
						<CardGrid size="m">
							{data.builds.map((build, x) => {
								return (<Card key={x} className="DescriptionCardWiki">
									<DescriptionRichCell label={dataMap.builds[build].title} text={dataMap.builds[build].description} avatar={`${pathImages}${dataMap.builds[build].image}`}/>
								</Card>);
							})}
						</CardGrid>
					</React.Fragment>}
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 8 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Захват"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Карта — Захват"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Необходимо очков для захвата района`} text={`${options.numberSpaces(data.score)} очков`}/>
					{data.region != 0 && (<>
						<Spacing separator size={16} />
						{[0].map((y, x) => {
							let region = dataMap.regions.find(region => region.items.find(location => location.id == data.region)).items.find(location => location.id == data.region);
							return (<React.Fragment key={x}>
								<DescriptionCell label={`Номер района`} text={`${region.id} номер`}/>
								<DescriptionCell label={`Уровень района`} text={`${region.lvl || 0} уровень`}/>
							</React.Fragment>);
						})}
					</>)}
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||


			data.modalIndex == 25 && <ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalHeader state={state} options={options} data={data} header={'Создание противника'} description="Боссы — Калькулятор"/>}
			>
				<Div>
					{!state.isDesktop&&<Spacing size={12} />}
					<CardGrid size="m" style={{padding: state.isDesktop ? '12px 12px 0 12px' : '0 12px'}}>
						<Card>
							<FormItem top="Здоровье" bottom="Введите здоровье вашего противника">
								<Input placeholder="Здоровье" defaultValue={1} min={1} onChange={e => data.setState({ newBossHP: e.target.value })} type="number"/>
							</FormItem>
						</Card>
						<Card>
							<FormItem top="Атака" bottom="Введите атаку вашего противника">
								<Input placeholder="Атака" defaultValue={1} min={1} onChange={e => data.setState({ newBossDMG: e.target.value })} type="number"/>
							</FormItem>
						</Card>
					</CardGrid>
					<Div>
						<Button stretched size="l" mode="commerce" onClick={() => data.setNewBoss('create')}>Подтвердить</Button>
					</Div>
				</Div>
			</ModalPage>
			||
			data.modalIndex == 9 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader background={`url(${pathImages}${data.image}) top left 25%/cover no-repeat, url(${pathImages}${data.background}) center/cover`} state={state} options={options} data={data} header={data.name} description="Боссы — Список боссов"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader background={`url(${pathImages}${data.image}) top left 25%/cover no-repeat, url(${pathImages}${data.background}) center/cover`} state={state} options={options} data={data} header={data.name} description="Боссы — Список боссов"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Характеристики`} text={`${options.numberSpaces(data.hp)} здоровья\n${options.numberSpaces(data.dmg)} атаки`}/>
					{data.energy != 0 && <DescriptionCell label={`Стоимость нападения`} text={`${data.energy} ${options.numberForm(data.energy, ['энергия', 'энергии', 'энергии'])}`}/>}
					<DescriptionCell label={`Лимит убийств`} text={`${data.tries} ${options.numberForm(data.tries, ['попытка', 'попытки', 'попыток'])}, ${options.getTime(data.time)}`}/>
					<DescriptionCell label={`Тип боя`} text={data.type === 1 ? 'Одиночный бой' : 'Общий бой'}/>
					{data.region != 0 && (<>
						<Spacing separator size={16} />
						{[0].map((y, x) => {
							let region = dataMap.regions.find(region => region.items.find(location => location.id == data.region)).items.find(location => location.id == data.region);
							return (<React.Fragment key={x}>
								<DescriptionCell label={`Местоположение`} text={`${region.title} [${region.id}]`}/>
								<DescriptionCell label={`Уровень нападения`} text={`${region.lvl || 0} уровень`}/>
							</React.Fragment>);
						})}
					</>)}
					{(data.rewards.m1 != 0 || data.rewards.m2 != 0 || data.rewards.m6 && data.rewards.m6 != 0 || data.rewards.exp != 0) && <React.Fragment>
						<Spacing separator size={16} />
						<CardGrid size="m">
							{data.rewards.m1 != 0 && <Card className="DescriptionCardWiki"><DescriptionRichCell label={`${options.numberSpaces(data.rewards.m1)} серебра`} text="Награда за победу" avatar={`${pathImages}bot/raids/12.png`}/></Card>}
							{data.rewards.m2 != 0 && <Card className="DescriptionCardWiki"><DescriptionRichCell label={`${options.numberSpaces(data.rewards.m2)} золота`} text="Награда за победу" avatar={`${pathImages}bot/raids/11.png`}/></Card>}
							{data.rewards.m6 && data.rewards.m6 != 0 && <Card className="DescriptionCardWiki"><DescriptionRichCell label={`${options.numberSpaces(data.rewards.m6)} турмалинов`} text="Награда за победу" avatar={`${pathImages}bot/raids/21.png`}/></Card>}
							{data.rewards.exp != 0 && <Card className="DescriptionCardWiki"><DescriptionRichCell label={`${options.numberSpaces(data.rewards.exp)} опыта`} text="Награда за победу" avatar={`${pathImages}bot/raids/10.png`}/></Card>}
						</CardGrid>
					</React.Fragment>}
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
					<Spacing separator size={16} />
					<Cell href={`${pathImages}${data.image}`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение босса</Cell>
					<Cell href={`${pathImages}${data.background}`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение фона</Cell>
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||


			data.modalIndex == 10 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Арена — Сезоны"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Арена — Сезоны"/>}
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 11 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Арена — Лиги"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Арена — Лиги"/>}
					<DescriptionCell label={`Диапазон кубков для вступления в лигу`} text={`${options.numberSpaces(data.from)}${data.to === 0 ? `+` : ` - ${options.numberSpaces(data.to)}`} кубков`}/>
					<DescriptionCell label={`Стоимость одного боя в лиге`} text={`${options.numberSpaces(data.price)} золота`}/>
					{data.to!=0&&<React.Fragment>
						<Spacing separator size={16} />
						<DescriptionCell label={`Количество боёв для прохождения всей лиги`} text={`${options.numberSpaces(Math.ceil((data.to-data.from)/19))} ${options.numberForm(Math.ceil((data.to-data.from)/19), ['бой', 'боя', 'боёв'])}`}/>
						<DescriptionCell label={`Затраты золота для прохождения всей лиги`} text={`${options.numberSpaces(Math.ceil((data.to-data.from)/19)*data.price)} золота`}/>
					</React.Fragment>}
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 12 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Арена — Сундуки"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Арена — Сундуки"/>}
					<DescriptionCell label={`Время, требуемое на открытие сундука`} text={options.getTime(data.time)}/>
					<DescriptionCell label={`Стоимость моментального открытия сундука`} text={`${options.numberSpaces(data.skip)} ${options.numberForm(data.skip, ['рубин', 'рубина', 'рубинов'])}`}/>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||

			
			data.modalIndex == 13 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Таланты"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Таланты"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Бонус`} text={data.bonus}/>
					<DescriptionCell label={`Стоимость использования`} text={`${data.point} ${options.numberForm(data.point, ['очко', 'очка', 'очков'])}`}/>
					<DescriptionCell label={`Валюта улучшения`} text={data.currency === 1 ? 'Золото' : 'Серебро'}/>
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 14 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Персонаж — Достижения"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Персонаж — Достижения"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<Spacing separator size={16} />
					<CardGrid size="m">
					{data.levels.map((level, x) => {
						return (<Card key={x} className="DescriptionCardWiki">
							<DescriptionRichCell label={`${options.numberSpaces(level)} ${Array.isArray(data.sign) ? options.numberForm(level, data.sign) : data.sign}`} text={`${x+1} стадия`} counter={x+1}/>
						</Card>);
					})}
					</CardGrid>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 15 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Ресурсы"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Ресурсы"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Получение`} text={data.from}/>
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 16 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Питомцы"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Питомцы"/>}
					<DescriptionCell label={`Получение`} text={data.from}/>
					<DescriptionCell label={`Стоимость отправки на поиск`} text={`${data.food} ${options.numberForm(data.food, ['еда', 'еды', 'еды'])}`}/>
					<DescriptionCell label={`Время поиска`} text={options.getTime(data.time)}/>
					<DescriptionCell label={`Визуальных стадий`} text={`${data.stages} ${options.numberForm(data.stages, ['стадия', 'стадии', 'стадий'])}`}/>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 17 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Фоны"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Фоны"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<Spacing separator size={16} />
					<Cell href={`${pathImages}${data.icon}`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение фона</Cell>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 18 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Аватары"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Персонаж — Аватары"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<Spacing separator size={16} />
					<Cell href={`${pathImages}${data.icon}`} target="_blank" className="DescriptionCellButton" before={<Icon24ChainOutline />} description="Ссылка" expandable>Изображение аватара</Cell>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||

			
			data.modalIndex == 19 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Улучшения"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Улучшения"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Бонус за каждый уровень`} text={data.bonus}/>
					<Spacing separator size={16} />
					<CardGrid size="m">
					{data.levels.map((level, x) => {
						if ((data.title === 'Стража Форта' || data.title === 'Таран') && x === data.levels.length-1) {
							return (<Card key={x} className="DescriptionCardWiki">
								<DescriptionRichCell label={<React.Fragment>+2 000<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/1.png)`}}/><br/>+5 000<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/3.png)`}}/></React.Fragment>} text={`За каждый уровень`} counter={x+1}/>
							</Card>);
						} else {
							return (<Card key={x} className="DescriptionCardWiki">
								<DescriptionRichCell label={<React.Fragment>{options.numberSpaces(level[0])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/1.png)`}}/><br/>{options.numberSpaces(level[1])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/3.png)`}}/></React.Fragment>} text={`${x+1} уровень`} counter={x+1}/>
							</Card>);
						}
					})}
					</CardGrid>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 20 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Кузница"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Кузница"/>}
					<DescriptionCell label={`Требуемый стаж`} text={`${data.days} ${options.numberForm(data.days, ['день', 'дня', 'дней'])}`}/>
					<DescriptionCell label={`Требуемый уровень Кузницы`} text={`${data.build} уровень`}/>
					<Spacing separator size={16} />
					<DescriptionCell label={`Стоимость предмета`} text={<React.Fragment>{options.numberSpaces(data.price[0])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/4.png)`}}/> или {options.numberSpaces(data.price[0]*55)}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/1.png)`}}/><br/>{options.numberSpaces(data.price[1])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/5.png)`}}/> или {options.numberSpaces(data.price[1]*75)}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/3.png)`}}/></React.Fragment>}/>
					<DescriptionCell label={`Стоимость заточки`} text={<React.Fragment>{options.numberSpaces(Math.ceil(data.price[0]/10))}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/4.png)`}}/> или {options.numberSpaces(Math.ceil(data.price[0]/10)*55)}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/1.png)`}}/><br/>{options.numberSpaces(Math.ceil(data.price[1]/10))}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/5.png)`}}/> или {options.numberSpaces(Math.ceil(data.price[1]/10)*75)}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/3.png)`}}/></React.Fragment>}/>
					<Spacing separator size={16} />
					{(state.checkItems.item || state.checkItems.scroll) && 
						options.getItemCell({item: true, scroll: true, id: Items.indexOf(Items.find(x => x.title === data.title))})
					}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 21 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Академия"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Академия"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Бонус за каждый уровень`} text={data.bonus}/>
					<Spacing separator size={16} />
					<CardGrid size="m">
					{data.levels.map((level, x) => {
						return (<Card key={x} className="DescriptionCardWiki">
							<DescriptionRichCell label={<React.Fragment>{options.numberSpaces(level)}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/${data.currency === 1 ? 5 : 4}.png)`}}/></React.Fragment>} text={`${x+1} уровень`} counter={x+1}/>
						</Card>);
					})}
					</CardGrid>
					{!state.isDesktop&&<Spacing size={8}/>}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 22 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Набеги"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Набеги"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 23 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Рейды"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Рейды"/>}
					<DescriptionCell label={`Требуемый стаж`} text={`${data.days} дней`}/>
					<DescriptionCell label={`Характеристики`} text={<React.Fragment>{options.numberSpaces(data.hp)} здоровья<br/>{options.numberSpaces(data.dmg)} атаки</React.Fragment>}/>
					<DescriptionCell label={`Стоимость создания`} text={<React.Fragment>{options.numberSpaces(data.price[0])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/1.png)`}}/><br/>{options.numberSpaces(data.price[1])}<Spinner size="small" className="DescriptionPricePreloadWiki" /><i style={{backgroundImage: `url(${pathImages}currency/3.png)`}}/></React.Fragment>}/>
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||
			data.modalIndex == 26 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Звания"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.title} description="Гильдия — Звания"/>}
					<DescriptionCell label={`Описание`} text={data.description}/>
					<DescriptionCell label={`Доступ`} text={data.bonus}/>
					{!state.isDesktop&&<Spacing size={8} />}
				</Div>
			</ModalPage>
			||


			data.modalIndex == 24 && <ModalPage
				id={this.props.id}
				header={!state.isDesktop&&<ModalHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Разное — События"/>}
			>
				<Div>
					{!state.isDesktop?<Spacing size={8} />:<DescriptionHeader avatar={`${pathImages}${data.icon}`} state={state} options={options} data={data} header={data.name} description="Разное — События"/>}
					<DescriptionCell label={`Описание события`} text={data.description}/>
					<DescriptionCell label={`Дата события`} text={data.date}/>
					{data.rewards.length !== 0 && <React.Fragment>
						<Spacing separator size={16} />
						<CardGrid size="m">
						{data.rewards.map((reward, x) => {
							return (<Card key={x} className="DescriptionCardWiki">
								<DescriptionRichCell label={reward} text={`Награда ${data.rewards.length-x} уровня`} counter={x+1}/>
							</Card>);
						})}
						</CardGrid>
					</React.Fragment>}
					<Spacing separator size={16} />
					{options?.getSort(data.items)?.map((item, x) => {
						if ((state.checkItems.item && item.item) || (state.checkItems.collection && item.collection && !item.personal) || (state.checkItems.scroll && item.scroll) || (state.checkItems.personal && item.personal)) {
							return options.getItemCell(item, x);
						}
					})}
					{state.checkItems.null && 
						<Cell className="DescriptionWiki" style={{textAlign: 'center'}} description="Нет предметов"></Cell>
					}
				</Div>
			</ModalPage>
			||


			data.modalIndex == 'search' && <ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<Search
					value={this.state.search}
					onChange={(event) => {
						document.getElementById('searchOptions')?.scrollTo({ top: 0 })
						this.setState({ search: event.target.value, searchOptionsPage: 0 });
					}}
					after={null}
				/>}
			>
				<Div style={{ paddingTop: 0 }}>
					{this.searchOptions && this.searchOptions.length > 0 ? <>
						<div className="Scroll" id="searchOptions" style={{maxHeight: state.isDesktop ? '372px' : 'unset'}}>
							<InfiniteScroll
								dataLength={(this.state.searchOptionsPage + 1) * 30}
								next={() => this.setState({ searchOptionsPage: this.state.searchOptionsPage+1 })}
								hasMore={true}
								loader={<Spinner size="regular" style={{ margin: '20px 0' }} />}
								scrollableTarget={"searchOptions"}
							>
								{this.searchOptions.slice(0, (this.state.searchOptionsPage + 1) * 30).map((option, key) => (
									<Cell key={key} after={option.count ? <Counter size="s">{option.count}</Counter> : false} checked={option.checked} value={option.value} onChange={(event) => this.setState({ searchOptions: this.state.searchOptions.map(option => ({
										...option,
										checked: event.target.value == option.value ? event.target.checked : option.checked,
									})) }, () => this.props.data.setState({ searchItemsUsed: this.state.searchOptions.filter(option => option.checked).map(option => option.value) }))} mode="selectable" before={<Avatar mode="app" size={32} src={pathImages+option.src} />} subtitle={option.description}>
										{option.label}
									</Cell>
								))}
							</InfiniteScroll>
						</div>
						{this.state.searchOptions.filter(option => option.count).length ? <>
							<Spacing size={1} separator />
							<Button 
								size="l"
								align="center"
								stretched={true}
								mode="secondary"
								onClick={() => this.setState({ searchOptions: this.state.searchOptions.map(option => ({
									...option,
									checked: option.count ? true : option.checked,
								})) }, () => this.props.data.setState({ searchItemsUsed: this.state.searchOptions.filter(option => option.checked).map(option => option.value) }))}
								style={{ marginTop: 12 }}
							>Выбрать все элементы в наличии</Button>
						</> : false}
					</>:<Cell disabled className="DescriptionWiki" style={{textAlign: 'center'}} description="Ничего не найдено"></Cell>}
				</Div>
			</ModalPage>
			||

			
			<ModalPage
				id={this.props.id}
				header={<ModalPageHeader>{data.title || data.name}</ModalPageHeader>}
				className='Modal--placeholderLoading'
			>
				<Div>
					{JSON.stringify(data)}
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;