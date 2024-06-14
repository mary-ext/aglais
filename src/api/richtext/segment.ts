import type { AppBskyRichtextFacet } from '@mary/bluesky-client/lexicons';

import type { UnwrapArray } from '../utils/types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface UtfString {
	u16: string;
	u8: Uint8Array;
}

const createUtfString = (utf16: string): UtfString => {
	return { u16: utf16, u8: encoder.encode(utf16) };
};

const getUtf8Length = (utf: UtfString) => {
	return utf.u8.byteLength;
};

const sliceUtf8 = (utf: UtfString, start?: number, end?: number) => {
	return decoder.decode(utf.u8.slice(start, end));
};

type Facet = AppBskyRichtextFacet.Main;
type FacetFeature = UnwrapArray<Facet['features']>;

export interface RichtextSegment {
	text: string;
	feature: FacetFeature | undefined;
}

const createRichtextSegment = (text: string, feature: FacetFeature | undefined): RichtextSegment => {
	return { text: text, feature: feature };
};

export const segmentRichText = (rtText: string, facets: Facet[] | undefined): RichtextSegment[] => {
	if (facets === undefined || facets.length === 0) {
		return [createRichtextSegment(rtText, undefined)];
	}

	const text = createUtfString(rtText);

	const segments: RichtextSegment[] = [];
	const length = getUtf8Length(text);

	const facetsLength = facets.length;

	let textCursor = 0;
	let facetCursor = 0;

	do {
		const facet = facets[facetCursor];
		const { byteStart, byteEnd } = facet.index;

		if (textCursor < byteStart) {
			segments.push(createRichtextSegment(sliceUtf8(text, textCursor, byteStart), undefined));
		} else if (textCursor > byteStart) {
			facetCursor++;
			continue;
		}

		if (byteStart < byteEnd) {
			const subtext = sliceUtf8(text, byteStart, byteEnd);
			const features = facet.features;

			if (features.length === 0 || subtext.trim().length === 0) {
				segments.push(createRichtextSegment(subtext, undefined));
			} else {
				segments.push(createRichtextSegment(subtext, features[0]));
			}
		}

		textCursor = byteEnd;
		facetCursor++;
	} while (facetCursor < facetsLength);

	if (textCursor < length) {
		segments.push(createRichtextSegment(sliceUtf8(text, textCursor, length), undefined));
	}

	return segments;
};
