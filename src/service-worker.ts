import { createSignal } from 'solid-js';
import { registerSW } from 'virtual:pwa-register';

const shouldInstall = async (): Promise<boolean> => {
	if (matchMedia('(display-mode: standalone)').matches) {
		return true;
	}

	// Just in case.
	const registration = await navigator.serviceWorker.getRegistration();
	return !!registration;
};

export const enum SWStatus {
	NOT_INSTALLED = 0,
	INSTALLING = 1,
	UPDATING = 2,
	NEED_REFRESH = 3,
	INSTALLED = 4,
}

const [swStatus, setSwStatus] = createSignal<SWStatus>(SWStatus.NOT_INSTALLED);

let updateSW = () => {};

shouldInstall().then(async (canInstall) => {
	if (!canInstall) {
		return;
	}

	let alreadyInstalled = !!(await navigator.serviceWorker.getRegistration());

	updateSW = registerSW({
		onRegisteredSW() {
			setSwStatus(SWStatus.INSTALLED);
		},
		onBeginUpdate() {
			setSwStatus(alreadyInstalled ? SWStatus.UPDATING : SWStatus.INSTALLING);
		},
		onNeedRefresh() {
			setSwStatus(SWStatus.NEED_REFRESH);
		},
		onOfflineReady() {
			setSwStatus(SWStatus.INSTALLED);
			alreadyInstalled = true;
		},
	});
});

export { swStatus, updateSW };
