import { ok } from '@atcute/client';
import { createQuery } from '@mary/solid-query';

import { useTitle } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';

import * as Boxed from '~/components/boxed';
import * as Page from '~/components/page';

const AccountSettingsPage = () => {
	const { pds, persister } = useAgent();

	const repo = createQuery(() => ({
		queryKey: ['describe-repo'],
		persister: persister as any,
		async queryFn() {
			const [session, server] = await Promise.all([
				ok(pds!.get('com.atproto.server.getSession')),
				ok(pds!.get('com.atproto.server.describeServer')),
			]);

			return {
				handle: session.handle,
				pds: server.did.replace(/^did:web:/, ''),
			};
		},
	}));

	useTitle(() => `Account settings — ${import.meta.env.VITE_APP_NAME}`);

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/" />
				</Page.HeaderAccessory>

				<Page.Heading title="My account" />
			</Page.Header>

			<Boxed.Container>
				<Boxed.Group>
					<Boxed.GroupHeader>Account information</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.ButtonItem
							label="Handle"
							blurb={'@' + (repo.data?.handle.toLowerCase() ?? 'handle.invalid')}
						/>
						<Boxed.StaticItem
							label="Data server"
							description={repo.data ? formatPdsHost(repo.data.pds) : '-'}
						/>
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Account security</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/app-passwords" label="Manage app passwords" />
						<Boxed.ButtonItem label="Change password" />
						<Boxed.StaticItem label="Email two-factor authentication" description={'Disabled'} />
					</Boxed.List>
				</Boxed.Group>

				<Boxed.Group>
					<Boxed.GroupHeader>Account management</Boxed.GroupHeader>

					<Boxed.List>
						<Boxed.LinkItem to="/settings/export" label="Export my data" />

						<Boxed.ButtonItem label="Deactivate account" variant="danger" />
						<Boxed.ButtonItem label="Delete account" variant="danger" />
					</Boxed.List>
				</Boxed.Group>
			</Boxed.Container>
		</>
	);
};

export default AccountSettingsPage;

const formatPdsHost = (host: string): string => {
	if (host.endsWith('.host.bsky.network')) {
		return 'bsky.social';
	}

	return host;
};
