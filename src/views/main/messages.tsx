import { useTitle } from '~/lib/navigation/router';

const MessagesPage = () => {
	useTitle(() => `Messages — ${import.meta.env.VITE_APP_NAME}`);

	return <div>messages</div>;
};

export default MessagesPage;
