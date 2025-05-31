import { Match, Switch, onCleanup } from 'solid-js';

import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import type { GenericUri } from '@atcute/lexicons';

import { createLinkMetaQuery } from '~/api/queries/composer';

import { useSession } from '~/lib/states/session';

import CircularProgress from '~/components/circular-progress';
import ExternalEmbedContent from '~/components/embeds/external-embed';
import ErrorView from '~/components/error-view';
import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';

import type { PostLinkEmbed } from '../lib/state';

export interface LinkEmbedProps {
	embed: PostLinkEmbed;
	active: boolean;
	onRemove: () => void;
}

const LinkEmbed = (props: LinkEmbedProps) => {
	const { currentAccount } = useSession();

	return (
		<div class="relative">
			<Switch>
				<Match
					when={(() => {
						const source = props.embed.source;
						if (source.type === 'remote') {
							return source.state;
						}
					})()}
					keyed
				>
					{(state) => {
						const meta = state.external;

						let thumbUrl: GenericUri | undefined;
						if (meta.thumb && '$type' in meta.thumb) {
							const did = currentAccount!.did;
							const cid = meta.thumb.ref.$link;

							thumbUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@png`;
						}

						const embed: AppBskyEmbedExternal.View = {
							external: {
								title: meta.title,
								description: meta.description,
								uri: meta.uri,
								thumb: thumbUrl,
							},
						};

						return <ExternalEmbedContent embed={embed} />;
					}}
				</Match>

				<Match
					when={(() => {
						const source = props.embed.source;
						if (source.type === 'uri') {
							return source.uri;
						}
					})()}
					keyed
				>
					{(uri) => {
						const query = createLinkMetaQuery(() => uri);

						return (
							<Switch>
								<Match when={query.data} keyed>
									{(data) => {
										const thumbUrl = data.thumb && URL.createObjectURL(data.thumb);
										if (thumbUrl) {
											onCleanup(() => URL.revokeObjectURL(thumbUrl));
										}

										const embed: AppBskyEmbedExternal.View = {
											external: {
												title: data.title,
												description: data.description,
												uri: data.uri,
												thumb: thumbUrl as GenericUri,
											},
										};

										return <ExternalEmbedContent embed={embed} />;
									}}
								</Match>

								<Match when={query.error}>
									{(error) => (
										<div class="rounded border border-outline">
											<ErrorView error={error()} onRetry={() => query.refetch()} />
										</div>
									)}
								</Match>

								<Match when>
									<div class="grid place-items-center rounded border border-outline p-4">
										<CircularProgress />
									</div>
								</Match>
							</Switch>
						);
					}}
				</Match>
			</Switch>

			<div hidden={!props.active} class="absolute right-0 top-0 p-1">
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Remove this embed"
					size="sm"
					onClick={props.onRemove}
				/>
			</div>
		</div>
	);
};

export default LinkEmbed;
