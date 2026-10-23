import React from 'react';
import {
	Spacing,
	Panel,
	Group,
	CardGrid,
	Card,
	InfoRow,
	FormItem,
	Slider,
	Input,
} from '@vkontakte/vkui';
import { Icon20DiamondOutline, Icon20ShareExternalOutline } from '@vkontakte/icons';

class PANEL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			snackbar: null,
			topaz: 1,
			amethyst: 1
		};
	};
	async componentDidMount() {
		console.log('[PANEL] >', this.props.id);
		!this.props.state.isDesktop && this.props.options.updateFixedLayout();
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
		const { state, options, parent } = this.props;
		const title = 'Калькулятор';
		const description = 'Гильдия';
		const avatar = 'labels/18.png';
		return (
			<Panel id={this.props.id}>
				{!state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
				<Group>
					<div className='Sticky Sticky__top withSeparator'>
						{state.isDesktop && options.getPanelHeader(title, description, avatar, this.props.id, parent)}
						{options.getRichCellDescription(<React.Fragment>Аметисты и Топазы можно получить только вкладываясь в улучшения навыков гильдии и при пополнении казны<br/>Пополнять казну гильдии можно только в определённом количестве</React.Fragment>)}
						<Spacing size={8} />
					</div>
					<CardGrid size="m">
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(1)} ${options.numberForm(1, ['топаз', 'топаза', 'топазов'])}`}><span>{options.numberSpaces(75*1)} золота</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemOrange)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(1)} ${options.numberForm(1, ['аметист', 'аметиста', 'аметистов'])}`}><span>{options.numberSpaces(55*1)} серебра</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemIndigo)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(5)} ${options.numberForm(5, ['топаз', 'топаза', 'топазов'])}`}><span>{options.numberSpaces(75*5)} золота</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemOrange)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(5)} ${options.numberForm(5, ['аметист', 'аметиста', 'аметистов'])}`}><span>{options.numberSpaces(55*5)} серебра</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemIndigo)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(25)} ${options.numberForm(25, ['топаз', 'топаза', 'топазов'])}`}><span>{options.numberSpaces(75*25)} золота</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemOrange)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(25)} ${options.numberForm(25, ['аметист', 'аметиста', 'аметистов'])}`}><span>{options.numberSpaces(55*25)} серебра</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemIndigo)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(50)} ${options.numberForm(50, ['топаз', 'топаза', 'топазов'])}`}><span>{options.numberSpaces(75*50)} золота</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemOrange)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header={`${options.numberSpaces(50)} ${options.numberForm(50, ['аметист', 'аметиста', 'аметистов'])}`}><span>{options.numberSpaces(55*50)} серебра</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemIndigo)' }}/>
						</Card>
					</CardGrid>
					<CardGrid size="m">
						<Card style={{backgroundColor: "transparent"}}>
							<FormItem top="Необходимое количество Топазов">
								<Slider
									step={1}
									min={0}
									max={50000}
									value={Number(this.state.topaz)}
									onChange={topaz => this.setState({topaz})}
								/>
							</FormItem>
							<FormItem>
								<Input value={String(this.state.topaz)} min={1} max={1000000} onChange={(e) => this.setState({ topaz: e.target.value })} type="number"/>
							</FormItem>
						</Card>
						<Card style={{backgroundColor: "transparent"}}>
							<FormItem top="Необходимое количество Аметистов">
								<Slider
									step={1}
									min={0}
									max={50000}
									value={Number(this.state.amethyst)}
									onChange={amethyst => this.setState({amethyst})}
								/>
							</FormItem>
							<FormItem>
								<Input value={String(this.state.amethyst)} min={1} max={1000000} onChange={(e) => this.setState({ amethyst: e.target.value })} type="number"/>
							</FormItem>
						</Card>
					</CardGrid>
					<CardGrid size="m">
						<Card className="beautifulCard" mode="outline">
							<InfoRow header="Необходимо серебра"><span>{options.numberSpaces(this.state.topaz*75)} ед.</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemOrange)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header="Необходимо серебра"><span>{options.numberSpaces(this.state.amethyst*55)} ед.</span></InfoRow>
							<Icon20DiamondOutline style={{['--fill']: 'var(--systemCyan)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header="Пополнение казны"><span>{options.numberSpaces(Math.ceil(this.state.topaz*75/3750))} раз</span></InfoRow>
							<Icon20ShareExternalOutline style={{['--fill']: 'var(--systemYellow)' }}/>
						</Card>
						<Card className="beautifulCard" mode="outline">
							<InfoRow header="Пополнение казны"><span>{options.numberSpaces(Math.ceil(this.state.amethyst*55/2750))} раз</span></InfoRow>
							<Icon20ShareExternalOutline style={{['--fill']: 'var(--systemYellow)' }}/>
						</Card>
					</CardGrid>
				</Group>
				{this.state.snackbar}
			</Panel>
		);
	};
};
export default PANEL;