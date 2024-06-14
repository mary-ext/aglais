import { formatQueryError } from '~/api/utils/error';

import Button from './button';

export interface ErrorViewProps {
	error: unknown;
	onRetry?: () => void;
}

const ErrorView = (props: ErrorViewProps) => {
	return (
		<div class="p-4">
			<div class="mb-4 text-sm">
				<p class="font-bold">Something went wrong</p>
				<p class="text-muted-fg">{formatQueryError(props.error)}</p>
			</div>

			<Button onClick={props.onRetry} variant="primary">
				Try again
			</Button>
		</div>
	);
};

export default ErrorView;
