import { createQuery, keepPreviousData } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export interface ProfileAutocompleteQueryOptions {
	readonly enabled?: boolean;
}

export const createProfileAutocompleteQuery = (
	query: () => string,
	opts?: ProfileAutocompleteQueryOptions,
) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const $query = query();
		const isEnabled = opts?.enabled ?? true;

		const trimmed = $query
			.trim()
			.replace(/^\p{P}+|\p{P}+$/gu, '')
			.toLowerCase();

		return {
			queryKey: ['profile-autocomplete', trimmed],
			enabled: isEnabled,
			placeholderData: isEnabled ? keepPreviousData : undefined,
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
};
