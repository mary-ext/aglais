import { createQuery, keepPreviousData } from '@mary/solid-query';

import { useAgent } from '~/lib/states/agent';

export interface ProfileAutocompleteQueryOptions {
	readonly query: string;
	readonly enabled?: boolean;
}

export const createProfileAutocompleteQuery = (opts: ProfileAutocompleteQueryOptions) => {
	const { rpc } = useAgent();

	return createQuery(() => {
		const query = opts.query;
		const isEnabled = opts.enabled ?? true;

		const trimmed = query
			.trimEnd()
			.replace(/\p{P}+$/u, '')
			.toLowerCase();

		return {
			queryKey: ['profile-autocomplete', trimmed],
			enabled: opts.enabled ?? true,
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
