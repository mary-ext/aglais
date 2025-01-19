import { For, Show } from 'solid-js';

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

	const { rpc } = useAgent();
	const isFocused = useIsFocused();

	const match = () => props.match;

	const profiles = createQuery(() => {
		const $match = match();

		return {
			queryKey: ['profile-autocomplete', $match],
			enabled: $match !== '' && isFocused(),
			placeholderData: keepPreviousData,
			async queryFn({ signal }) {
				const { data } = await rpc.get('app.bsky.actor.searchActorsTypeahead', {
					signal,
					params: {
						q: $match,
						limit: 10,
					},
				});

				return data;
			},
			select(data) {
				return {
					actors: data.actors.filter((profile) => profile.handle !== 'handle.invalid'),
				};
			},
		};
	});

	return (
		<div class="flex flex-col">
			<div class="px-4 pb-1 pt-3">
				<span class="text-xs font-bold uppercase text-contrast/75">
					{props.type === 'mentions' ? `Mentioning user` : `From user`}
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
		</div>
	);
};

export default FromActorAutocompletionView;
