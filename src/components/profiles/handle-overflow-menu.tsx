import type { AppBskyActorDefs } from '@atcute/client/lexicons';

import { useModalContext } from '~/globals/modals';

import { truncateMiddle } from '~/lib/utils/strings';

import ClipboardOutlinedIcon from '~/components/icons-central/clipboard-outline';
import OpenInNewOutlinedIcon from '~/components/icons-central/open-in-new-outline';
import * as Menu from '~/components/menu';

export interface HandleOverflowMenuProps {
	anchor: HTMLElement;
	/** Expected to be static */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const HandleOverflowMenu = (props: HandleOverflowMenuProps) => {
	const { close } = useModalContext();

	const profile = props.profile;

	const did = profile.did;
	const handle = profile.handle;
	const truncatedHandle = truncateMiddle(handle, 29).toLowerCase();

	const isHandleInvalid = handle === 'handle.invalid';

	return (
		<Menu.Container anchor={props.anchor}>
			{!isHandleInvalid && (
				<>
					<Menu.Item
						icon={OpenInNewOutlinedIcon}
						label={`Open ${truncatedHandle}`}
						onClick={() => {
							close();
							window.open(`https://${handle}`, '_blank', 'noopener noreferrer');
						}}
					/>

					<Menu.Item
						icon={ClipboardOutlinedIcon}
						label={`Copy ${truncatedHandle}`}
						onClick={() => {
							close();
							navigator.clipboard.writeText(handle);
						}}
					/>
				</>
			)}

			<Menu.Item
				icon={ClipboardOutlinedIcon}
				label={`Copy ${did}`}
				onClick={() => {
					close();
					navigator.clipboard.writeText(did);
				}}
			/>
		</Menu.Container>
	);
};

export default HandleOverflowMenu;
