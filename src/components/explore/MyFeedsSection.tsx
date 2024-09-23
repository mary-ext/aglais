import { For, createMemo } from 'solid-js';

import { parseAtUri } from '~/api/utils/strings';

import type { SavedFeed } from '~/lib/preferences/account';
import { useSession } from '~/lib/states/session';
import { reconcile } from '~/lib/utils/misc';

import Avatar from '../avatar';

const MyFeedsSection = () => {
	const { currentAccount } = useSession();

	if (!currentAccount) {
		return null;
	}

	const feeds = createMemo((prev: SavedFeed[] | undefined) => {
		return reconcile(prev, currentAccount.preferences.feeds, 'uri');
	});

	return (
		<div>
			<div class="flex h-12 items-center px-4">
				<span class="text-base font-bold">My feeds</span>
			</div>

			<For
				each={feeds()}
				fallback={
					<p class="p-4 pt-2 text-center text-sm text-contrast-muted">
						Any feeds you save will show up here.
					</p>
				}
			>
				{(feed) => {
					const type = feed.type;

					let href: string | undefined;
					{
						const uri = parseAtUri(feed.uri);
						if (type === 'generator') {
							href = `/${uri.repo}/feeds/${uri.rkey}`;
						} else if (type === 'list') {
							href = `/${uri.repo}/lists/${uri.rkey}`;
						}
					}

					return (
						<a
							href={href}
							class="flex items-center gap-4 px-4 py-3 hover:bg-contrast/sm-pressed active:bg-contrast/md"
						>
							<Avatar type={feed.type} src={feed.info.avatar} />
							<span class="text-sm font-bold">{feed.info.name}</span>
						</a>
					);
				}}
			</For>
		</div>
	);
};

export default MyFeedsSection;
