import { openModal, useModalContext } from '~/globals/modals';

import type { AccountData } from '~/lib/preferences/sessions';
import { useSession } from '~/lib/states/session';

import LeaveOutlinedIcon from '~/components/icons-central/leave-outline';
import * as Menu from '~/components/menu';
import * as Prompt from '~/components/prompt';

export interface AccountOverflowMenuProps {
	anchor: HTMLElement;
	account: AccountData;
}

const AccountOverflowMenu = (props: AccountOverflowMenuProps) => {
	const { close } = useModalContext();
	const { removeAccount } = useSession();

	const account = props.account;

	return (
		<Menu.Container anchor={props.anchor}>
			<Menu.Item
				icon={LeaveOutlinedIcon}
				label={`Remove account`}
				onClick={() => {
					close();

					const profile = () => account.profile;

					openModal(() => (
						<Prompt.Confirm
							title={`Sign out of @${profile().handle}?`}
							description={<></>}
							confirmLabel="Sign out"
							onConfirm={() => removeAccount(account.did)}
						/>
					));
				}}
			/>
		</Menu.Container>
	);
};

export default AccountOverflowMenu;
