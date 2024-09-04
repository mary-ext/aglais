import { history, logger } from '~/globals/navigation';

import Button from '~/components/button';

const NotFoundPage = () => {
	return (
		<>
			<div class="p-4">
				<h2 class="text-lg font-bold">Page not found</h2>
				<p class="mb-4 text-sm">
					We're sorry, but the link you followed might be broken, or the page may have been removed.
				</p>

				<div class="mb-4">
					<Button
						onClick={() => {
							if (logger.canGoBack) {
								history.back();
							} else {
								history.navigate('/', { replace: true });
							}
						}}
						size="sm"
						variant="primary"
					>
						Go back
					</Button>
				</div>
			</div>
		</>
	);
};

export default NotFoundPage;
