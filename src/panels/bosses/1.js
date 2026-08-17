import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	Input,
	Avatar,
	Cell,
	Select,
	CustomSelectOption,
	Button,
	Banner
} from '@vkontakte/vkui';

import Bosses from '../../data/bosses.json';
import { Icon20Like, Icon24AddSquareOutline, Icon24Fire, Icon24Flash, Icon24Like } from '@vkontakte/icons';

let countBossAll = {
	skill_1: 0,
	skill_2: 0,
	skill_3: 0,
	skill_4: 0,
	spell_1: 0,
	spell_2: 0,
	spell_3: 0
};
let newBossID = 5;
let discount = 0;
let discountArray = [{
	title: 'Стандартная сила',
	description: 'Здоровье и атака без изменения',
	value: 0
}, {
	title: 'Слабее на 5%',
	description: 'Здоровье и атака меньше на 5%',
	value: 5
}, {
	title: 'Слабее на 10%',
	description: 'Здоровье и атака меньше на 10%',
	value: 10
}, {
	title: 'Слабее на 15%',
	description: 'Здоровье и атака меньше на 15%',
	value: 15
}, {
	title: 'Слабее на 20%',
	description: 'Здоровье и атака меньше на 20%',
	value: 20
}, {
	title: 'Слабее на 25%',
	description: 'Здоровье и атака меньше на 25%',
	value: 25
}, {
	title: 'Слабее на 30%',
	description: 'Здоровье и атака меньше на 30%',
	value: 30
}, {
	title: 'Слабее на 35%',
	description: 'Здоровье и атака меньше на 35%',
	value: 35
}, {
	title: 'Слабее на 40%',
	description: 'Здоровье и атака меньше на 40%',
	value: 40
}, {
	title: 'Слабее на 45%',
	description: 'Здоровье и атака меньше на 45%',
	value: 45
}, {
	title: 'Слабее на 50%',
	description: 'Здоровье и атака меньше на 50%',
	value: 50
}];

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			count_boss: {clearDamage: 0, totalDamage: 0, leftHP: 0, totalHit: 0},
			newBossCount: 1,
			newBossArray: [

				'Временные боссы',

				Bosses.find(item => item.id === 291),
				Bosses.find(item => item.id === 453),
				Bosses.find(item => item.id === 462),
				Bosses.find(item => item.id === 467),
				Bosses.find(item => item.id === 468),

				'Общие боссы',

				Bosses.find(item => item.id === 67),
				Bosses.find(item => item.id === 69),
				Bosses.find(item => item.id === 290),
				Bosses.find(item => item.id === 313),
				Bosses.find(item => item.id === 337),
				Bosses.find(item => item.id === 459),
				Bosses.find(item => item.id === 341),
				Bosses.find(item => item.id === 460),
				Bosses.find(item => item.id === 390),
				Bosses.find(item => item.id === 393),
				Bosses.find(item => item.id === 458),
				Bosses.find(item => item.id === 455),
				
				'Одиночные боссы',

				Bosses.find(item => item.id === 1),
				Bosses.find(item => item.id === 3),
				Bosses.find(item => item.id === 27),
				Bosses.find(item => item.id === 12),
				Bosses.find(item => item.id === 11),
				Bosses.find(item => item.id === 60),
				Bosses.find(item => item.id === 61),
				Bosses.find(item => item.id === 62),
				Bosses.find(item => item.id === 63),
				Bosses.find(item => item.id === 71),
				Bosses.find(item => item.id === 64),
				Bosses.find(item => item.id === 70),
				Bosses.find(item => item.id === 65),
				Bosses.find(item => item.id === 66),
				Bosses.find(item => item.id === 68),
				Bosses.find(item => item.id === 278),
				Bosses.find(item => item.id === 279),
				Bosses.find(item => item.id === 288),
				Bosses.find(item => item.id === 289),
				Bosses.find(item => item.id === 338),
				Bosses.find(item => item.id === 339),
				Bosses.find(item => item.id === 340),
				Bosses.find(item => item.id === 357),
				Bosses.find(item => item.id === 358),
				Bosses.find(item => item.id === 391),
				Bosses.find(item => item.id === 392),
				Bosses.find(item => item.id === 456),
				Bosses.find(item => item.id === 457),
				Bosses.find(item => item.id === 461),
				Bosses.find(item => item.id === 463),
				Bosses.find(item => item.id === 464),
				Bosses.find(item => item.id === 466),
				Bosses.find(item => item.id === 470),
				Bosses.find(item => item.id === 471),
				Bosses.find(item => item.id === 472),
				Bosses.find(item => item.id === 474),
				Bosses.find(item => item.id === 473),

				'Рейдовые боссы',

				Bosses.find(item => item.id === 287),
				Bosses.find(item => item.id === 284),
				Bosses.find(item => item.id === 285),
				Bosses.find(item => item.id === 286),
				Bosses.find(item => item.id === 342),
				Bosses.find(item => item.id === 454),
				Bosses.find(item => item.id === 465),
				Bosses.find(item => item.id === 469),
			],
			newBossHP: 0,
			newBossDMG: 0
		};
	};
	transmittedSetState = async(name, callback = () => {}) => {
		this.setState(name, callback());
	};
	setNewBoss = async(mode) => {
		const { newBossCount, newBossHP, newBossDMG, newBossArray } = this.state;
		if (mode === 'open') {
			this.setState({newBossHP: 1});
			this.setState({newBossDMG: 1});
			this.props.options.OpenModal(`description`, {setState: this.transmittedSetState, setNewBoss: this.setNewBoss}, 25);
		}
		if (mode === 'create') {
			this.props.options.BackModal();
			Bosses.push({
				id: Bosses.length,
				name: `Свой противник #${newBossCount}`,
				description: 'Новая угроза Эрмуна',
				hp: newBossHP,
				dmg: newBossDMG,
				background: 'bosses/backgrounds/19.png',
				image: 'bosses/images/0.png',
				icon: 'bosses/icons/0.png'
			});
			this.setState({ newBossCount: newBossCount+1 });
			newBossID = Bosses.length-1;
			if (!newBossArray.includes('Свои боссы')) newBossArray.push('Свои боссы');
			newBossArray.push(Bosses[Bosses.length-1]);
			this.CalcBoss();
		}
	};
	isCalcBoss = (e, id) => {
		countBossAll[id] = e.target.value;
		this.CalcBoss();
	};
	CalcBoss = async() => {
		let mode = 2;
		let Boss = Bosses[newBossID];
		let BossDamage = Boss.dmg-(Boss.dmg/100*discount); //урон босса
		let BossHealth = Boss.hp-(Boss.hp/100*discount); //здоровье босса
		let MyDamage = Number(countBossAll.skill_2); //урон игрока
		let MyHealth = Number(countBossAll.skill_1); //здоровье игрока
		let MyBonus = Number(countBossAll.skill_3); //невидимый удар
		let MyHealthBonus = Number(countBossAll.skill_4); //мастер целитель
		let MySpell1 = Number(countBossAll.spell_2); //свитки молнии
		let MySpell2 = Number(countBossAll.spell_3); //свитки огня
		let MySpell3 = Number(countBossAll.spell_1); //банки здоровья
		let MySpell1DamageHelp = Math.floor(MyDamage * 1.5);
		let MySpell2DamageHelp = Math.floor(MyDamage * 3);
		let MySpell3DamageHealth = MySpell3 * (MyHealthBonus * 3 + 250);
		let HitNumber = Math.ceil((MyHealth + MySpell3DamageHealth) / BossDamage) == 0 ? 1 : Math.ceil((MyHealth + MySpell3DamageHealth) / BossDamage);
		let HitNumberSpell = MySpell1 + MySpell2 > HitNumber ? HitNumber : MySpell1 + MySpell2;
		let HitMySpell1,
			HitMySpell2,
			MySpell1Damage,
			MySpell2Damage,
			MySpellHelpAll,
			MySpellHelp;
		if (mode == 1) {
			HitMySpell1 = MySpell1 > HitNumberSpell ? HitNumberSpell : MySpell1;
			MySpell1Damage = HitMySpell1 * MySpell1DamageHelp;
			MySpellHelpAll = HitNumberSpell - HitMySpell1;
			MySpellHelp = MySpellHelpAll <= 0 ? 0 : MySpellHelpAll;
			MySpell2Damage = MySpellHelp * MySpell2DamageHelp;
		} else {
			HitMySpell2 = MySpell2 > HitNumberSpell ? HitNumberSpell : MySpell2;
			MySpell2Damage = HitMySpell2 * MySpell2DamageHelp;
			MySpellHelpAll = HitNumberSpell - HitMySpell2;
			MySpellHelp = MySpellHelpAll <= 0 ? 0 : MySpellHelpAll;
			MySpell1Damage = MySpellHelp * MySpell1DamageHelp;
		}
		let MyClearDamage = MyDamage * (HitNumber - HitNumberSpell);
		let MyInvisibleDamageHit = MyBonus == 0 ? 0 : (MyBonus * 7) + MyDamage;
		let MyInvisibleDamage = Math.floor((HitNumber + 9) / 9);
		let ResultMyInvisibleDamage = MyInvisibleDamageHit * MyInvisibleDamage;
		let ResultMyAllDamage = MyClearDamage + ResultMyInvisibleDamage + MySpell1Damage + MySpell2Damage;
		let ResultBossTotalHP = BossHealth - ResultMyAllDamage;
		this.setState({count_boss: {
			clearDamage: MyClearDamage,
			totalDamage: ResultMyAllDamage,
			leftHP: ResultBossTotalHP,
			totalHit: HitNumber
		}});
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
		countBossAll = {
			skill_1: (Number(this.props.game._end) + Number(this.props.game._endi)) * 15, 
			skill_2: Number(this.props.game._dmgi), 
			skill_3: Number(this.props.game._s3), 
			skill_4: Number(this.props.game._s4),
			spell_1: 0, 
			spell_2: 0, 
			spell_3: 0, 
		};
		this.CalcBoss();
	};
	async componentDidUpdate() {
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
	};
	async shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.state.snackbar!=this.state.snackbar&&nextState.snackbar==this.state.snackbar) this.setState({ snackbar: nextProps.state.snackbar });
		if (nextState.snackbar!=this.state.snackbar) return true;
		return false;
	};
	render() {
		const { state, options, parent, game } = this.props;
		const pathImages = 'https://warlord-helper.website.yandexcloud.net/media/images/';
		const title = 'Калькулятор';
		const description = 'Боссы';
		const avatar = 'labels/8.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						<div style={{display: 'flex', alignItems: 'center', padding: 24}}>
							{state.isDesktop && game && <Avatar size={128} mode="app" src={`${pathImages}bosses/persona_full.png`} style={{marginRight: 32}}>
								<div className="GamePersona" style={{backgroundImage: `url(${pathImages}bosses/persona_1_${game._a1}.png)`}}></div>
								<div className="GamePersona" style={{backgroundImage: `url(${pathImages}bosses/persona_2_${game._a2}.png)`}}></div>
								<div className="GamePersona" style={{backgroundImage: `url(${pathImages}bosses/persona_3_${game._a3}.png)`}}></div>
							</Avatar>}
							<div>
								<CardGrid size="m">
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_1.png`}/>} defaultValue={Number((Number(game._end) + Number(game._endi)) * 15)} min={0} onChange={(e) => this.isCalcBoss(e, 'skill_1')} type="number" placeholder="Здоровье"/>
									</Card>
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_2.png`}/>} defaultValue={Number(game._dmgi)} min={0} onChange={(e) => this.isCalcBoss(e, 'skill_2')} type="number" placeholder="Атака"/>
									</Card>
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_4.png`}/>} defaultValue={Number(game._s3)} min={0} onChange={(e) => this.isCalcBoss(e, 'skill_3')} type="number" placeholder="Невидимый удар"/>
									</Card>
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_5.png`}/>} defaultValue={Number(game._s4)} min={0} onChange={(e) => this.isCalcBoss(e, 'skill_4')} type="number" placeholder="Мастер целитель"/>
									</Card>
								</CardGrid>
								<Spacing size={8} />
								<CardGrid size="s">
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_6.png`}/>} defaultValue={Number(countBossAll.spell_1)} min={0} onChange={(e) => this.isCalcBoss(e, 'spell_1')} type="number" placeholder="Целебные зелья"/>
									</Card>
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_7.png`}/>} defaultValue={Number(countBossAll.spell_2)} min={0} onChange={(e) => this.isCalcBoss(e, 'spell_2')} type="number" placeholder="Свитки молнии"/>
									</Card>
									<Card>
										<Input after={<Avatar size={24} mode="app" src={`${pathImages}bosses/talent_8.png`}/>} defaultValue={Number(countBossAll.spell_3)} min={0} onChange={(e) => this.isCalcBoss(e, 'spell_3')} type="number" placeholder="Свитки огня"/>
									</Card>
								</CardGrid>
							</div>
						</div>
						<Spacing size={8} />
					</div>
					{state.isDesktop ? <CardGrid size="m" style={{display: 'flex', flexWrap: 'nowrap', flexDirection: 'row', alignItems: 'center', gap: 8}}>
						<Select
							value={newBossID}
							searchable={true}
							onChange={(e) => {newBossID = e.target.value, this.CalcBoss()}}
							placeholder="Не выбран" 
							options={this.state.newBossArray.map((data, x) => typeof data == 'string' ? ({ label: data, value: options.numberRandom(1, 999999), disabled: true }) : ({ label: data.name, description: data.description, value: Bosses.indexOf(data) == -1 ? options.numberRandom(1, 999999) : Bosses.indexOf(data), avatar: `${pathImages}${data.icon}` }) )}
							renderOption={({ option, ...restProps }) => (
								option.description ? <CustomSelectOption {...restProps} before={<Avatar size={24} src={option.avatar} />} description={option.description}/> : <CustomSelectOption {...restProps}/>
							)}
						/>
						<Button stretched size="l" style={{minWidth: 'fit-content'}} mode="secondary" onClick={() => this.setNewBoss('open')}>Создать своего</Button>
						<Select
							value={discount}
							onChange={(e) => {discount = e.target.value, this.CalcBoss()}}
							placeholder="Не выбрана" 
							options={discountArray.map((data, x) => ({ label: data.title, description: data.description, value: data.value }))}
							renderOption={({ option, ...restProps }) => (
								<CustomSelectOption {...restProps} description={option.description}/>
							)}
						/>
					</CardGrid>:<><CardGrid size="m" style={{display: 'flex', flexWrap: 'nowrap', flexDirection: 'row', alignItems: 'center', gap: 8}}>
						<Select
							style={{width: '50%'}}
							value={newBossID}
							searchable={true}
							onChange={(e) => {newBossID = e.target.value, this.CalcBoss()}}
							placeholder="Не выбран" 
							options={this.state.newBossArray.map((data, x) => typeof data == 'string' ? ({ label: data, value: options.numberRandom(1, 999999), disabled: true }) : ({ label: data.name, description: data.description, value: Bosses.indexOf(data) == -1 ? options.numberRandom(1, 999999) : Bosses.indexOf(data), avatar: `${pathImages}${data.icon}` }))}
							renderOption={({ option, ...restProps }) => (
								option.description ? <CustomSelectOption {...restProps} before={<Avatar size={24} src={option.avatar} />} description={option.description}/> : <CustomSelectOption {...restProps}/>
							)}
						/>
						<Button style={{width: '50%'}} stretched size="l" mode="secondary" onClick={() => this.setNewBoss('open')}>Создать своего</Button>
					</CardGrid><Spacing size={8} /><CardGrid><Select
						style={{width: '100%'}}
						value={discount}
						onChange={(e) => {discount = e.target.value, this.CalcBoss()}}
						placeholder="Не выбрана" 
						options={discountArray.map((data, x) => ({ label: data.title, description: data.description, value: data.value }))}
						renderOption={({ option, ...restProps }) => (
							<CustomSelectOption {...restProps} description={option.description}/>
						)}
					/></CardGrid></>}
					<Spacing size={8} />
					{[Bosses[newBossID]].map((item, x) => 
						<React.Fragment key={x}>
							<Banner
								className="BannerBoss"
								mode="image"
								size="m"
								header={item.name}
								subheader={item.description}
								actions={
									<CardGrid size="m">
										<Card className="CardWithAvatar">
											<Cell description="Здоровье">{options.numberSpaces(item.hp-(item.hp/100*discount))}</Cell>
										</Card>
										<Card className="CardWithAvatar">
											<Cell description="Атака">{options.numberSpaces(item.dmg-(item.dmg/100*discount))}</Cell>
										</Card>
										<Card className="CardWithAvatar">
											<Cell description="Чистый урон">{options.numberSpaces(this.state.count_boss.clearDamage)}</Cell>
										</Card>
										<Card className="CardWithAvatar">
											<Cell description="Общий урон">{options.numberSpaces(this.state.count_boss.totalDamage)}</Cell>
										</Card>
										<Card className="CardWithAvatar">
											<Cell description="Остаток здоровья">{options.numberSpaces(this.state.count_boss.leftHP < 0 ? 0 : this.state.count_boss.leftHP)}</Cell>
										</Card>
										<Card className="CardWithAvatar">
											<Cell description="Количество ударов">{options.numberSpaces(this.state.count_boss.totalHit)}</Cell>
										</Card>
									</CardGrid>
								}
								background={
									<React.Fragment>
										<img className="BannerBossPerson" src={`${pathImages}${item.image}`}/>
										<div className="BannerBossBackground" style={{backgroundImage: `url(${pathImages}${item.background})`}}/>
									</React.Fragment>
								}
							/>
						</React.Fragment>
					)}
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;