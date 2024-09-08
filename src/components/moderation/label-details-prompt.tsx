import { type LabelModerationCause, type ModerationLabeler, getLocalizedLabel } from '~/api/moderation';

import { useModalContext } from '~/globals/modals';

import * as Prompt from '../prompt';

export interface LabelDetailsPrompt {
	cause: LabelModerationCause;
}

const LabelDetailsPrompt = ({ cause }: LabelDetailsPrompt) => {
	const { close } = useModalContext();

	const locale = getLocalizedLabel(cause.d);
	const service = cause.s;

	return (
		<Prompt.Container maxWidth="md">
			<Prompt.Title>{/* @once */ locale.n}</Prompt.Title>
			<Prompt.Description>{/* @once */ locale.d}</Prompt.Description>

			<p class="mb-1 mt-3 text-de text-contrast-muted">
				Label applied by{' '}
				{service ? (
					<a href={/* @once */ `/${service.did}/labels`} onClick={close} class="text-accent hover:underline">
						{/* @once */ renderLabelService(service)}
					</a>
				) : (
					`the author`
				)}
				.
			</p>

			<Prompt.Actions>
				<Prompt.Action>Dismiss</Prompt.Action>
			</Prompt.Actions>
		</Prompt.Container>
	);
};

export default LabelDetailsPrompt;

const renderLabelService = (source: ModerationLabeler) => {
	const profile = source.profile;

	if (profile) {
		return profile.displayName || `@${profile.handle}`;
	}

	return source.did;
};
