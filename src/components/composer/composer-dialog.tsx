import { For, batch, createEffect, createMemo } from 'solid-js';

import { useProfileQuery } from '~/api/queries/profile';

import { useModalContext } from '~/globals/modals';

import { createGuard } from '~/lib/hooks/guard';
import { useSession } from '~/lib/states/session';

import Button from '../button';
import * as Dialog from '../dialog';
import IconButton from '../icon-button';

import Avatar from '../avatar';
import Divider from '../divider';
import AddOutlinedIcon from '../icons-central/add-outline';
import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import EarthOutlinedIcon from '../icons-central/earth-outline';
import EmojiSmileOutlinedIcon from '../icons-central/emoji-smile-outline';
import GifSquareOutlinedIcon from '../icons-central/gif-square-outline';
import ImageOutlinedIcon from '../icons-central/image-outline';
import ShieldOutlinedIcon from '../icons-central/shield-outline';

import ComposerInput from './composer-input';
import {
	createComposerState,
	createPostState,
	type CreateComposerStateOptions,
	type PostState,
} from './state';

export interface ComposerDialogProps {
	/** This is static, meant for initializing the composer state */
	params?: CreateComposerStateOptions;
}

const ComposerDialog = (props: ComposerDialogProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();
	const profile = useProfileQuery(() => currentAccount!.did);

	const [isCloseGuarded, addCloseGuard] = createGuard('some');
	const [canSubmit, addSubmitGuard] = createGuard('every');

	const handleClose = () => {
		if (isCloseGuarded()) {
			return;
		}

		close();
	};

	const state = createComposerState(props.params);

	const addPost = () => {
		const currentPosts = state.posts.value;

		const anchor = currentPosts[state.active.value];
		const filtered = currentPosts.filter(
			(p) => p === anchor || p.richtext.value.length !== 0 || !!p.embed.value,
		);

		const anchorIndex = filtered.indexOf(anchor);
		const newPost = createPostState({ languages: anchor.languages.value });

		batch(() => {
			state.active.value = anchorIndex + 1;
			state.posts.value = filtered.toSpliced(anchorIndex + 1, 0, newPost);
		});
	};

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container onClose={handleClose}>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close onClose={handleClose} />
					</Dialog.HeaderAccessory>

					<Dialog.HeaderAccessory>
						<Button disabled={!canSubmit()} variant="primary">
							Post
						</Button>
					</Dialog.HeaderAccessory>
				</Dialog.Header>

				<Dialog.Body unpadded>
					<For each={state.posts.value}>
						{(post, idx) => {
							let textarea: HTMLTextAreaElement;

							const hasPrevious = createMemo(() => idx() !== 0);
							const hasNext = createMemo(() => idx() !== state.posts.value.length - 1);

							const isActive = createMemo(() => idx() === state.active.value);
							const isFilled = () => {
								return !(post.richtext.value.length === 0 && !post.embed.value);
							};

							const canRemove = createMemo(() => {
								return isActive() && (hasPrevious() || hasNext()) && !isFilled();
							});

							addCloseGuard(isFilled);
							addSubmitGuard(() => {
								const embed = post.embed.value;
								const richtext = post.richtext.value;
								const rtLength = richtext.length;

								return (embed || rtLength > 0) && rtLength < 300;
							});

							createEffect(() => {
								if (isActive()) {
									textarea.focus();
								}
							});

							return (
								<div class="relative flex gap-3 px-4">
									<div class="flex shrink-0 flex-col items-center pt-3">
										{(hasPrevious() || state.reply.value) && (
											<div class="absolute top-0 h-2 border-l-2 border-outline-md"></div>
										)}

										<Avatar type="user" src={profile.data?.avatar} />

										{hasNext() && <div class="mt-1 grow border-l-2 border-outline-md"></div>}
									</div>

									<div
										inert={!isActive()}
										class={`relative min-w-0 grow py-3` + (!isActive() ? ` opacity-50` : ``)}
									>
										<ComposerInput
											ref={(node) => {
												textarea = node;
											}}
											rt={post.richtext.value}
											onChange={(next) => {
												post.richtext.value = next;
											}}
											placeholder={
												!hasPrevious()
													? state.reply.value
														? `Write your reply`
														: `What's up?`
													: `Write another post`
											}
											minRows={isActive() ? 2 : 1}
										/>

										{canRemove() && (
											<div class="absolute -right-2 top-0 z-1 mt-3">
												<IconButton
													icon={CrossLargeOutlinedIcon}
													title="Remove this post"
													onClick={() => {
														const posts = state.posts.value;

														const index = idx();
														const nextIndex = posts[index + 1] ? index : posts[index - 1] ? index - 1 : null;

														if (nextIndex !== null) {
															batch(() => {
																state.active.value = nextIndex;
																state.posts.value = posts.toSpliced(index, 1);
															});
														}
													}}
												/>
											</div>
										)}
									</div>

									{!isActive() && (
										<button
											title={`Post #${idx()}`}
											onClick={() => (state.active.value = idx())}
											class="absolute inset-0 z-1"
										></button>
									)}
								</div>
							);
						}}
					</For>
				</Dialog.Body>

				{!state.reply.value && <ThreadgateAction />}
				<PostAction disabled={false} post={state.posts.value[state.active.value]} onAddPost={addPost} />
			</Dialog.Container>
		</>
	);
};

export default ComposerDialog;

const ThreadgateAction = () => {
	return (
		<>
			<Divider class="opacity-70" />

			<button class="flex h-11 select-none items-center gap-2 px-2 text-accent hover:bg-contrast/sm active:bg-contrast/sm-pressed">
				<EarthOutlinedIcon class="w-9 text-lg" />
				<span class="text-de font-medium">Everyone can reply</span>
			</button>
		</>
	);
};

const PostAction = (props: { disabled: boolean; post: PostState; onAddPost: () => void }) => {
	const canAddPost = () => {
		const post = props.post;

		const embed = post.embed.value;
		const richtext = post.richtext.value;
		const rtLength = richtext.length;

		return (embed || rtLength > 0) && rtLength < 300;
	};

	return (
		<>
			<Divider class="opacity-70" />

			<div class="flex h-11 shrink-0 items-center justify-between px-2">
				<div class="flex items-center gap-2">
					<IconButton icon={ImageOutlinedIcon} title="Attach image..." variant="accent" />
					<IconButton icon={GifSquareOutlinedIcon} title="Attach GIF..." variant="accent" />
					<IconButton icon={EmojiSmileOutlinedIcon} title="Insert emoji..." variant="accent" />
				</div>

				<div class="flex items-center gap-2">
					<span class="text-xs font-medium text-contrast-muted">300</span>

					<IconButton
						icon={() => <span class="select-none text-xs font-bold">EN</span>}
						title="Select language..."
						variant="accent"
					/>

					<IconButton icon={ShieldOutlinedIcon} title="Select content warning..." variant="accent" />

					<div class="my-2 self-stretch border-l border-outline opacity-70"></div>

					<IconButton
						icon={AddOutlinedIcon}
						title="Add post"
						disabled={!canAddPost()}
						onClick={props.onAddPost}
						variant="accent"
					/>
				</div>
			</div>
		</>
	);
};
