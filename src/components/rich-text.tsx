import type { JSX } from 'solid-js';

import type { AppBskyRichtextFacet } from '@mary/bluesky-client/lexicons';

import { segmentRichText } from '~/api/richtext/segment';

import { handleLinkNavigation } from './button';
import { isLinkValid, safeUrlParse } from '~/api/utils/strings';

export interface RichTextProps {
	text: string;
	facets?: AppBskyRichtextFacet.Main[];
	clipped?: boolean;
}

const EMOJI_RE = /^(\p{Emoji}\ufe0f|\p{Emoji_Presentation}){1,8}$/u;

const RichText = (props: RichTextProps) => {
	return (() => {
		const text = props.text;
		const facets = props.facets;

		let nodes: JSX.Element;
		let large = false;

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
							<a href={to} onClick={handleLinkNavigation} class="text-c-primary-400 hover:underline">
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
								class="text-c-primary-400 hover:underline"
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
			large = EMOJI_RE.test(text);
		}

		return (
			<p
				class={
					`whitespace-pre-wrap break-words` +
					(!large ? ` text-sm` : ` text-lg`) +
					(props.clipped ? ` line-clamp-[12]` : ``)
				}
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
