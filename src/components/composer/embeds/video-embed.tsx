import { createEffect } from 'solid-js';

import { useSession } from '~/lib/states/session';
import { convertBlobToUrl } from '~/lib/utils/blob';

import IconButton from '~/components/icon-button';
import CrossLargeOutlinedIcon from '~/components/icons-central/cross-large-outline';
import Keyed from '~/components/keyed';

import type { PostVideoEmbed } from '../lib/state';

export interface VideoEmbedProps {
	embed: PostVideoEmbed;
	active: boolean;
	onRemove: () => void;
}

const VideoEmbed = (props: VideoEmbedProps) => {
	const { currentAccount } = useSession();

	return (
		<div class="relative self-start">
			<Keyed value={props.embed.blob}>
				{(blob) => {
					const blobUrl = convertBlobToUrl(blob);

					return (
						<video
							ref={(node) => {
								node.volume = currentAccount!.preferences.ui.mediaVolume;

								createEffect(() => {
									if (!props.active) {
										node.pause();
									}
								});
							}}
							src={blobUrl}
							inert={!props.active}
							controls={props.active}
							onVolumeChange={(ev) => {
								currentAccount!.preferences.ui.mediaVolume = ev.currentTarget.volume;
							}}
							onLoadedMetadata={(ev) => {
								const video = ev.currentTarget;

								const hasAudio =
									// @ts-expect-error: Mozilla-specific
									video.mozHasAudio ||
									// @ts-expect-error: WebKit/Blink-specific
									!!video.webkitAudioDecodedByteCount ||
									// @ts-expect-error: WebKit-specific
									!!(video.audioTracks && video.audioTracks.length);

								video.loop = !hasAudio || video.duration <= 10;
							}}
							class="h-full max-h-80 min-h-16 w-full min-w-16 max-w-full rounded-md border border-outline"
						/>
					);
				}}
			</Keyed>

			<div hidden={!props.active} class="absolute right-0 top-0 p-1">
				<IconButton
					icon={CrossLargeOutlinedIcon}
					title="Remove this video"
					variant="black"
					size="sm"
					onClick={props.onRemove}
				/>
			</div>
		</div>
	);
};

export default VideoEmbed;
