import type { AppBskyEmbedExternal } from '@mary/bluesky-client/lexicons';
import { safeUrlParse } from '~/api/utils/strings';

export interface ExternalEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedExternal.View;
	/** Expected to be static */
	interactive?: boolean;
}

const ExternalEmbed = ({ embed, interactive }: ExternalEmbedProps) => {
	const { title, uri, thumb } = embed.external;

	const url = safeUrlParse(uri);
	const domain = trimDomain(url?.host ?? '');

	return (
		<a
			href={interactive ? uri : undefined}
			target="_blank"
			class={
				`flex overflow-hidden rounded-md border border-outline` + (interactive ? ` hover:bg-contrast/sm` : ``)
			}
		>
			{thumb && (
				<img src={thumb} class="aspect-square w-[86px] shrink-0 border-r border-outline object-cover" />
			)}

			<div class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm">
				<p class="overflow-hidden text-ellipsis text-contrast-muted empty:hidden">{domain}</p>
				<p class="line-clamp-2 break-words font-medium empty:hidden">{title}</p>
			</div>
		</a>
	);
};

export default ExternalEmbed;

const trimDomain = (host: string) => {
	return host.startsWith('www.') ? host.slice(4) : host;
};
