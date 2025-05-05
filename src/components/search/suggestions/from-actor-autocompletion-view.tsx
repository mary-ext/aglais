import { For, Show, createMemo } from 'solid-js';

import { ok } from '@atcute/client';
import { createQuery, keepPreviousData } from '@mary/solid-query';

import { createProfileQuery } from '~/api/queries/profile';

import { useIsFocused } from '~/lib/navigation/router';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import ProfileItemPressable from '~/components/profiles/profile-item-pressable';

const FromActorAutocompletionView = (props: {
	type: string;
	match: string;
	onCompletion: (next: string) => void;
}) => {
	const { currentAccount } = useSession();

	const { client } = useAgent();
	const isFocused = useIsFocused();

	const match = createMemo(() => {
		return props.match.replace(/^@|[.]+$/g, '').toLowerCase();
	});

	const profiles = createQuery(() => {
		const $match = match();

		return {
			queryKey: ['profile-autocomplete', $match],
			enabled: $match !== '' && isFocused(),
			placeholderData: keepPreviousData,
			async queryFn({ signal }) {
				const data = await ok(
					client.get('app.bsky.actor.searchActorsTypeahead', {
						signal,
						params: {
							q: $match,
							limit: 10,
						},
					}),
				);

				return data;
			},
			select(data) {
				return {
					actors: data.actors.filter((profile) => {
						if (profile.handle === 'handle.invalid') {
							return false;
						}

						if ($match === '' && profile.did === currentAccount?.did) {
							return false;
						}

						return true;
					}),
				};
			},
		};
	});

	return (
		<>
			<div class="px-4 pb-1 pt-3">
				<span class="text-xs font-bold uppercase text-contrast/75">
					{(() => {
						switch (props.type) {
							case 'from':
								return `From user`;
							case 'to':
								return `To user`;
							case 'mentions':
								return `Mentioning user`;
						}
					})()}
				</span>
			</div>

			<Show when={currentAccount} keyed>
				{(account) => {
					const profile = createProfileQuery(() => account.did);

					return (
						<Show when={match() === '' && profile.data} keyed>
							{(me) => <ProfileItemPressable item={me} onClick={() => props.onCompletion('me')} />}
						</Show>
					);
				}}
			</Show>

			<For each={profiles.data?.actors}>
				{(profile) => (
					<ProfileItemPressable item={profile} onClick={() => props.onCompletion(profile.handle)} />
				)}
			</For>
		</>
	);
};

export default FromActorAutocompletionView;
