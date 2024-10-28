import { Show } from 'solid-js';

import type { ComAtprotoLabelDefs } from '@atcute/client/lexicons';

import { useSession } from '~/lib/states/session';

import CircleInfoOutlinedIcon from '../icons-central/circle-info-outline';

export interface LabelsOnMeProps {
	labels: ComAtprotoLabelDefs.Label[] | undefined;
	large?: boolean;
	class?: string;
}

const LabelsOnMe = (props: LabelsOnMeProps) => {
	const { currentAccount } = useSession();

	return (
		<Show
			when={(() => {
				const did = currentAccount?.did;
				const labels = props.labels?.filter((l) => l.src !== did && l.val[0] !== '!');

				if (labels && labels.length > 0) {
					return labels;
				}
			})()}
		>
			{(labels) => (
				<div class={props.class}>
					<button
						onClick={() => {}}
						class={
							`group flex items-center rounded-md text-contrast/75 hover:text-contrast` +
							(!props.large ? ` h-5 text-xs hover:bg-contrast/sm-pressed` : ` h-6 bg-contrast/10 text-de`)
						}
					>
						<CircleInfoOutlinedIcon
							class={`ml-1 opacity-80 group-hover:opacity-100` + (!props.large ? ` text-xs` : ` w-4 text-sm`)}
						/>
						<span class="mx-1.5">{`${labels().length} ${labels().length === 1 ? `label` : `labels`} placed on this content`}</span>
					</button>
				</div>
			)}
		</Show>
	);
};

export default LabelsOnMe;
