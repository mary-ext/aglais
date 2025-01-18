import { For, Match, Show, Switch } from 'solid-js';

import { Freeze, ShowFreeze } from '@mary/solid-freeze';
import { createQuery, keepPreviousData } from '@mary/solid-query';

import { useIsFocused } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';
import { mapDefined } from '~/lib/utils/misc';

import CircularProgressView from '~/components/circular-progress-view';
import TrendingLineOutlinedIcon from '~/components/icons-central/trending-line-outlined';
import ProfileItem from '~/components/profiles/profile-item';

export interface SearchSuggestionsViewProps {
	query: string;
	onSearch: (term: string) => void;
}

const SearchSuggestionsView = (props: SearchSuggestionsViewProps) => {
	return (
		<div class="relative">
			<Freeze freeze={props.query !== ''}>
				<TrendingSection />
			</Freeze>

			<ShowFreeze when={props.query !== ''}>
				<AutocompleteSection {...props} />
			</ShowFreeze>

			<div class="mt-4"></div>
		</div>
	);
};

export default SearchSuggestionsView;

const TOPIC_FEED_RE = /^\/profile\/([^/]+)\/feed\/([^/]+)\/?$/;

const TrendingSection = () => {
	const { rpc } = useAgent();
	const isFocused = useIsFocused();

	const query = createQuery(() => ({
		queryKey: ['trending-topics'],
		staleTime: 180_000, // 3 minutes
		enabled: isFocused(),
		async queryFn({ signal }) {
			const { data } = await rpc.get('app.bsky.unspecced.getTrendingTopics', {
				signal,
				params: {
					limit: 14,
				},
			});

			return data;
		},
		select(data) {
			return mapDefined(data.topics, (topic) => {
				const match = TOPIC_FEED_RE.exec(topic.link);
				if (!match) {
					return;
				}

				let actor = match[1];
				let rkey = match[2];

				// Nasty hack to prevent that redirect on first visit
				if (actor === 'trending.bsky.app') {
					actor = 'did:plc:qrz3lhbyuxbeilrc6nekdqme';
				}

				return {
					name: topic.topic,
					href: `/${actor}/feeds/${rkey}`,
				};
			});
		},
	}));

	return (
		<div>
			<div class="flex h-12 items-center gap-3 px-4">
				<TrendingLineOutlinedIcon class="text-xl text-accent" />
				<span class="text-base font-bold">Trending right now</span>
			</div>

			<Switch>
				<Match when={query.data}>
					{(data) => (
						<div class="flex flex-wrap gap-2 px-4 py-2">
							{data().map((topic) => (
								<a
									href={/* @once */ topic.href}
									class="select-none rounded-full border border-outline px-3 py-1 text-sm font-medium text-contrast/85 hover:bg-contrast/md hover:text-contrast/100"
								>
									{/* @once */ topic.name}
								</a>
							))}
						</div>
					)}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</div>
	);
};

const LIKELY_HANDLE_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})\b/;

const AutocompleteSection = (props: SearchSuggestionsViewProps) => {
	const onSearch = props.onSearch;

	const { rpc } = useAgent();
	const isFocused = useIsFocused();

	const profiles = createQuery(() => {
		const query = props.query
			.trimEnd()
			.replace(/[;.,]+$/g, '')
			.toLowerCase();

		return {
			queryKey: ['profile-autocomplete', query],
			enabled: query !== '' && isFocused(),
			placeholderData: keepPreviousData,
			async queryFn({ signal }) {
				const { data } = await rpc.get('app.bsky.actor.searchActorsTypeahead', {
					signal,
					params: {
						q: query,
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
				class="break-words p-4 py-3 text-left text-sm outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
				onClick={() => onSearch(props.query)}
			>
				Search for <span class="whitespace-pre-wrap">"{props.query}"</span>
			</button>

			<Show when={LIKELY_HANDLE_RE.exec(props.query)?.[0]}>
				{(handle) => (
					<a
						href={`/${handle()}`}
						class="break-words p-4 py-3 text-left text-sm outline-2 -outline-offset-2 outline-accent hover:bg-contrast/sm-pressed focus-visible:outline active:bg-contrast/md"
					>
						Go to @{handle()}
					</a>
				)}
			</Show>

			<hr class="mx-4 my-1 border-outline" />

			<For each={profiles.data?.actors}>{(profile) => <ProfileItem item={profile} />}</For>
		</div>
	);
};
