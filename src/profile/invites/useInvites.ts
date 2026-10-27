import { useEffect, useRef, useState } from 'react';
import { useAnyModal } from '../../store/modal';
import { useRefreshRequest, useSelectedOwner } from './battleStore';
import { InvitesPoller, emptyInvites, type InvitesState } from './poller';

export { POLL_MS } from './poller';

/**
 * Приглашения друзей на боссов в текущий момент: опрос (см. `InvitesPoller`) живёт, пока открыта страница; при переключении
 * профиля начинается заново, данные прежнего профиля не показываются. Принудительное обновление (`refresh`, а также
 * запрос извне, например после победы над боссом) проверяет и то, не идёт ли уже бой.
 */
export function useInvites() {
	const owner = useSelectedOwner();
	const [state, setState] = useState<InvitesState>(() => emptyInvites(owner));
	const [loading, setLoading] = useState(true);
	const poller = useRef<InvitesPoller | null>(null);

	useEffect(() => {
		const instance = new InvitesPoller(owner, { state: setState, loading: setLoading });
		poller.current = instance;
		instance.start();
		return () => {
			instance.stop();
			poller.current = null;
		};
	}, [owner]);

	// Пока поверх страницы открыто окно, список по таймеру не обновляется (запросы игре общие и ограничены по частоте)
	const covered = useAnyModal();
	useEffect(() => {
		if (covered) poller.current?.pause();
		else poller.current?.resume();
	}, [covered, owner]);

	// Принудительное обновление извне
	const request = useRefreshRequest();
	const requested = useRef(request);
	useEffect(() => {
		if (requested.current === request) return;
		requested.current = request;
		void poller.current?.poll();
	}, [request]);

	// Данные другого профиля (после переключения) не показываются, пока не придут свои
	const current = state.owner === owner ? state : emptyInvites(owner);
	return { ...current, loading, refresh: () => poller.current?.poll() };
}
