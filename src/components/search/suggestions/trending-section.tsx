import { Match, Switch } from 'solid-js';

import { createQuery } from '@mary/solid-query';

import { useIsFocused } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';
import { mapDefined } from '~/lib/utils/misc';

import CircularProgressView from '~/components/circular-progress-view';
import TrendingLineOutlinedIcon from '~/components/icons-central/trending-line-outlined';

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
									class="select-none overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-outline px-3 py-1 text-sm font-medium text-contrast/85 hover:bg-contrast/md hover:text-contrast/100"
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

export default TrendingSection;
