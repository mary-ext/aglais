import { createProfileQuery } from '~/api/queries/profile';

import { useSession } from '~/lib/states/session';

import * as Prompt from '../prompt';

const SignOutDialog = () => {
	const { currentAccount, getAccounts, logout } = useSession();
	const profile = createProfileQuery(() => currentAccount!.did);

	return (
		<Prompt.Confirm
			title={`Sign out of ${profile.data ? `@${profile.data.handle}` : `this account`}?`}
			description={getAccounts().length > 1 ? <>You'll still be signed in to your other accounts.</> : <></>}
			confirmLabel="Sign out"
			onConfirm={() => logout()}
		/>
	);
};

export default SignOutDialog;
