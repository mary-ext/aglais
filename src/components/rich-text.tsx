import type { JSX } from 'solid-js';

import type { BlueMojiRichtextFacet } from '@atcute/bluemoji';
import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';

import { isLinkValid, safeUrlParse } from '~/api/utils/strings';

import { getCdnUrl } from '~/lib/bluemoji/render';
import { redirectBskyUrl } from '~/lib/redirector';

export interface RichTextProps {
	text: string;
	large?: boolean;
	facets?: AppBskyRichtextFacet.Main[];
	clipped?: boolean;
}

const EMOJI_RE = /^(\p{Emoji}\ufe0f|\p{Emoji_Presentation}){1,8}$/u;

const RichText = (props: RichTextProps) => {
	return (() => {
		const text = props.text;
		const facets = props.facets;
		const large = props.large;

		let nodes: JSX.Element;
		let emojiOnly = false;

		if (facets !== undefined && facets.length !== 0) {
			const segments = segmentize(text, facets);

			nodes = [];

			for (let idx = 0, len = segments.length; idx < len; idx++) {
				const segment = segments[idx];
				const subtext = segment.text;
				const features = segment.features;

				let node: JSX.Element = subtext;

				if (features) {
					for (let j = 0, jlen = features.length; j < jlen; j++) {
						const feature = features[j];
						const type = feature.$type;

						if (type === 'app.bsky.richtext.facet#link') {
							const uri = feature.uri;
							if (safeUrlParse(uri) === null) {
								break;
							}

							const redirect = redirectBskyUrl(uri);

							if (redirect == null) {
								node = renderExternalLink(uri, subtext);
							} else {
								node = renderInternalLink(redirect, subtext);
							}

							break;
						} else if (type === 'app.bsky.richtext.facet#mention') {
							node = renderInternalLink(`/${feature.did}`, subtext);

							break;
						} else if (type === 'app.bsky.richtext.facet#tag') {
							const href = `/search?q=${encodeURIComponent('#' + feature.tag)}&t=top_posts`;
							node = renderInternalLink(href, subtext);

							break;
						} else if (type === 'blue.moji.richtext.facet') {
							const feat = feature as BlueMojiRichtextFacet.Main;
							const formats = feat.formats;
							if (formats.$type !== 'blue.moji.richtext.facet#formats_v0' || !formats.png_128) {
								continue;
							}

							node = (
								<img
									src={/* @once */ getCdnUrl(feat.did, formats.png_128)}
									title={/* @once */ feat.name}
									class={`mx-px inline-block align-top text-[0]` + (!large ? ` h-5 w-5` : ` h-6 w-6`)}
								/>
							);
							break;
						}
					}
				}

				nodes.push(node);
			}
		} else {
			nodes = text;
			emojiOnly = EMOJI_RE.test(text);
		}

		const multiplier = !emojiOnly ? 1 : 1.3;
		const fontSize = (!large ? 0.875 : 1) * multiplier;
		const lineHeight = (!large ? 1.25 : 1.5) * multiplier;

		return (
			<p
				class={`whitespace-pre-wrap break-words` + (props.clipped ? ` line-clamp-[12]` : ``)}
				style={{ 'font-size': `${fontSize}rem`, 'line-height': `${lineHeight}rem` }}
			>
				{nodes}
			</p>
		);
	}) as unknown as JSX.Element;
};

export default RichText;

const renderInternalLink = (to: string, subtext: string) => {
	return (
		<a href={to} class="text-accent hover:underline">
			{subtext}
		</a>
	);
};

const renderExternalLink = (to: string, subtext: string) => {
	return (
		<a
			target="_blank"
			rel="noopener noreferrer nofollow"
			href={to}
			onClick={handleUnsafeLinkNavigation}
			onAuxClick={handleUnsafeLinkNavigation}
			class="text-accent hover:underline"
		>
			{subtext}
		</a>
	);
};

const handleUnsafeLinkNavigation = (ev: MouseEvent) => {
	if (ev.defaultPrevented || (ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)) {
		return;
	}

	const anchor = ev.currentTarget as HTMLAnchorElement;
	const href = anchor.href;

	if (isLinkValid(href, anchor.textContent ?? '')) {
	}
};
