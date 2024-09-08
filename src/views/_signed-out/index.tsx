import { openModal } from '~/globals/modals';

import Button from '~/components/button';
import SignInDialogLazy from '~/components/main/sign-in-dialog-lazy';

const SignedOutPage = () => {
	return (
		<>
			<div class="flex grow flex-col items-center justify-center gap-1">
				<p class="text-lg">here's where i would've put a logo</p>
				<p class="text-2xl font-medium">IF I HAD ONE</p>
			</div>
			<div class="flex shrink-0 flex-col gap-4 p-6">
				<Button
					onClick={() => {
						openModal(() => <SignInDialogLazy />);
					}}
					variant="primary"
					size="lg"
				>
					Sign in
				</Button>
				<Button size="lg" disabled>
					Create account
				</Button>
			</div>
		</>
	);
};

export default SignedOutPage;
