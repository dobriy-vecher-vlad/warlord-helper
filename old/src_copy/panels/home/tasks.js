import bridge from "@vkontakte/vk-bridge";
import React, { useState, useEffect } from 'react';
import {
	Panel,
	PanelHeader,
	PanelHeaderBack,
	PanelHeaderButton,
	Group,
	Placeholder,
	Spacing,
	PanelSpinner,
	RichCell,
	Avatar,
	Button,
	Textarea,
	Card,
	Spinner,
	CardGrid
} from '@vkontakte/vkui';
import {
	Icon28CopyOutline,
	Icon56LikeOutline
} from '@vkontakte/icons';

const Tasks = props => {
	const [tasks, setTasks] = useState(null);
	const [freeDays, setFreeDays] = useState(null);
	const deleteData = async() => {
		await props.Storage({key: 'isFavorite', delete: true});
	};
	const VKWebAppAddToFavorites = async(days = 0) => {
		await bridge.send("VKWebAppAddToFavorites").then(async(response) => {
			let isFavorite = await props.Storage({key: 'isFavorite', defaultValue: 'true'});
			if (isFavorite.code == 3 && isFavorite.value == 'true') {
				try {
					console.log('WIN', days);
					await props.Storage({key: 'freeDays', value: days + 7});
					setTasks(prevState => ({
						...prevState,
						freeDays: days + 7,
						favorite: true
					}));
				} catch (error) {
					console.warn(error);
				}
			} else {
				setTasks(prevState => ({
					...prevState,
					favorite: true
				}));
			}
		}).catch((error) => {});
	};
	useEffect(async() => {
		let isFavorite = Number(props.params.queryParams.vk_is_favorite) == 1;
		let freeDays = await props.Storage({key: 'freeDays', defaultValue: '0'});
		setTasks({
			favorite: isFavorite,
			freeDays: Number(freeDays.value)
		});
		if (isFavorite) {
			await VKWebAppAddToFavorites(Number(freeDays.value));
		}
	}, []);
	return (
		<Panel id={props.id}>
			{!props.isDesktop && <PanelHeader left={<PanelHeaderBack onClick={() => props.setActivePanel(props.view)}/>}>Рефералы</PanelHeader>}
			<Group>
				{props.isDesktop && <PanelHeader className='HeaderFix' fixed={false} separator={true} left={<PanelHeaderBack onClick={() => props.setActivePanel(props.view)}/>} right={<PanelHeaderButton onClick={() => bridge.send("VKWebAppCopyText", {"text": `https://vk.com/app7787242#view=${props.activeStory}&panel=${props.activePanel}`}, props.openSnackbar({text: 'Ссылка на подраздел скопирована', icon: 'done'}))}><Icon28CopyOutline/></PanelHeaderButton>}>Рефералы</PanelHeader>}
				<Placeholder 
					icon={<Icon56LikeOutline width="56" height="56" style={{color: 'var(--systemRed)'}}/>}
					header="В разработке"
				>
					Функция ещё не готова,<br/>но совсем скоро всё будет
				</Placeholder>
				<Spacing separator size={16}/>
				{tasks == null ? <PanelSpinner /> : <React.Fragment>
					<RichCell
						onClick={VKWebAppAddToFavorites}
						style={{opacity: tasks.favorite ? '.5' : '1'}}
						disabled={tasks.favorite}
						className="RichCell--new"
						multiline
						before={<Avatar mode="app" size={48} src="https://warlord-helper.website.yandexcloud.net/media/helpers/group_avatar.png" />}
						caption="+7 дней подписки"
						after={tasks.favorite ? <span style={{color: 'var(--dynamic_green)'}}>Выполнено</span> : <span style={{color: 'var(--dynamic_blue)'}}>Выполнить</span>}
					>Добавь в избранное</RichCell>
					<RichCell
						onClick={VKWebAppAddToFavorites}
						className="RichCell--new"
						multiline
						before={<Avatar mode="app" size={48} src="https://warlord-helper.website.yandexcloud.net/media/helpers/group_avatar.png" />}
						caption="+7 дней подписки"
						after={!tasks.favorite ? <span style={{color: 'var(--dynamic_green)'}}>Выполнено</span> : <span style={{color: 'var(--dynamic_blue)'}}>Выполнить</span>}
					>Добавь в избранное</RichCell>
					<Spacing separator size={16}/>
					<CardGrid size="l">
						<Card className="Card__Item">
							<RichCell
								onClick={VKWebAppAddToFavorites}
								style={{opacity: tasks.favorite ? '.5' : '1'}}
								disabled={tasks.favorite}
								before={<div className="Card__image">
									<span className="Card__imageTitle prominent">7 дней</span>
									<Spinner size="regular" className="Card__imagePreload" />
									<Avatar style={{objectFit: "cover"}} mode="image" src="https://sun3-10.userapi.com/hIQC5oknjCuZo-QmeNMqucB7UjI9XPOfW5QKTw/uTJDYTQrMIA.jpg?ava=1" size={60}/>
								</div>}
								caption="Добавь приложение в закладки и получи бесплатные дни"
								after={tasks.favorite ? <span style={{color: 'var(--dynamic_green)'}}>Выполнено</span> : <span style={{color: 'var(--dynamic_blue)'}}>Выполнить</span>}
							>Добавь в избранное</RichCell>
						</Card>
					</CardGrid>
				</React.Fragment>}
				<Spacing separator size={16}/>
				<Textarea readOnly value={JSON.stringify(props.params.queryParams, null, '\t')}></Textarea>
				<Spacing size={8}/>
				<Textarea readOnly value={JSON.stringify(tasks, null, '\t')}></Textarea>
				<Spacing size={8}/>
				<Button onClick={deleteData}>deleteData</Button>
				<Button onClick={VKWebAppAddToFavorites}>VKWebAppAddToFavorites</Button>
			</Group>
			{props.snackbar}
		</Panel>
	)
};
export default Tasks;