import type { JSX } from 'solid-js';

import type { AppBskyRichtextFacet } from '@atcute/client/lexicons';

import { segmentRichText } from '~/api/richtext/segment';
import { isLinkValid, safeUrlParse } from '~/api/utils/strings';

import { getCdnUrl } from '~/lib/bluemoji/render';
import {
	BSKY_FEED_LINK_RE,
	BSKY_LIST_LINK_RE,
	BSKY_POST_LINK_RE,
	BSKY_PROFILE_LINK_RE,
} from '~/lib/bsky/link-detection';

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
			const segments = segmentRichText(text, facets);

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
							const redirect = findLinkRedirect(uri);

							if (redirect === null) {
								node = renderExternalLink(uri, subtext);
							} else {
								node = renderInternalLink(redirect, subtext);
							}

							break;
						} else if (type === 'app.bsky.richtext.facet#mention') {
							node = renderInternalLink(`/${feature.did}`, subtext);

							break;
						} else if (type === 'app.bsky.richtext.facet#tag') {
							node = renderInternalLink(`/topics/${feature.tag}`, subtext);

							break;
						} else if (type === 'blue.moji.richtext.facet') {
							const formats = feature.formats;
							if (formats.$type !== 'blue.moji.richtext.facet#formats_v0' || !formats.png_128) {
								continue;
							}

							node = (
								<img
									src={/* @once */ getCdnUrl(feature.did, formats.png_128)}
									title={/* @once */ feature.name}
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

const findLinkRedirect = (uri: string): string | null => {
	const url = safeUrlParse(uri);

	if (url === null) {
		return null;
	}

	const host = url.host;
	const pathname = url.pathname;
	let match: RegExpExecArray | null | undefined;

	if (host === 'bsky.app') {
		if ((match = BSKY_PROFILE_LINK_RE.exec(pathname))) {
			return `/${match[1]}`;
		}

		if ((match = BSKY_POST_LINK_RE.exec(pathname))) {
			return `/${match[1]}/${match[2]}`;
		}

		if ((match = BSKY_LIST_LINK_RE.exec(pathname))) {
			return `/${match[1]}/lists/${match[2]}`;
		}

		if ((match = BSKY_FEED_LINK_RE.exec(pathname))) {
			return `/${match[1]}/feeds/${match[2]}`;
		}
	}

	return null;
};
