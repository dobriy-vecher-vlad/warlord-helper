import type { ReactElement } from 'react';
import type { StoryId } from '../store/nav';

/** Подразделы раздела по id панели. */
export type SectionPanels = Record<string, (props: { id: string }) => ReactElement>;

/** Общие свойства подраздела: раздел-родитель, подпись в шапке и иконка из media/images/labels/. */
export const sectionBase = (parent: StoryId, description: string) => (id: string, title: string, label: number) => ({
	id,
	parent,
	title,
	description,
	avatar: `labels/${label}.png`,
});
