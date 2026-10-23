import { notify } from '../app/notify';
import { storageGetWithDefault, storageSet } from '../lib/storage';
import { closeModal, openModal } from '../store/modal';
import { EMPTY_DRAFT, getSession, setSession, type ProfileSlot } from './session';
import { reloadProfile } from './sessionLoad';

/** Номер последнего выбора профиля: ответ устаревшего выбора (быстро листали слайды) не должен затирать актуальный. */
let selection = 0;

/** Выбрать профиль (слайд галереи). Пустой слот открывает добавление профиля, без подписки — окно подписки. */
export async function selectProfile(index: number) {
	const state = getSession();
	const target = state.profiles[index];
	if (!target) {
		openModal('alert', {
			header: 'Ошибка при обработке запроса',
			subheader: `Профиль под номером ${index} вызывает ошибки, попробуйте сменить его ID или обратитесь за помощью в группу`,
		});
		return;
	}
	const mine = ++selection;
	setSession({ busy: true });
	try {
		if (target.id) {
			const profiles = [...state.profiles];
			const profile = { ...target };
			if (profile.server == 0) profile.server = 1;
			if (profile.login == 0) profile.login = profile.id;
			profiles[index] = profile;
			setSession({ profiles, index, draft: { id: profile.id, login: profile.login ?? null, auth: profile.auth ?? null, server: profile.server ?? null } });
			await reloadProfile(profile.id, () => mine !== selection);
		} else if (state.isDonut) {
			setSession({ draft: EMPTY_DRAFT });
			openModal('settings', { mode: 'add' });
		} else {
			openModal('donut');
		}
	} finally {
		// Экран загрузки снимает последний выбор; при ошибке он не должен остаться навсегда
		if (mine === selection) setSession({ busy: false });
	}
}

/** Обновить список профилей (потянуть вниз). */
export async function refreshProfiles() {
	setSession({ fetching: true });
	try {
		const state = getSession();
		await storageSet('storeProfiles', JSON.stringify(state.profiles));
		const lastFilled = state.profiles.length - [...state.profiles].reverse().findIndex((profile) => profile.id) - 1;
		await selectProfile(state.profiles[state.index]?.id ? state.index : lastFilled ? lastFilled : 0);
	} finally {
		setSession({ fetching: false });
	}
}

/** Новый профиль из черновика настроек в первый свободный слот. */
export async function addProfile() {
	const { draft, profiles } = getSession();
	if (profiles.find((profile) => profile.id == Number(draft.id))) {
		notify({ text: 'Профиль уже существует', icon: 'error' });
		return;
	}
	if (Number(draft.id) == 0 || draft.login == null || draft.auth == null || draft.server == null) {
		notify({ text: 'Указаны не все параметры', icon: 'error' });
		return;
	}
	const slot = profiles.findIndex((profile) => profile.id == null);
	if (slot === -1) {
		notify({ text: 'Нет свободных мест', icon: 'error' });
		return;
	}
	const next = [...profiles];
	next[slot] = { server: Number(draft.server), id: Number(draft.id), login: draft.login, auth: draft.auth };
	setSession({ profiles: next });
	await storageSet('storeProfiles', JSON.stringify(next));
	closeModal();
	notify({ text: 'Профиль добавлен', icon: 'done' });
	await selectProfile(slot);
}

/** Сохранить настройки выбранного профиля. */
export async function saveSettings() {
	const { draft, profiles, index } = getSession();
	const id = Number(draft.id);
	if (!id || draft.server == null || !Number.isFinite(Number(draft.server))) {
		notify({ text: 'Указаны не все параметры', icon: 'error' });
		return;
	}
	const next = [...profiles];
	next[index] = { ...next[index], login: draft.login || id, auth: draft.auth, id, server: Number(draft.server) };
	setSession({ profiles: next });
	await storageSet('storeProfiles', JSON.stringify(next));
	closeModal();
	await selectProfile(index);
	notify({ text: 'Настройки сохранены', icon: 'done' });
}

/** Сколько профилей уже удалено: удалять можно не больше шести раз. */
export async function deletedCount(): Promise<number> {
	return Number((await storageGetWithDefault('storeProfilesDeleted', '0')).value) || 0;
}

/** Удалить выбранный профиль. */
export async function removeProfile() {
	const count = await deletedCount();
	if (count > 5) {
		closeModal();
		notify({ text: 'Превышен лимит удаления', icon: 'error' });
		return;
	}
	await storageSet('storeProfilesDeleted', String(count + 1));
	const { profiles, index } = getSession();
	const next = [...profiles];
	next.splice(index, 1);
	next.push({ id: null });
	setSession({ profiles: next, profilesFull: [...next] });
	await storageSet('storeProfiles', JSON.stringify(next));
	closeModal();
	notify({ text: 'Профиль удалён', icon: 'done' });
	await selectProfile(index - 1);
}

/** Новый порядок дополнительных профилей (окно «Редактирование»); основной профиль всегда первый. */
export async function saveOrder(rest: ProfileSlot[], deleted: number) {
	const count = await deletedCount();
	if (count + deleted > 6) {
		closeModal();
		notify({ text: 'Превышен лимит удаления', icon: 'error' });
		return false;
	}
	await storageSet('storeProfilesDeleted', String(count + deleted));
	const { profiles } = getSession();
	const next: ProfileSlot[] = [...profiles.slice(0, 1), ...rest];
	while (next.length < profiles.length) next.push({ id: null });
	setSession({ profiles: next });
	return true;
}
