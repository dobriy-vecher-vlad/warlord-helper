import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	Cell,
	HorizontalScroll,
	TabsItem,
	Tabs,
	Spinner,
	Counter,
	Button,
	Placeholder,
	Checkbox,
	FormLayoutGroup,
	FormItem,
	Input,
	Select,
	Text,
	IconButton,
	File,
	Header,
	Banner,
	Avatar,
	CustomSelectOption,
	Chip,
} from '@vkontakte/vkui';
import { ChipsSelect } from "@vkontakte/vkui/dist/unstable";
import "@vkontakte/vkui/dist/unstable.css";
import { Icon12Cancel, Icon16Clear, Icon16GridOfFour, Icon16Picture, Icon24Cancel, Icon24Chevron, Icon56FragmentsOutline } from '@vkontakte/icons';
import Skeleton from '../../components/skeleton';
import { toBlob } from 'html-to-image';

import Items from '../../data/items.json';

const numberRandom = (min = 1, max = 2) => {
	return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
};
const tabs = [{
	id: 1,
	title: 'Хочу отдать',
}, {
	id: 2,
	title: 'Хочу найти',
}];
const Collections = [...Items.filter(item => item.fragments.length)].map(item => ({
	value: item.id,
	label: item.title,
	src: item.icon,
	description: item.description,
	fragments: item.fragments,
}));
const Fragments = [...Items.filter(item => item.fragments.length)].map(item => item.fragments.map((fragment, key) => ({
	value: fragment,
	label: `${item.title} ${['I', 'II', 'III', 'IV', 'V'][key]}`,
	src: `collections/${fragment}.png`,
	description: item.description,
	count: 0,
}))).flat();
console.log(Collections);
console.log(Fragments);

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			isLoad: true,
			isSave: false,
			tabs: 2,
			placeholderSize: (68 + 16 + (this.props.state.isDesktop ? 56 : 100)) - (20 + 56 + 12),
			giveawayItems: [],
			searchItemsUsed: [],
			searchItemsRemoved: [],
			settings: {
				columns: 2,
				countElements: true,
				nameElements: true,
				stretchedElements: true,
				colorImage: ['bright_light', 'space_gray'].indexOf(document.body.getAttribute('scheme')),
				alignImage: 1,
				titleImage: false,
				textImage: false,
				image: false,
				blurImage: 0,
				opacityImage: 10,
				missingElements: true,
				compactMode: false,
			},
		};
		this.ImagePreview = React.createRef();
		this.Image = React.createRef();
		this._isMounted = false;
	};
	transmittedSetState = async(name, callback = () => {}) => {
		this.setState(name, callback());
	};
	async updateItems(isUpgrade = false) {
		const { state } = this.props;
		const { getGame, server } = this.props.state;
		const { BotAPI, openSnackbar, setActivePanel } = this.props.options;
		this._isMounted && this.setState({ isLoad: true });
		let dataProfile;
		if (!this.state.profile || isUpgrade) {
			let api_uid = state.login || state.user.vk.id;
			let auth_key = state.auth;
			if (!auth_key) {
				auth_key = this._isMounted && await BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Для продолжения работы необходимо указать пароль авторизации'});
				if (auth_key == 'modal') {
					this._isMounted && setActivePanel('profile');
					return;
				} else if (!auth_key) {
					this._isMounted && setActivePanel('profile');
					return;
				}
			}
			this.state.getGameAuth = {
				login: api_uid,
				password: auth_key,
			};
			dataProfile = this._isMounted && await getGame(server, {}, this.state.getGameAuth);
			if (!dataProfile?.u || !dataProfile.i.length) {
				openSnackbar({text: 'Пароль авторизации игры неисправен, введите новый', icon: 'error'});
				this._isMounted && BotAPI('getAuth', null, null, null, {stage: 'modal', text: 'Пароль авторизации игры неисправен, введите новый', error: typeof dataProfile == 'string' ? dataProfile : dataProfile?.err_msg ? dataProfile?.err_msg : JSON.stringify(dataProfile)});
				this._isMounted && setActivePanel('profile');
				return;
			}
			this.state.getGameAuth.id = dataProfile?.u?._id || api_uid;
			this.state.profile = dataProfile;
		} else dataProfile = this.state.profile;


		console.log(dataProfile);
		// this.state.resources.map(resource => resource.count = Number(dataProfile.u[`_${resource?.id}`]) || 0);
		// this.state.items = [];
		// let resource = this.state.resources.find(resource => resource.id == this.state.tabs);
		// dataProfile.i.filter(item => Number(item._o) == 1)?.map(item => {
		// 	try {
		// 		let _item = Items.find(_item => _item.id == Number(item._id));
		// 		_item.lvl = Number(item._u) || 0;
		// 		if (resource.id == 'm9') {
		// 			_item.scrolls = 0;
		// 			if (_item.lvl < 5 || _item.lvl >= 10 || resource.count < enchantmentsScrolls[_item.lvl]) return;
		// 		} else {
		// 			if (`m${_item.currency}` != resource.id) return;
		// 			_item.scrolls = Number(dataProfile?.iupgrade?.i?.find(item => Number(item._id) == Number(_item.id))?._cnt) || 0;
		// 			if (_item.lvl >= 5 || _item.scrolls < [...enchantmentsScrolls].splice(0, 5)?.[_item.lvl]) return;
		// 		}
		// 		_item.prices = enchantmentsMultiplier.map((multiplier) => Math.ceil((_item.dmg + _item.hp) * multiplier) * (this.state.resources.find(resource => resource.id == `m${_item.currency}`)?.multiplier || 1));
		// 		if (this.state.resources.find(resource => resource.id == `m${_item.currency}`)?.count < _item.prices[_item.lvl]) return;
		// 		_item.enchantments = {
		// 			dmg: enchantmentsMultiplier.map((multiplier) => Math.ceil(_item.dmg * multiplier || 0)),
		// 			hp: enchantmentsMultiplier.map((multiplier) => Math.ceil(_item.hp * multiplier || 0)),
		// 		};
		// 		this.state.items.push(_item);
		// 	} catch (error) { }
		// });
		// let allItems = this.state.items.sort((a, b) => b.lvl - a.lvl);
		// this.setState({ currentItems: allItems.slice(0, 30), allItems });
		// this._isMounted && this.setState({ isLoad: false });
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		this._isMounted = true;
		await this.updateItems();
		this._isMounted && this.setState({ isLoad: false });
	};
	async componentWillUnmount () {
		this._isMounted = false;
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent } = this.props;
		const { currentItems, allItems } = this.state;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Коллекции';
		const description = 'Утилиты';
		const avatar = 'labels/20.png';
		return (
			<Panel id={this.props.id} className={this.state.isLoad ? 'State--isLoad' : ''}>
				{state.isDesktop ? <Group>
					{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
					{!this.state.isLoad || currentItems ? <Tabs mode="default">
						{tabs.map((tab, x) => <TabsItem key={tab.id} onClick={() => this.setState({ tabs: tab.id })} selected={this.state.tabs === tab.id}>{tab.title}</TabsItem>)}
					</Tabs> : <Skeleton height={44} marginLeft={0} marginRight={0} width="auto"/>}
				</Group> : options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				{this.state.tabs == 1 ? <>
					<Group>
						<details className="CustomFormLayoutGroup DetailsWiki">
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Общее</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Заголовок</Text>
								<Input
									type="text"
									placeholder="Введите заголовок"
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											titleImage: event.target.value,
										}
									}))}
									value={this.state.settings.titleImage || ''}
									after={this.state.settings.titleImage ? <IconButton
										hoverMode="opacity"
										aria-label="Очистить поле"
										onClick={() => this.setState(prevState => ({
											settings: {
												...prevState.settings,
												titleImage: false,
											}
										}))}
									><Icon16Clear/></IconButton> : false}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Текст</Text>
								<Input
									type="text"
									placeholder="Введите текст"
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											textImage: event.target.value,
										}
									}))}
									value={this.state.settings.textImage || ''}
									after={this.state.settings.textImage ? <IconButton
										hoverMode="opacity"
										aria-label="Очистить поле"
										onClick={() => this.setState(prevState => ({
											settings: {
												...prevState.settings,
												textImage: false,
											}
										}))}
									><Icon16Clear/></IconButton> : false}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Выравнивание</Text>
								<Select
									options={['По центру', 'По левому краю', 'По правому краю'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.alignImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											alignImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Количество столбцов</Text>
								<Select
									options={new Array(10).fill().map((item, key) => key+1).map((param, key) => ({ label: `${param} ${options.numberForm(param, ['столбец', 'столбца', 'столбцов'])}`, value: key }))}
									value={this.state.settings.columns-1}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											columns: Number(event.target.value)+1,
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Подписывать название</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.nameElements}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											nameElements: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Оформление</Text>
								<Select
									options={['Светлый акцент', 'Темный акцент'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.colorImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											colorImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={1} separator />
						</details>
						<details className="CustomFormLayoutGroup DetailsWiki">
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Задний фон</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Изображение</Text>
								<File
									before={<Icon16Picture role="presentation" />}
									after={this.state.settings.image ? <span>{this.state.settings.image}</span> : undefined}
									size="l"
									align="center"
									stretched={true}
									mode="secondary"
									accept="image/png, image/jpeg, image/jpg"
									onChange={(event) => {
										let file = event?.target?.files?.[0] || false;
										if (!FileReader) return;
										if (!file) return;
										if (!file.type.startsWith('image/')) return;
										let fileReader = new FileReader();
										fileReader.onload = () => {
											this.setState(prevState => ({
												settings: {
													...prevState.settings,
													image: file?.name || 'Неизвестное название',
												}
											}), () => this.Image.current.src = fileReader.result);
										};
										fileReader.readAsDataURL(file);
									}}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Размытие</Text>
								<Select
									options={new Array(11).fill().map((item, key) => key).map((param, key) => ({ label: param ? `${param} степень` : 'Отключено', value: key }))}
									value={this.state.settings.blurImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											blurImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Видимость</Text>
								<Select
									options={new Array(11).fill().map((item, key) => key).map((param, key) => ({ label: `${param * 10}%`, value: key }))}
									value={this.state.settings.opacityImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											opacityImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={1} separator />
						</details>
						<details className="CustomFormLayoutGroup DetailsWiki" open>
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Элементы</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Количество элементов</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.countElements}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											countElements: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Компактный режим</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.compactMode}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											compactMode: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={4} />
						</details>
					</Group>
					<Group>
						<div className={`ImagePreview ImagePreview--${['light', 'dark'][this.state.settings.colorImage]}`}>
							<div className="ImagePreview__container" ref={this.ImagePreview}>
								{this.state.settings.titleImage && <div className="ImagePreview__title" style={{ textAlign: ['center', 'left', 'right'][this.state.settings.alignImage] }}>{this.state.settings.titleImage}</div>}
								{this.state.settings.textImage && <div className="ImagePreview__text" style={{ textAlign: ['center', 'left', 'right'][this.state.settings.alignImage] }}>{this.state.settings.textImage}</div>}
								<div className="ImagePreview__in" style={{ gridTemplateColumns: `repeat(${this.state.settings.columns}, 1fr)` }}>
									{Items.filter(item => item.fragments.length).slice(0, 40).map((collection, key) => <React.Fragment key={key}>
										<div className={['CollectionStack', this.state.settings.compactMode ? 'CollectionStack--compact' : false].filter(className => className).join(' ')} title={collection.title}>
											{this.state.settings.nameElements ? <div className="CollectionStack__header">{collection.title}</div> : false}
											<div className="CollectionStack__in">
												{collection.fragments.map((fragment, key) => <React.Fragment key={key}>
													<Avatar className={['CollectionStack__item', this.state.settings.missingElements ? key%2 ? 'CollectionStack__item--missing' : false : false].filter(className => className).join(' ')} badge={this.state.settings.countElements ? <>12</> : false} src={`${pathImages}collections/${Number(fragment)}.png`}/>
												</React.Fragment>)}
											</div>
										</div>
									</React.Fragment>)}
								</div>
								<div className="ImagePreview__image">{this.state.settings.image ? <img ref={this.Image} alt="ImagePreview__image" style={{ filter: this.state.settings.blurImage ? `blur(${this.state.settings.blurImage}px)` : false, transform: this.state.settings.blurImage ? `scale(${1+this.state.settings.blurImage/100})` : false, opacity: this.state.settings.opacityImage ? this.state.settings.opacityImage/10 : 0 }}/> : false}</div>
							</div>
						</div>
					</Group>
					<Group>
						<div style={{
							display: 'flex',
							gap: 8,
						}}>
							<Button loading={this.state.isSave} size="m" onClick={() => {
								this.setState({ isSave: true });
								setTimeout(async() => {
									await toBlob(this.ImagePreview.current).then((dataUrl) => {
										const anchor = document.createElement('a');
										document.body.appendChild(anchor);
										anchor.href = URL.createObjectURL(dataUrl);
										anchor.download = 'collections.png';
										anchor.click();
									}).catch((error) => this.props.options.openSnackbar({text: error, icon: 'error'}));
									this.setState({ isSave: false });
								}, 0);
							}} stretched mode="commerce">Сохранить изображение</Button>
							<Button loading={this.state.isSave} size="m" onClick={() => {
								this.setState({ isSave: true });
								setTimeout(async() => {
									await toBlob(this.ImagePreview.current).then((dataUrl) => window.open(URL.createObjectURL(dataUrl), '_blank')).catch((error) => this.props.options.openSnackbar({text: error, icon: 'error'}));
									this.setState({ isSave: false });
								}, 0);
							}} stretched mode="secondary">Открыть в новом окне</Button>
						</div>
					</Group>
				</> : this.state.tabs == 2 ? <>
					<Group>
						<details className="CustomFormLayoutGroup DetailsWiki">
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Общее</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Заголовок</Text>
								<Input
									type="text"
									placeholder="Введите заголовок"
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											titleImage: event.target.value,
										}
									}))}
									value={this.state.settings.titleImage || ''}
									after={this.state.settings.titleImage ? <IconButton
										hoverMode="opacity"
										aria-label="Очистить поле"
										onClick={() => this.setState(prevState => ({
											settings: {
												...prevState.settings,
												titleImage: false,
											}
										}))}
									><Icon16Clear/></IconButton> : false}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Текст</Text>
								<Input
									type="text"
									placeholder="Введите текст"
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											textImage: event.target.value,
										}
									}))}
									value={this.state.settings.textImage || ''}
									after={this.state.settings.textImage ? <IconButton
										hoverMode="opacity"
										aria-label="Очистить поле"
										onClick={() => this.setState(prevState => ({
											settings: {
												...prevState.settings,
												textImage: false,
											}
										}))}
									><Icon16Clear/></IconButton> : false}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Выравнивание</Text>
								<Select
									options={['По центру', 'По левому краю', 'По правому краю'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.alignImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											alignImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Оформление</Text>
								<Select
									options={['Светлый акцент', 'Темный акцент'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.colorImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											colorImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={1} separator />
						</details>
						<details className="CustomFormLayoutGroup DetailsWiki">
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Задний фон</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Изображение</Text>
								
								<div style={{
									display: 'flex',
									gap: 8,
								}}>
									<File
										before={<Icon16Picture role="presentation" />}
										after={this.state.settings.image ? <span>{this.state.settings.image}</span> : undefined}
										size="l"
										align="center"
										stretched={true}
										mode="secondary"
										accept="image/png, image/jpeg, image/jpg"
										onChange={(event) => {
											let file = event?.target?.files?.[0] || false;
											if (!FileReader) return;
											if (!file) return;
											if (!file.type.startsWith('image/')) return;
											let fileReader = new FileReader();
											fileReader.onload = () => {
												this.setState(prevState => ({
													settings: {
														...prevState.settings,
														image: file?.name || 'Неизвестное название',
													}
												}), () => this.Image.current.src = fileReader.result);
											};
											fileReader.readAsDataURL(file);
										}}
									/>
									{this.state.settings.image ? <Button size="l" mode="tertiary" before={<Icon24Cancel/>} onClick={() => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											image: false,
										}
									}))}/> : false}
								</div>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Размытие</Text>
								<Select
									options={new Array(11).fill().map((item, key) => key).map((param, key) => ({ label: param ? `${param} степень` : 'Отключено', value: key }))}
									value={this.state.settings.blurImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											blurImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Видимость</Text>
								<Select
									options={new Array(11).fill().map((item, key) => key).map((param, key) => ({ label: `${param * 10}%`, value: key }))}
									value={this.state.settings.opacityImage}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											opacityImage: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={1} separator />
						</details>
						<details className="CustomFormLayoutGroup DetailsWiki" open>
							<summary><Header mode="primary" aside={<Icon24Chevron/>}>Коллекции</Header></summary>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Элементы коллекции</Text>
								<div style={{
									display: 'flex',
									gap: 8,
								}}>
									<Button
										before={<Icon16GridOfFour role="presentation" />}
										size="l"
										align="center"
										stretched={true}
										mode="secondary"
										onClick={() => {
											this.props.options.OpenModal(`description`, {
												setState: this.transmittedSetState,
												options: [...Fragments.map(fragment => ({
													...fragment,
													checked: this.state.searchItemsUsed.includes(fragment.value),
												}))],
											}, 'search');
										}}
									>{this.state.searchItemsUsed.length ? `${this.state.searchItemsUsed.length} ${options.numberForm(this.state.searchItemsUsed.length, ['элемент', 'элемента', 'элементов'])}` : 'Выберите элементы'}</Button>
									{this.state.searchItemsUsed.length ? <Button size="l" mode="tertiary" before={<Icon24Cancel/>} onClick={() => this.setState({ searchItemsUsed: [] })}/> : false}
								</div>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Количество столбцов</Text>
								<Select
									options={new Array(10).fill().map((item, key) => key+1).map((param, key) => ({ label: `${param} ${options.numberForm(param, ['столбец', 'столбца', 'столбцов'])}`, value: key }))}
									value={this.state.settings.columns-1}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											columns: Number(event.target.value)+1,
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Растягивание по ширине</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.stretchedElements}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											stretchedElements: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Указывать название</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.nameElements}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											nameElements: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<FormLayoutGroup mode="horizontal" segmented>
								<Text>Компактный режим</Text>
								<Select
									options={['Нет', 'Да'].map((param, key) => ({ label: param, value: key }))}
									value={this.state.settings.compactMode}
									onChange={(event) => this.setState(prevState => ({
										settings: {
											...prevState.settings,
											compactMode: Number(event.target.value),
										}
									}))}
								/>
							</FormLayoutGroup>
							<Spacing size={4} />
						</details>
					</Group>
					<Group>
						<div className={`ImagePreview ImagePreview--${['light', 'dark'][this.state.settings.colorImage]}`} style={{ display: this.state.searchItemsUsed.length ? 'block' : 'none' }}>
							<div className="ImagePreview__scroll">
								<div className="ImagePreview__container" ref={this.ImagePreview}>
									{this.state.settings.titleImage && <div className="ImagePreview__title" style={{ textAlign: ['center', 'left', 'right'][this.state.settings.alignImage] }}>{this.state.settings.titleImage}</div>}
									{this.state.settings.textImage && <div className="ImagePreview__text" style={{ textAlign: ['center', 'left', 'right'][this.state.settings.alignImage] }}>{this.state.settings.textImage}</div>}
									<div className="ImagePreview__in" style={{ gridTemplateColumns: `repeat(${this.state.settings.columns}, min-content)` }}>
										{Collections.filter(collection => collection.fragments.includesArray(this.state.searchItemsUsed)).map((collection, key) => <React.Fragment key={key}>
											<div className={['CollectionStack', this.state.settings.compactMode ? 'CollectionStack--compact' : false, this.state.settings.stretchedElements ? 'CollectionStack--stretched' : false].filter(className => className).join(' ')} title={collection.title}>
												{this.state.settings.nameElements ? <div className="CollectionStack__header">{collection.label}</div> : false}
												<div className="CollectionStack__in">
													{collection.fragments.filter(fragment => this.state.searchItemsUsed.includes(fragment)).map((fragment, key) => <React.Fragment key={key}>
														<Avatar className={['CollectionStack__item'].filter(className => className).join(' ')} src={`${pathImages}collections/${Number(fragment)}.png`}/>
													</React.Fragment>)}
												</div>
											</div>
										</React.Fragment>)}
									</div>
									<div className="ImagePreview__image">{this.state.settings.image ? <img ref={this.Image} alt="ImagePreview__image" style={{ filter: this.state.settings.blurImage ? `blur(${this.state.settings.blurImage}px)` : false, transform: this.state.settings.blurImage ? `scale(${1+this.state.settings.blurImage/100})` : false, opacity: this.state.settings.opacityImage ? this.state.settings.opacityImage/10 : 0 }}/> : false}</div>
								</div>
							</div>
						</div>
						<Placeholder style={{ paddingTop: this.state.placeholderSize/2+1, paddingBottom: this.state.placeholderSize/2, display: this.state.searchItemsUsed.length ? 'none' : 'flex' }} icon={<Icon56FragmentsOutline/>}>Выберите хотя бы один элемент коллекции</Placeholder>
					</Group>
					<Group>
						<div style={{
							display: 'flex',
							gap: 8,
						}}>
							<Button disabled={!this.state.searchItemsUsed.length} loading={this.state.isSave} size="m" onClick={() => {
								this.setState({ isSave: true });
								setTimeout(async() => {
									await toBlob(this.ImagePreview.current).then((dataUrl) => {
										const anchor = document.createElement('a');
										document.body.appendChild(anchor);
										anchor.href = URL.createObjectURL(dataUrl);
										anchor.download = 'collections.png';
										anchor.click();
									}).catch((error) => this.props.options.openSnackbar({text: error, icon: 'error'}));
									this.setState({ isSave: false });
								}, 0);
							}} stretched mode="commerce">Сохранить изображение</Button>
							<Button disabled={!this.state.searchItemsUsed.length} loading={this.state.isSave} size="m" onClick={() => {
								this.setState({ isSave: true });
								setTimeout(async() => {
									await toBlob(this.ImagePreview.current).then((dataUrl) => window.open(URL.createObjectURL(dataUrl), '_blank')).catch((error) => this.props.options.openSnackbar({text: error, icon: 'error'}));
									this.setState({ isSave: false });
								}, 0);
							}} stretched mode="secondary">Открыть в новом окне</Button>
						</div>
					</Group>
				</> : false}
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;