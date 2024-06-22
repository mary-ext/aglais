import type { JSX } from 'solid-js';

import type { AppBskyRichtextFacet } from '@mary/bluesky-client/lexicons';

import { segmentRichText } from '~/api/richtext/segment';

import { isLinkValid, safeUrlParse } from '~/api/utils/strings';

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
				const feature = segment.feature;

				let to: string | undefined;
				let external = false;

				if (feature) {
					const type = feature.$type;

					if (type === 'app.bsky.richtext.facet#link') {
						const uri = feature.uri;
						const redirect = findLinkRedirect(uri);

						if (redirect === null) {
							to = uri;
							external = true;
						} else {
							to = redirect;
						}
					} else if (type === 'app.bsky.richtext.facet#mention') {
						to = `/${feature.did}`;
					} else if (type === 'app.bsky.richtext.facet#tag') {
						to = `/topics/${feature.tag}`;
					}
				}

				if (to !== undefined) {
					if (!external) {
						nodes.push(
							<a href={to} class="text-accent hover:underline">
								{subtext}
							</a>,
						);
					} else {
						nodes.push(
							<a
								target="_blank"
								href={to}
								onClick={handleUnsafeLinkNavigation}
								onAuxClick={handleUnsafeLinkNavigation}
								class="text-accent hover:underline"
							>
								{subtext}
							</a>,
						);
					}
				} else {
					nodes.push(subtext);
				}
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
		if ((match = /^\/profile\/(?=.+[:.])([^/]+)\/?$/.exec(pathname))) {
			return `/${match[1]}`;
		}

		if ((match = /^\/profile\/(?=.+[:.])([^/]+)\/post\/([^/]{13})\/?$/.exec(pathname))) {
			return `/${match[1]}/${match[2]}`;
		}

		if ((match = /^\/profile\/(?=.+[:.])([^/]+)\/lists\/([^/]+)\/?$/.exec(pathname))) {
			return `/${match[1]}/lists/${match[2]}`;
		}

		if ((match = /^\/profile\/(?=.+[:.])([^/]+)\/feed\/([^/]+)\/?$/.exec(pathname))) {
			return `/${match[1]}/feeds/${match[2]}`;
		}
	}

	return null;
};
