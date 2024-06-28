import { For, Show, batch, createEffect, createMemo } from 'solid-js';
import { createMutable } from 'solid-js/store';

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
import LinkOutlinedIcon from '../icons-central/link-outline';
import ShieldOutlinedIcon from '../icons-central/shield-outline';
import Keyed from '../keyed';

import ComposerInput from './composer-input';
import ExternalEmbed from './embeds/external-embed';
import type { BaseEmbedProps } from './embeds/types';

import { getEmbedFromLink } from './lib/link-detection';
import {
	EmbedKind,
	createComposerState,
	createPostState,
	getAvailableEmbed,
	getEmbedLabels,
	getPostRt,
	type CreateComposerStateOptions,
	type PostState,
} from './lib/state';
import FeedEmbed from './embeds/feed-embed';
import InfoOutlinedIcon from '../icons-central/info-outline';

export interface ComposerDialogProps {
	/** This is static, meant for initializing the composer state */
	params?: CreateComposerStateOptions;
}

const MAX_POSTS = 25;
const MAX_TEXT_LENGTH = 300;

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

	const state = createMutable(createComposerState(props.params));

	const addPost = () => {
		const currentPosts = state.posts;

		const anchor = currentPosts[state.active];
		const filtered = currentPosts.filter((p) => p === anchor || getPostRt(p).length !== 0 || !!p.embed);

		const anchorIndex = filtered.indexOf(anchor);
		const newPost = createPostState({ languages: anchor.languages.slice() });

		batch(() => {
			state.active = anchorIndex + 1;
			state.posts = filtered.toSpliced(anchorIndex + 1, 0, newPost);
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

				<Dialog.Body unpadded class="min-h-[9.75rem]">
					<For each={state.posts}>
						{(post, idx) => {
							let textarea: HTMLTextAreaElement;

							const hasPrevious = createMemo(() => idx() !== 0);
							const hasNext = createMemo(() => idx() !== state.posts.length - 1);

							const isActive = createMemo(() => idx() === state.active);
							const isFilled = () => {
								return !(getPostRt(post).length === 0 && !post.embed);
							};

							const canRemove = createMemo(() => {
								return isActive() && (hasPrevious() || hasNext()) && !isFilled();
							});
							const canEmbed = createMemo(() => {
								return getAvailableEmbed(post.embed);
							});

							addCloseGuard(isFilled);
							addSubmitGuard(() => {
								const embed = post.embed;
								const richtext = getPostRt(post);

								const rtLength = richtext.length;

								return (embed || rtLength > 0) && rtLength < MAX_TEXT_LENGTH;
							});

							createEffect(() => {
								if (isActive()) {
									post.embed;
									textarea.focus();
								}
							});

							return (
								<div class="relative flex gap-3 px-4">
									<div class="flex shrink-0 flex-col items-center pt-3">
										{(hasPrevious() || state.reply) && (
											<div class="absolute top-0 h-2 border-l-2 border-outline-md"></div>
										)}

										<Avatar type="user" src={profile.data?.avatar} class={!isActive() ? `opacity-50` : ``} />

										{hasNext() && <div class="mt-1 grow border-l-2 border-outline-md"></div>}
									</div>

									<div
										inert={!isActive()}
										class={
											`relative flex min-w-0 grow flex-col gap-3 py-3` + (!isActive() ? ` opacity-50` : ``)
										}
									>
										<ComposerInput
											ref={(node) => {
												textarea = node;
											}}
											value={post.text}
											rt={getPostRt(post)}
											onChange={(next) => {
												post.text = next;
											}}
											placeholder={
												!hasPrevious()
													? state.reply
														? `Write your reply`
														: `What's up?`
													: `Write another post`
											}
											minRows={isActive() ? 2 : 1}
										/>

										{(canEmbed() & EmbedKind.EXTERNAL) !== 0 && (
											<div class={`flex-col gap-1.5` + (isActive() ? ` flex empty:hidden` : ` hidden`)}>
												<For each={getPostRt(post).links}>
													{(href) => {
														const pretty = href.replace(/^https?:\/\//i, '');

														const addLink = () => {
															post.embed = getEmbedFromLink(href);
														};

														return (
															<button
																onClick={addLink}
																class="flex items-center gap-3 rounded border border-outline px-3 py-2.5 text-sm hover:bg-contrast-hinted/sm active:bg-contrast-hinted/sm-pressed"
															>
																<LinkOutlinedIcon class="shrink-0 text-contrast-muted" />
																<span class="overflow-hidden text-ellipsis whitespace-nowrap text-contrast-muted">
																	{pretty}
																</span>
															</button>
														);
													}}
												</For>
											</div>
										)}

										<Show when={post.embed}>
											{(embed) => (
												<PostEmbeds
													embed={embed()}
													active={isActive()}
													dispatch={(action) => {
														const $embed = embed();
														const kind = $embed.type;

														switch (action.type) {
															case 'remove_media': {
																if (kind === EmbedKind.RECORD_WITH_MEDIA) {
																	post.embed = $embed.record;
																} else if (kind & EmbedKind.MEDIA) {
																	post.embed = undefined;
																}

																break;
															}
															case 'remove_record': {
																if (kind === EmbedKind.RECORD_WITH_MEDIA) {
																	post.embed = $embed.media;
																} else if (kind & EmbedKind.RECORD) {
																	post.embed = undefined;
																}

																break;
															}
														}
													}}
												/>
											)}
										</Show>

										{false && (
											<div class="flex gap-1.5 text-contrast-muted">
												<InfoOutlinedIcon class="mt-0.5 shrink-0 text-base" />
												<p class="text-de">
													Alt text helps to describe images for low-vision users and provides context to
													everyone.
												</p>
											</div>
										)}

										{canRemove() && (
											<div class="absolute -right-2 top-0 z-1 mt-3">
												<IconButton
													icon={CrossLargeOutlinedIcon}
													title="Remove this post"
													onClick={() => {
														const posts = state.posts;

														const index = idx();
														const nextIndex = posts[index + 1] ? index : posts[index - 1] ? index - 1 : null;

														if (nextIndex !== null) {
															batch(() => {
																state.active = nextIndex;
																state.posts = posts.toSpliced(index, 1);
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
											onClick={() => (state.active = idx())}
											class="absolute inset-0 z-1 outline-2 -outline-offset-2 outline-contrast focus-visible:outline"
										></button>
									)}
								</div>
							);
						}}
					</For>
				</Dialog.Body>

				{!state.reply && <ThreadgateAction />}

				<PostAction
					disabled={false}
					post={state.posts[state.active]}
					canAddPost={state.posts.length < MAX_POSTS}
					onAddPost={addPost}
				/>
			</Dialog.Container>
		</>
	);
};

export default ComposerDialog;

const ThreadgateAction = () => {
	return (
		<>
			<Divider class="opacity-70" />

			<button class="flex h-11 shrink-0 select-none items-center gap-2 px-2 text-accent hover:bg-contrast/sm active:bg-contrast/sm-pressed">
				<EarthOutlinedIcon class="w-9 text-lg" />
				<span class="text-de font-medium">Everyone can reply</span>
			</button>
		</>
	);
};

const PostAction = (props: {
	disabled: boolean;
	post: PostState;
	canAddPost: boolean;
	onAddPost: () => void;
}) => {
	const canAddPost = () => {
		if (!props.canAddPost) {
			return false;
		}

		const post = props.post;

		const embed = post.embed;
		const richtext = getPostRt(post);
		const rtLength = richtext.length;

		return (embed || rtLength > 0) && rtLength < MAX_TEXT_LENGTH;
	};

	const canEmbed = createMemo(() => {
		return getAvailableEmbed(props.post.embed);
	});
	const embedLabels = createMemo(() => {
		return getEmbedLabels(props.post.embed);
	});

	return (
		<>
			<Divider class="opacity-70" />

			<div class="flex h-11 shrink-0 items-center justify-between px-2">
				<div class="flex items-center gap-2">
					<IconButton
						icon={ImageOutlinedIcon}
						title="Attach image..."
						disabled={!(canEmbed() & EmbedKind.IMAGE)}
						variant="accent"
					/>
					<IconButton
						icon={GifSquareOutlinedIcon}
						title="Attach GIF..."
						disabled={!(canEmbed() & EmbedKind.GIF)}
						variant="accent"
					/>
					<IconButton icon={EmojiSmileOutlinedIcon} title="Insert emoji..." variant="accent" />
				</div>

				<div class="flex items-center gap-2">
					<span class="text-xs font-medium tabular-nums text-contrast-muted">
						{MAX_TEXT_LENGTH - getPostRt(props.post).length}
					</span>

					{embedLabels() && (
						<IconButton icon={ShieldOutlinedIcon} title="Select content warning..." variant="accent" />
					)}

					<IconButton
						icon={() => <span class="select-none text-xs font-bold tracking-widest">EN</span>}
						title="Select language..."
						variant="accent"
					/>

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

const PostEmbeds = (props: BaseEmbedProps) => {
	return (
		<Keyed value={props.embed.type}>
			{(type) => {
				if (type === EmbedKind.EXTERNAL) {
					// @ts-expect-error
					return <ExternalEmbed {...props} />;
				}

				if (type === EmbedKind.FEED) {
					// @ts-expect-error
					return <FeedEmbed {...props} />;
				}

				return null;
			}}
		</Keyed>
	);
};
