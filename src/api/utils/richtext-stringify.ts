import { segmentize } from '@atcute/bluesky-richtext-segmenter';
import type { AppBskyRichtextFacet } from '@atcute/client/lexicons';

import { isLinkValid } from './strings';

const MDLINK_ESCAPE_RE = /([\\\]])/g;
const ESCAPE_RE = /([@＠#:\\\[])/g;

export const serializeRichText = (text: string, facets: AppBskyRichtextFacet.Main[] | undefined): string => {
	const segments = segmentize(text, facets);

	let result = '';

	for (let i = 0, ilen = segments.length; i < ilen; i++) {
		const segment = segments[i];

		const features = segment.features;
		const subtext = segment.text;

		let substitute: string | undefined;

		if (features) {
			for (let j = 0, jlen = features.length; j < jlen; j++) {
				const feature = features[j];
				const type = feature.$type;

				if (type === 'app.bsky.richtext.facet#link') {
					const uri = feature.uri;

					substitute = !isLinkValid(uri, subtext)
						? `[${text.replace(MDLINK_ESCAPE_RE, '\\$1')}](${uri})`
						: uri;
				} else if (
					type === 'app.bsky.richtext.facet#mention' ||
					type === 'app.bsky.richtext.facet#tag' ||
					type === 'blue.moji.richtext.facet'
				) {
					substitute = subtext;
				}
			}
		}

		result += substitute ?? subtext.replace(ESCAPE_RE, '\\$1');
	}

	return result;
};
