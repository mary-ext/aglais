import { Show, type JSX } from 'solid-js';

export interface PostDeletedGateProps {
	deleted: boolean;
	bypass: boolean;
	children: JSX.Element;
}

const PostDeletedGate = (props: PostDeletedGateProps) => {
	if (props.bypass) {
		return props.children;
	}

	return (
		<Show when={props.deleted} fallback={props.children}>
			<div class="min-w-0 grow pb-3">
				<div class="flex h-9 items-center text-sm">
					<p class="text-contrast-muted">Post deleted</p>
				</div>
			</div>
		</Show>
	);
};

export default PostDeletedGate;
