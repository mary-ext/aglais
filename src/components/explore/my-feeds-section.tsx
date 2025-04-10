import { For, createMemo } from 'solid-js';

import { parseCanonicalResourceUri } from '~/api/types/at-uri';

import type { SavedFeed } from '~/lib/preferences/account';
import { useSession } from '~/lib/states/session';
import { assertUnreachable } from '~/lib/utils/invariant';
import { reconcile } from '~/lib/utils/misc';

import Avatar from '../avatar';
import MagnifyingGlassOutlinedIcon from '../icons-central/magnifying-glass-outline';

const MyFeedsSection = () => {
	const { currentAccount } = useSession();

	if (!currentAccount) {
		return null;
	}

	const feeds = createMemo((prev: SavedFeed[] | undefined) => {
		return reconcile(prev, currentAccount.preferences.feeds, (feed) => {
			switch (feed.type) {
				case 'generator':
				case 'list': {
					return `${feed.type}:${feed.info.uri}`;
				}
				case 'search': {
					return `${feed.type}:${feed.query}:${feed.kind}`;
				}
			}
		});
	});

	return (
		<div>
			<div class="flex h-12 items-center justify-between gap-4 px-4">
				<span class="text-base font-bold">My feeds</span>

				<a href="/settings/explore/feeds" class="text-de text-accent hover:underline">
					Edit
				</a>
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

					let href: string;
					switch (type) {
						case 'generator': {
							const uri = parseCanonicalResourceUri(feed.info.uri);
							href = `/${uri.repo}/feeds/${uri.rkey}`;
							break;
						}
						case 'list': {
							const uri = parseCanonicalResourceUri(feed.info.uri);
							href = `/${uri.repo}/lists/${uri.rkey}`;
							break;
						}
						case 'search': {
							href = `/search?q=${encodeURIComponent(feed.query)}&t=${feed.kind}`;
							break;
						}
						default: {
							assertUnreachable(feed);
						}
					}

					return (
						<a
							href={href}
							class="flex items-center gap-4 px-4 py-3 hover:bg-contrast/sm-pressed active:bg-contrast/md"
						>
							{type === 'generator' || type === 'list' ? (
								<Avatar type={type} src={feed.info.avatar} size="sm" />
							) : type === 'search' ? (
								<div class="grid h-6 w-6 place-items-center rounded-md bg-accent text-sm text-accent-fg">
									<MagnifyingGlassOutlinedIcon />
								</div>
							) : null}

							<span class="text-sm font-bold">
								{((): string => {
									switch (type) {
										case 'generator': {
											return feed.info.displayName;
										}
										case 'list': {
											return feed.info.name;
										}
										case 'search': {
											return feed.name || feed.query;
										}
									}
								})()}
							</span>
						</a>
					);
				}}
			</For>
		</div>
	);
};

export default MyFeedsSection;
