import type { AppBskyRichtextFacet } from '@atcute/client/lexicons';

declare module '@atcute/client/lexicons' {
	namespace AppBskyRichtextFacet {
		type FacetFeature = Brand.Union<Link | Mention | Tag | BlueMojiRichtextFacet.Main>;

		interface Main {
			features: FacetFeature[];
		}
	}
}

declare module '@atcute/bluesky-richtext-segmenter' {
	export interface RichtextSegment {
		features: AppBskyRichtextFacet.FacetFeature[] | undefined;
	}
}
