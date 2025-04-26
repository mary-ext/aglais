import { createMemo } from 'solid-js';
import { unwrap } from 'solid-js/store';

import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import { mapDefined } from '@mary/array-fns';
import { createBatchedFetch } from '@mary/batch-fetch';
import { type QueryFunctionContext as QC, createQueries } from '@mary/solid-query';

import { BLUESKY_MODERATION_DID } from '~/api/defaults';
import type { ModerationLabeler, ModerationOptions, ModerationPreferences } from '~/api/moderation';
import { interpretLabelerDefinition } from '~/api/moderation/labeler';

import { useAgent } from '../agent';
import { useSession } from '../session';
import { define } from '../singleton';

type Labeler = AppBskyLabelerDefs.LabelerViewDetailed;

const ModerationService = define('moderation', () => {
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

	const fetchLabeler = createBatchedFetch<At.Did, ModerationLabeler>({
		limit: 20,
		timeout: 1,
		idFromResource: (labeler) => labeler.did,
		async fetch(dids, signal) {
			const { data } = await rpc.get('app.bsky.labeler.getServices', {
				signal,
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
				const did = _did as At.Did;

				return {
					queryKey: ['labeler-definition', did],
					queryFn: ({ signal }: QC) => fetchLabeler(did, signal),
					staleTime: 21600000, // 6 hours
					gcTime: 86400000, // 24 hours
					refetchOnWindowFocus: true,
					persister: persister,
				};
			}),
			combine(results) {
				const defs = mapDefined(results, (result) => result.data);
				const fields = Object.fromEntries(defs.map((def) => [def.did, def]));

				return fields as Record<At.Did, ModerationLabeler>;
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
});

export default ModerationService;
