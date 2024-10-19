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
	return (
		<div class="relative">
			<Keyed value={props.embed.blob}>
				{(blob) => {
					const blobUrl = convertBlobToUrl(blob);

					return <video src={blobUrl} controls class="aspect-video rounded-md border border-outline" />;
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
