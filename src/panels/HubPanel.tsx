import { useEffect, useState } from 'react';
import { Group, Panel, Spacing } from '@vkontakte/vkui';
import { Icon28DonateCircleFillYellow, Icon28GraphOutline } from '@vkontakte/icons';
import { useIsDesktop } from '../app/layout';
import { Divider } from '../components/Divider';
import { HubHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { BannerGallery, BannerPlaceholder } from '../components/wiki/BannerGallery';
import { NavCell } from '../components/wiki/NavCell';
import { numberForm } from '../lib/format';
import { hasRating, useSession } from '../profile/session';
import { openModal } from '../store/modal';
import { openPanel } from '../store/nav';
import type { HubCell, HubStory } from '../stories/registry';
import type { HubData } from '../stories/hubData';
import { loadHubData, loadedHubData, preloadSection } from './sections';

/** Картинки баннера и счётчики раздела: приходят вместе с модулем раздела, до этого null. */
function useHubData(section: HubStory['id']): HubData | null {
	const [data, setData] = useState(() => loadedHubData(section));
	useEffect(() => {
		let alive = true;
		void loadHubData(section).then(
			(loaded) => alive && setData(loaded),
			() => undefined,
		);
		return () => {
			alive = false;
		};
	}, [section]);
	return data;
}

/** Главная панель вики-раздела: баннеры и список подразделов со счётчиками. */
export function HubPanel({ id, story }: { id: string; story: HubStory }) {
	const isDesktop = useIsDesktop();
	// Раздел начинает грузиться, пока пользователь смотрит на список подразделов
	useEffect(() => void preloadSection(story.id).catch(() => undefined), [story.id]);
	const data = useHubData(story.id);
	const header = <HubHeader title={story.title} story={story.id} />;
	const profileOn = useSession((s) => s.status === 'ready');
	const isDonut = useSession((s) => s.isDonut);
	// Анализ — только для профилей на серверах ВКонтакте
	const analysis = useSession((s) => s.status === 'ready' && hasRating(s));
	const donutIcon = <Icon28DonateCircleFillYellow width={24} height={24} />;
	/** Счётчик справа: у ячеек профиля без подписки — значок VK Donut. */
	const indicator = (cell: HubCell) => {
		// Количество приходит вместе с модулем раздела; пока он грузится, на месте счётчика скелетон
		const counter = () =>
			data
				? { count: data.counts[cell.panel] ?? 0, countLabel: numberForm(data.counts[cell.panel] ?? 0, cell.forms) }
				: { count: <Skeleton width={36} height={16} />, countLabel: <Skeleton width={52} height={14} /> };
		if (!cell.profile) return counter();
		if (!isDonut) return { count: donutIcon };
		return cell.profile === 'count' ? counter() : {};
	};
	return (
		<Panel id={id}>
			{!isDesktop && header}
			<Group mode="plain" className="AppGroup HubGroup">
				{isDesktop && header}
				{data ? <BannerGallery images={data.images} title={story.banner.title} subtitle={story.banner.subtitle} /> : <BannerPlaceholder />}
				<Spacing size={6} />
				{story.analysis && analysis && (
					<>
						<NavCell icon={<Icon28GraphOutline />} title={story.analysis.title} onClick={() => openModal(story.analysis!.modal)} />
						<Divider size={12} />
					</>
				)}
				{story.cells
					.filter((cell) => !cell.profile || profileOn)
					.map((cell) => (
						<NavCell key={cell.panel} title={cell.title} subtitle={cell.subtitle} image={`labels/${cell.label}.png`} {...indicator(cell)} onClick={() => openPanel(cell.panel)} />
					))}
			</Group>
		</Panel>
	);
}
