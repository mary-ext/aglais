export interface ErrorPageProps {
	error: unknown;
	reset: () => void;
}

const ErrorPage = ({ error, reset: retry }: ErrorPageProps) => {
	console.error(error);
	return <div>something went wrong</div>;
};

export default ErrorPage;
