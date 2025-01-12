import { createEffect, onCleanup } from 'solid-js';

import { useSession } from '~/lib/states/session';

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
		<div class="relative max-w-full self-start">
			<Keyed value={props.embed.source}>
				{(source) => {
					const aspectRatio = source.aspectRatio;
					const ratio = aspectRatio ? `${aspectRatio.width}/${aspectRatio.height}` : '16/9';

					let videoUrl: string;
					let mimeType: string | undefined;

					switch (source.type) {
						case 'local': {
							onCleanup(() => URL.revokeObjectURL(videoUrl));

							videoUrl = URL.createObjectURL(source.blob);
							mimeType = source.blob.type;
							break;
						}
						case 'remote': {
							const did = currentAccount!.did;
							const cid = source.blob.ref.$link;

							const pdsUrl = currentAccount!.agent!.session.info.aud;

							videoUrl = new URL(`/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`, pdsUrl).toString();
							mimeType = source.blob.mimeType;
							break;
						}
					}

					return (
						<div
							class="max-h-80 min-h-16 min-w-16 max-w-full overflow-hidden rounded-md border border-outline"
							style={{ 'aspect-ratio': ratio }}
						>
							<video
								ref={(node) => {
									node.volume = currentAccount!.preferences.ui.mediaVolume;

									createEffect(() => {
										if (!props.active) {
											node.pause();
										}
									});
								}}
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

									video.loop = !hasAudio || video.duration <= 6;
								}}
								class="h-full w-full"
							>
								<source src={videoUrl} type={mimeType} />
							</video>

							{/* Hack */}
							<div class="h-screen w-screen"></div>
						</div>
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
