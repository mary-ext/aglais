import { createMemo } from 'solid-js';
import { unwrap } from 'solid-js/store';

import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import { mapDefined } from '@mary/array-fns';
import { createQueries } from '@mary/solid-query';

import { BLUESKY_MODERATION_DID } from '~/api/defaults';
import type { ModerationLabeler, ModerationOptions, ModerationPreferences } from '~/api/moderation';
import { interpretLabelerDefinition } from '~/api/moderation/labeler';

import { createBatchedFetch } from '~/lib/utils/batch-fetch';

import { useAgent } from '../agent';
import { useSession } from '../session';

type Labeler = AppBskyLabelerDefs.LabelerViewDetailed;

const ModerationService = () => {
	const { rpc, persister } = useAgent();
	const { currentAccount } = useSession();

	const modPreferences = createMemo((): ModerationPreferences => {
		if (!currentAccount) {
			return {
				hideReposts: [],
				keywords: [],
				labelers: {
					[BLUESKY_MODERATION_DID]: {
						redact: true,
						privileged: true,
						labels: {},
					},
				},
				labels: {},
			};
		}

		return currentAccount.preferences.moderation;
	});

	const fetchLabeler = createBatchedFetch<At.DID, At.DID, ModerationLabeler>({
		limit: 20,
		timeout: 1,
		idFromQuery: (query) => query,
		idFromData: (data) => data.did,
		async fetch(dids) {
			const { data } = await rpc.get('app.bsky.labeler.getServices', {
				params: {
					dids: dids,
					detailed: true,
				},
			});

			const views = data.views as Labeler[];

			return views.map((view) => interpretLabelerDefinition(view));
		},
	});

	const labelerDefs = createQueries(() => {
		return {
			queries: Object.keys(modPreferences().labelers).map((_did) => {
				const did = _did as At.DID;

				return {
					queryKey: ['labeler-definition', did],
					queryFn: () => fetchLabeler(did),
					staleTime: 21600000, // 6 hours
					gcTime: 86400000, // 24 hours
					refetchOnWindowFocus: true,
					persister: persister,
				};
			}),
			combine(results) {
				const defs = mapDefined(results, (result) => result.data);
				const fields = Object.fromEntries(defs.map((def) => [def.did, def]));

				return fields as Record<At.DID, ModerationLabeler>;
			},
		};
	});

	const modOptions = createMemo((prev?: ModerationOptions): ModerationOptions => {
		return {
			_filtersCache: prev?._filtersCache,
			preferences: unwrap(modPreferences()),
			labelerDefinitions: labelerDefs(),
		};
	});

	return modOptions;
};

export default ModerationService;
