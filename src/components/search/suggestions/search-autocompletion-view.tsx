import { For, Show } from 'solid-js';

import { createQuery, keepPreviousData } from '@mary/solid-query';

import { safeUrlParse } from '~/api/utils/strings';

import {
	BSKY_FEED_LINK_RE,
	BSKY_LIST_LINK_RE,
	BSKY_POST_LINK_RE,
	BSKY_PROFILE_LINK_RE,
} from '~/lib/bsky/link-detection';
import { useIsFocused } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';

import ProfileItem from '~/components/profiles/profile-item';

import { useSearchBar } from '../context';

const HAS_FILTER_RE = /[a-z]:/;
const LIKELY_HANDLE_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})\b/;

const SearchAutocompletionView = () => {
	const { query, onSearch } = useSearchBar();

	const { rpc } = useAgent();
	const isFocused = useIsFocused();

	const profiles = createQuery(() => {
		const $query = query();

		const trimmed = $query
			.trimEnd()
			.replace(/\p{P}+$/u, '')
			.toLowerCase();

		const isValidQuery = $query.length > 0 && $query.length < 128 && !HAS_FILTER_RE.test($query);

		return {
			queryKey: ['profile-autocomplete', trimmed],
			enabled: isValidQuery && isFocused(),
			placeholderData: isValidQuery ? keepPreviousData : undefined,
			async queryFn({ signal }) {
				const { data } = await rpc.get('app.bsky.actor.searchActorsTypeahead', {
					signal,
					params: {
						q: trimmed,
						limit: 10,
					},
				});

				return data;
			},
		};
	});

	return (
		<div class="flex flex-col">
			<button
				class="overflow-hidden text-ellipsis whitespace-nowrap p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
				onClick={() => onSearch(query())}
			>
				Search for <span class="font-medium text-contrast">{query()}</span>
			</button>

			<Show when={LIKELY_HANDLE_RE.exec(query())?.[0]}>
				{(handle) => (
					<a
						href={`/${handle()}`}
						class="break-words p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
					>
						Go to <span class="font-medium text-contrast">@{handle()}</span>
					</a>
				)}
			</Show>

			<Show when={findLinkRedirect(query())}>
				{(redirect) => (
					<a
						href={redirect()}
						class="break-words p-4 py-3 text-left text-sm text-contrast/85 outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
					>
						Open URL in app
					</a>
				)}
			</Show>

			<hr class="mx-4 my-1 border-outline" />

			<For each={profiles.data?.actors}>{(profile) => <ProfileItem item={profile} />}</For>
		</div>
	);
};

export default SearchAutocompletionView;

const findLinkRedirect = (uri: string): string | null => {
	const url = safeUrlParse(uri);

	if (url === null) {
		return null;
	}

	const host = url.host;
	const pathname = url.pathname;
	let match: RegExpExecArray | null | undefined;

	if (host === 'bsky.app') {
		if ((match = BSKY_PROFILE_LINK_RE.exec(pathname))) {
			return `/${match[1]}`;
		}

		if ((match = BSKY_POST_LINK_RE.exec(pathname))) {
			return `/${match[1]}/${match[2]}`;
		}

		if ((match = BSKY_LIST_LINK_RE.exec(pathname))) {
			return `/${match[1]}/lists/${match[2]}`;
		}

		if ((match = BSKY_FEED_LINK_RE.exec(pathname))) {
			return `/${match[1]}/feeds/${match[2]}`;
		}
	}

	return null;
};
