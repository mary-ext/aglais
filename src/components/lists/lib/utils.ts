import type { AppBskyGraphDefs } from '@atcute/client/lexicons';

import { parseAtUri } from '~/api/types/at-uri';

export const getListPurposeLabel = (purpose: AppBskyGraphDefs.ListPurpose) => {
	switch (purpose) {
		case 'app.bsky.graph.defs#curatelist':
			return `Curation list`;
		case 'app.bsky.graph.defs#modlist':
			return `Moderation list`;
	}

	return `Unknown list`;
};

export const getListUrl = (list: AppBskyGraphDefs.ListView) => {
	const did = list.creator.did;
	const { rkey } = parseAtUri(list.uri);

	switch (list.purpose) {
		case 'app.bsky.graph.defs#curatelist':
			return `/${did}/curation-lists/${rkey}`;
		case 'app.bsky.graph.defs#modlist':
			return `/${did}/moderation-lists/${rkey}`;
	}

	return `/${did}/lists/${rkey}`;
};
