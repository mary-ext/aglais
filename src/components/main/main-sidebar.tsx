import { lazy } from 'solid-js';

import { useSession } from '~/lib/states/session';

const MainSidebarAuthenticatedLazy = lazy(() => import('./main-sidebar-authenticated'));
const MainSidebarPublicLazy = lazy(() => import('./main-sidebar-public'));

const MainSidebar = () => {
	const { currentAccount } = useSession();

	if (currentAccount) {
		return <MainSidebarAuthenticatedLazy />;
	} else {
		return <MainSidebarPublicLazy />;
	}
};

export default MainSidebar;
