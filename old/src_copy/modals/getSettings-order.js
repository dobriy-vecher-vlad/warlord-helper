import React from 'react';
import {
	Div,
	ModalPageHeader,
	PanelHeaderSubmit,
	ModalPage,
	List,
	Cell,
	Avatar,
	PanelHeaderButton,
	Footer,
	withModalRootContext
} from '@vkontakte/vkui';

import Skeleton from '../components/skeleton';
import { Icon28CrownOutline } from '@vkontakte/icons';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			profiles: this.props.storeProfiles.filter(profile => profile.id && !profile.main),
			profilesFull: this.props.storeProfilesFull.filter(profile => profile.id && !profile.main),
			storeProfilesDeleted: undefined,
			deletedCount: 0,
		};
	};
	removeProfiles = async(x) => {
		let count = Number((await this.props.options.Storage({key: 'storeProfilesDeleted', defaultValue: '0'})).value) || 0;
		if ((count + this.state.deletedCount) <= 5) {
			this.state.deletedCount++;
			const _profiles = [...this.state.profiles];
			_profiles.splice(x, 1);
			const _profilesFull = [...this.state.profilesFull];
			_profilesFull.splice(x, 1);
			this.setState({ profiles: _profiles, profilesFull: _profilesFull }, () => this.props.updateModalHeight());
		}
		this.setState({ storeProfilesDeleted: count }, () => this.props.updateModalHeight());
	};
	reorderProfiles = ({ from, to }) => {
		const _profiles = [...this.state.profiles];
		_profiles.splice(from, 1);
		_profiles.splice(to, 0, this.state.profiles[from]);
		const _profilesFull = [...this.state.profilesFull];
		_profilesFull.splice(from, 1);
		_profilesFull.splice(to, 0, this.state.profilesFull[from]);
		this.setState({ profiles: _profiles, profilesFull: _profilesFull }, () => this.props.updateModalHeight());
	};
	saveProfiles = async() => {
		let count = Number((await this.props.options.Storage({key: 'storeProfilesDeleted', defaultValue: '0'})).value) || 0;
		if ((count + this.state.deletedCount) <= 6) {
			await this.props.options.Storage({key: 'storeProfilesDeleted', value: String(count+this.state.deletedCount)});
			const _profiles = [...this.state.profiles];
			_profiles.unshift(this.props.storeProfiles[0]);
			Array.prototype.push.apply(_profiles, new Array(this.props.storeProfiles.length-_profiles.length).fill({ id: null }));
			this.props.setState({ storeProfiles: _profiles });
			this.props.options.BackModal();
			this.props.options.storeProfilesRefresh();
		} else {
			this.props.options.CloseModal();
			this.props.options.openSnackbar({text: 'Превышен лимит удаления', icon: 'error'});
		}
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
		let count = Number((await this.props.options.Storage({key: 'storeProfilesDeleted', defaultValue: '0'})).value) || 0;
		this.setState({ storeProfilesDeleted: count }, () => this.props.updateModalHeight());
	};
	render() {
		const { setState, state, options } = this.props;
		const { profiles, profilesFull, storeProfilesDeleted } = this.state;
		return (
			<ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalPageHeader
					before={<PanelHeaderButton onClick={() => options.BackModal()}>Отмена</PanelHeaderButton>}
					after={<PanelHeaderSubmit onClick={() => this.saveProfiles()}/>}
				>Редактирование</ModalPageHeader>}
			>
				<Div style={{ paddingTop: 'var(--vkui--size_base_padding_vertical--regular,12px)', paddingBottom: 'var(--vkui--size_base_padding_vertical--regular,12px)' }}>
					<List>
						{profilesFull.length ? profilesFull.map((profile, x) => {
							if (storeProfilesDeleted == undefined) {
								return (<Skeleton key={x} height={59} borderRadius={0}/>);
							} else {
								let server = state.serverHub.find(server => server.id == profile.server) || state.serverHub[0];
								return (<Cell
									key={x}
									mode={(storeProfilesDeleted + this.state.deletedCount) <= 5 ? "removable" : undefined}
									removePlaceholder="Удалить профиль"
									subtitle={`${server.name}, ${server.company}`}
									draggable={profilesFull.length >= 2}
									hasHover={false}
									hasActive={false}
									before={<Avatar src={profile.photo_100 || 'https://vk.com/images/camera_200.png'} />}
									onRemove={() => this.removeProfiles(x)}
									onDragFinish={({ from, to }) => this.reorderProfiles({ from, to })}
								>{profile.first_name} {profile.last_name}</Cell>);
							}
						}) : this.props.storeProfilesFull.filter(profile => profile.main).map((profile, x) => {
							let server = state.serverHub.find(server => server.id == profile.server) || state.serverHub[0];
							return (<Cell
								key={x}
								disabled
								subtitle={`${server.name}, ${server.company}`}
								before={<Avatar src={profile.photo_100 || 'https://vk.com/images/camera_200.png'} />}
								after={<Icon28CrownOutline/>}
							>{profile.first_name} {profile.last_name}</Cell>);
						})}
					</List>
					<Footer>{profiles.length+1} из {this.props.storeProfilesSize} {options.numberForm(this.props.storeProfilesSize, ['слот', 'слота', 'слотов'])},<br/>возможно удалить {(storeProfilesDeleted + this.state.deletedCount) <= 5 ? 6 - (storeProfilesDeleted + this.state.deletedCount) : 0} {this.props.options.numberForm((storeProfilesDeleted + this.state.deletedCount) <= 5 ? 6 - (storeProfilesDeleted + this.state.deletedCount) : 0, ['профиль', 'профиля', 'профилей'])}</Footer>
				</Div>
			</ModalPage>
		);
	};
};
export default withModalRootContext(MODAL);