import { useTitle } from '~/lib/navigation/router';

export interface ErrorPageProps {
	error: unknown;
	reset: () => void;
}

const ErrorPage = ({ error, reset: retry }: ErrorPageProps) => {
	useTitle(() => `Something went wrong :( — ${import.meta.env.VITE_APP_NAME}`);

	console.error(error);
	return <div>something went wrong</div>;
};

export default ErrorPage;
