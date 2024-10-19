import {
	type Component,
	type ComponentProps,
	For,
	type JSX,
	Match,
	Show,
	Switch,
	batch,
	createEffect,
	createMemo,
	createSignal,
} from 'solid-js';
import { createMutable, unwrap } from 'solid-js/store';

import type { AppBskyActorDefs, AppBskyFeedPost } from '@atcute/client/lexicons';
import { type CreateQueryResult, useQueryClient } from '@mary/solid-query';

import { GLOBAL_LABELS, getLocalizedLabel } from '~/api/moderation';
import { createProfileQuery } from '~/api/queries/profile';
import { formatQueryError } from '~/api/utils/error';
import { parseAtUri } from '~/api/utils/strings';

import { globalEvents } from '~/globals/events';
import { openModal, useModalContext } from '~/globals/modals';

import { createEventListener } from '~/lib/hooks/event-listener';
import { type GuardFunction, createGuard } from '~/lib/hooks/guard';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';
import { SUPPORTED_IMAGE_FORMATS, openImagePicker } from '~/lib/utils/blob';
import { assert } from '~/lib/utils/invariant';
import { on } from '~/lib/utils/misc';

import Avatar, { getUserAvatarType } from '../avatar';
import Button from '../button';
import CircularProgress from '../circular-progress';
import * as Dialog from '../dialog';
import Divider from '../divider';
import { useFieldset } from '../fieldset';
import IconButton from '../icon-button';
import AddOutlinedIcon from '../icons-central/add-outline';
import AtOutlinedIcon from '../icons-central/at-outline';
import BlockOutlinedIcon from '../icons-central/block-outline';
import CircleInfoOutlinedIcon from '../icons-central/circle-info-outline';
import CrossLargeOutlinedIcon from '../icons-central/cross-large-outline';
import EarthOutlinedIcon from '../icons-central/earth-outline';
import EmojiSmileOutlinedIcon from '../icons-central/emoji-smile-outline';
import GifSquareOutlinedIcon from '../icons-central/gif-square-outline';
import ImageOutlinedIcon from '../icons-central/image-outline';
import LinkOutlinedIcon from '../icons-central/link-outline';
import PeopleOutlinedIcon from '../icons-central/people-outline';
import PersonCheckOutlinedIcon from '../icons-central/person-check-outline';
import ShieldCheckOutlinedIcon from '../icons-central/shield-check-outline';
import ShieldOutlinedIcon from '../icons-central/shield-outline';
import TranslateOutlinedIcon from '../icons-central/translate-outline';
import Keyed from '../keyed';
import * as Prompt from '../prompt';

import ComposerInput from './composer-input';
import ComposerReplyContext from './composer-reply-context';
import ContentWarningMenu from './dialogs/content-warning-menu';
import LanguageSelectDialogLazy from './dialogs/language-select-dialog-lazy';
import ThreadgateMenu from './dialogs/threadgate-menu';
import DraftListDialogLazy from './drafts/draft-list-dialog-lazy';
import FeedEmbed from './embeds/feed-embed';
import GifEmbed from './embeds/gif-embed';
import ImageEmbed from './embeds/image-embed';
import LinkEmbed from './embeds/link-embed';
import ListEmbed from './embeds/list-embed';
import QuoteEmbed from './embeds/quote-embed';
import type { GifMedia } from './gifs/gif-search-dialog';
import GifSearchDialogLazy from './gifs/gif-search-dialog-lazy';
import { publish } from './lib/api';
import { getRecordEmbedFromLink } from './lib/link-detection';
import {
	type ComposerState,
	type CreateComposerStateOptions,
	type PostEmbed,
	type PostState,
	ThreadgateKnownValue,
	createComposerState,
	createPostState,
	getEmbedLabels,
	getPostRt,
	getThreadgateValue,
} from './lib/state';

export interface ComposerDialogProps {
	/** This is static, meant for initializing the composer state */
	params?: CreateComposerStateOptions;
	onPublish?: () => void;
}

const MAX_POSTS = 25;
const MAX_IMAGES = 4;
const MAX_TEXT_LENGTH = 300;

const IS_UA_MOBILE = /Mobile/.test(navigator.userAgent);

const ComposerDialog = (props: ComposerDialogProps) => {
	const { close } = useModalContext();
	const { currentAccount } = useSession();
	const profile = createProfileQuery(() => currentAccount!.did);

	const queryClient = useQueryClient();
	const agent = useAgent();

	const [isCloseGuarded, addCloseGuard] = createGuard('some');
	const [canSubmit, addSubmitGuard] = createGuard('every');

	const [pending, setPending] = createSignal(false);
	const [error, setError] = createSignal<string>();
	const [message, setMessage] = createSignal<string>();

	const handleClose = () => {
		if (isCloseGuarded()) {
			openModal(() => (
				<Prompt.Confirm
					title="Discard draft?"
					description="You won't be able to retrieve what you've written"
					danger
					onConfirm={close}
				/>
			));

			return;
		}

		close();
	};

	const state = createMutable(createComposerState(props.params, currentAccount!.preferences.composer));

	const showAddPostButton = () => {
		var reply = state.reply;
		if (reply) {
			var ref = (reply.record as AppBskyFeedPost.Record).reply?.root;

			if (ref) {
				var uri = parseAtUri(ref.uri);
				if (uri.repo !== currentAccount!.did) {
					return false;
				}
			} else {
				if (reply.author.did !== currentAccount!.did) {
					return false;
				}
			}
		}

		return true;
	};

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

	const handleSubmit = async () => {
		if (pending() || !canSubmit()) {
			return;
		}

		setError();
		setPending(true);

		let success = false;

		try {
			await publish({
				agent: agent,
				queryClient: queryClient,
				state: unwrap(state),
				onLog: setMessage,
			});

			success = true;
		} catch (err) {
			setError(formatQueryError(err));
		} finally {
			setPending(false);
		}

		if (success) {
			close();

			globalEvents.emit('postpublished');
			props.onPublish?.();
		}
	};

	createEventListener(window, 'beforeunload', (ev) => {
		if (isCloseGuarded()) {
			ev.preventDefault();
		}
	});

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container disabled={pending()} onClose={handleClose}>
				<Dialog.Header>
					<Dialog.HeaderAccessory>
						<Dialog.Close onClose={handleClose} />
					</Dialog.HeaderAccessory>

					{!pending() ? (
						<Dialog.HeaderAccessory>
							{!state.reply && !isCloseGuarded() && (
								<Button
									onClick={() => {
										openModal(() => <DraftListDialogLazy />);
									}}
									variant="ghost"
								>
									Drafts
								</Button>
							)}

							<Button disabled={!canSubmit()} onClick={handleSubmit} variant="primary">
								Post
							</Button>
						</Dialog.HeaderAccessory>
					) : (
						<div class="flex items-center gap-6 px-2">
							<span class="text-de text-contrast-muted">{message()}</span>
							<CircularProgress />
						</div>
					)}
				</Dialog.Header>

				{error() ? (
					<p class="mx-2.5 flex gap-4 rounded bg-p-red-900 px-3 py-2 text-de font-medium text-p-red-100">
						{error()}
					</p>
				) : null}

				<Dialog.Body unpadded class="z-1 min-h-[9.75rem] pb-6">
					<Keyed value={state.reply}>
						{(reply) => {
							if (!reply) {
								return;
							}

							return <ComposerReplyContext post={reply} pending={pending()} />;
						}}
					</Keyed>

					<For each={state.posts}>
						{(post, idx) => (
							<Post
								profile={profile}
								state={state}
								post={post}
								idx={idx}
								addCloseGuard={addCloseGuard}
								addSubmitGuard={addSubmitGuard}
								onSubmit={handleSubmit}
							/>
						)}
					</For>
				</Dialog.Body>

				{!state.reply && <ThreadgateAction state={state} />}

				<PostAction
					disabled={false}
					post={state.posts[state.active]}
					canAddPost={state.posts.length < MAX_POSTS}
					showAddPost={showAddPostButton()}
					onAddPost={addPost}
				/>
			</Dialog.Container>
		</>
	);
};

export default ComposerDialog;

const Post = ({
	profile,
	state,
	post,
	idx,
	addCloseGuard,
	addSubmitGuard,
	onSubmit,
}: {
	profile: CreateQueryResult<AppBskyActorDefs.ProfileViewDetailed>;
	state: ComposerState;
	post: PostState;
	idx: () => number;
	addCloseGuard: (guard: GuardFunction) => void;
	addSubmitGuard: (guard: GuardFunction) => void;
	onSubmit: () => void;
}) => {
	let textarea: HTMLTextAreaElement;

	const fieldset = useFieldset();

	const hasPrevious = createMemo(() => idx() !== 0);
	const hasNext = createMemo(() => idx() !== state.posts.length - 1);

	const isActive = createMemo(() => idx() === state.active && !fieldset.disabled);
	const isFilled = () => {
		const embed = post.embed;
		const link = embed.link;
		const media = embed.media;
		const record = embed.record;

		return !!(
			(link || media || (record && (record.type !== 'quote' || !record.origin))) &&
			!getPostRt(post).empty
		);
	};

	const canRemove = createMemo(() => {
		return isActive() && (hasPrevious() || hasNext()) && !isFilled();
	});

	addCloseGuard(isFilled);
	addSubmitGuard(() => {
		const embed = post.embed;
		const link = embed.link;
		const media = embed.media;
		const record = embed.record;

		const richtext = getPostRt(post);
		const rtLength = richtext.length;

		return !!(
			(!richtext.empty || link || media || (record && (record.type !== 'quote' || !record.origin))) &&
			rtLength <= MAX_TEXT_LENGTH
		);
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

				<Avatar
					type={getUserAvatarType(profile.data)}
					src={profile.data?.avatar}
					class={!isActive() ? `opacity-50` : ``}
				/>

				{hasNext() && <div class="mt-1 grow border-l-2 border-outline-md"></div>}
			</div>

			<fieldset
				disabled={!isActive()}
				class={`relative flex min-w-0 grow flex-col gap-3 py-3` + (!isActive() ? ` opacity-50` : ``)}
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
					onSubmit={onSubmit}
					placeholder={
						!hasPrevious() ? (state.reply ? `Write your reply` : `What's up?`) : `Write another post`
					}
					minRows={isActive() ? 2 : 1}
				/>

				<Show
					when={(() => {
						const embed = post.embed;
						const link = embed.link;
						const media = embed.media;

						return !(link || media);
					})()}
				>
					<div class={`flex-col gap-1.5` + (isActive() ? ` flex empty:hidden` : ` hidden`)}>
						<For
							each={getPostRt(post).tokens.filter((token) => {
								return token.type === 'autolink' || token.type === 'link';
							})}
						>
							{(token) => {
								const pretty = token.url.replace(/^https?:\/\/(?=.)/i, '');

								const addLink = () => {
									const embed = post.embed;
									const record = getRecordEmbedFromLink(token.url);

									if (record) {
										if (!embed.record) {
											embed.record = record;
										}
									} else {
										if (!embed.link) {
											embed.link = { uri: token.url, labels: [] };
										}
									}
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
				</Show>

				<PostEmbeds embed={post.embed} active={isActive()} />

				<Show when={getEmbedLabels(post.embed)}>
					{(labels) => {
						const shown = () => labels().length !== 0 || isActive();

						return (
							<button
								onClick={(ev) => {
									const anchor = ev.currentTarget;

									openModal(() => (
										<ContentWarningMenu
											anchor={anchor}
											value={labels()}
											onChange={(next) => {
												const $labels = labels();
												$labels.splice(0, $labels.length, ...next);
											}}
										/>
									));
								}}
								class={
									`w-max gap-2 text-accent hover:underline active:opacity-75` +
									(shown() ? ` flex` : ` hidden`)
								}
							>
								{(() => {
									let Icon = ShieldOutlinedIcon;
									let text = `Add content warning`;

									const $labels = labels();
									const label = $labels.length !== 0 ? $labels[0] : undefined;

									if (label !== undefined) {
										if (label in GLOBAL_LABELS) {
											const matched = GLOBAL_LABELS[label];
											text = getLocalizedLabel(matched).n;
										} else {
											text = label;
										}

										Icon = ShieldCheckOutlinedIcon;
									}

									return [
										<Icon class="mt-0.5 shrink-0 text-base" />,
										<span class="text-de font-medium">{text}</span>,
									];
								})()}
							</button>
						);
					}}
				</Show>

				<Show
					when={(() => {
						const media = post.embed.media;
						return media && (media.type === 'image' || media.type === 'gif');
					})()}
				>
					<div class={`gap-2 text-contrast-muted` + (isActive() ? ` flex` : ` hidden`)}>
						<CircleInfoOutlinedIcon class="mt-0.5 shrink-0 text-base" />
						<p class="text-de">
							Alt text helps describe images for low-vision users and provide context for everyone.
						</p>
					</div>
				</Show>

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
			</fieldset>

			{!isActive() && !fieldset.disabled && (
				<button
					title={`Post #${idx() + 1}`}
					onClick={() => (state.active = idx())}
					class="absolute inset-0 z-1 outline-2 -outline-offset-2 outline-accent focus-visible:outline"
				></button>
			)}
		</div>
	);
};

const ThreadgateAction = ({ state }: { state: ComposerState }) => {
	const fieldset = useFieldset();

	return (
		<>
			<Divider class="opacity-70" />

			<button
				disabled={fieldset.disabled}
				onClick={(ev) => {
					const anchor = ev.currentTarget;

					openModal(() => (
						<ThreadgateMenu
							anchor={anchor}
							value={state.threadgate}
							onChange={(next) => {
								state.threadgate = next;
							}}
						/>
					));
				}}
				class={
					`flex h-11 shrink-0 select-none items-center gap-2 px-2 text-accent` +
					(!fieldset.disabled ? ` hover:bg-contrast/sm active:bg-contrast/sm-pressed` : ` opacity-50`)
				}
			>
				{(() => {
					let Icon: Component<ComponentProps<'svg'>>;
					let label: string;

					const value = getThreadgateValue(state.threadgate);

					if (value === ThreadgateKnownValue.CUSTOM) {
						Icon = PeopleOutlinedIcon;
						label = `Some users can reply`;
					} else if (value === ThreadgateKnownValue.EVERYONE) {
						Icon = EarthOutlinedIcon;
						label = `Everyone can reply`;
					} else if (value === ThreadgateKnownValue.FOLLOWS) {
						Icon = PersonCheckOutlinedIcon;
						label = `Followed users can reply`;
					} else if (value === ThreadgateKnownValue.MENTIONS) {
						Icon = AtOutlinedIcon;
						label = `Mentioned users can reply`;
					} else if (value === ThreadgateKnownValue.NONE) {
						Icon = BlockOutlinedIcon;
						label = `No one can reply`;
					} else {
						assert(false, `unexpected condition`);
					}

					return [<Icon class="w-9 text-lg" />, <span class="text-de font-medium">{label}</span>];
				})()}
			</button>
		</>
	);
};

const PostAction = (props: {
	disabled: boolean;
	post: PostState;
	canAddPost: boolean;
	showAddPost: boolean;
	onAddPost: () => void;
}) => {
	const fieldset = useFieldset();

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

	const canEmbedImage = () => {
		const media = props.post.embed.media;
		return !media || (media.type === 'image' && media.images.length < MAX_IMAGES);
	};

	const addImages = (blobs: Blob[]) => {
		const images = blobs.filter((blob) => SUPPORTED_IMAGE_FORMATS.includes(blob.type));
		if (images.length === 0) {
			return;
		}

		const post = props.post;

		let next = post.embed.media;
		if (!next) {
			next = {
				type: 'image',
				images: images.slice(0, MAX_IMAGES).map((blob) => ({ blob, alt: '' })),
				labels: [],
			};
		} else if (next.type === 'image') {
			next.images = next.images.concat(
				images.slice(0, MAX_IMAGES - next.images.length).map((blob) => ({ blob, alt: '' })),
			);
		}

		post.embed.media = next;
	};

	const addGif = (gif: GifMedia) => {
		const post = props.post;

		let next = post.embed.media;
		if (!next) {
			next = {
				type: 'gif',
				gif: gif,
				alt: undefined,
			};
		}

		post.embed.media = next;
	};

	return (
		<>
			<Divider class="opacity-70" />

			<div class="flex h-11 shrink-0 items-center justify-between px-2">
				<div class="flex items-center gap-2">
					<IconButton
						icon={ImageOutlinedIcon}
						title="Attach image..."
						disabled={!canEmbedImage()}
						onClick={() => {
							openImagePicker(addImages, true);
						}}
						variant="accent"
					/>

					<IconButton
						icon={GifSquareOutlinedIcon}
						title="Attach GIF..."
						disabled={(() => {
							const media = props.post.embed.media;
							return !!media;
						})()}
						onClick={() => {
							openModal(() => <GifSearchDialogLazy onPick={addGif} />);
						}}
						variant="accent"
					/>

					{!IS_UA_MOBILE && (
						<IconButton icon={EmojiSmileOutlinedIcon} title="Insert emoji..." variant="accent" />
					)}
				</div>

				<div class="flex items-center gap-2">
					<span
						class={
							`text-xs font-medium tabular-nums text-contrast-muted` +
							(fieldset.disabled ? ` opacity-50` : ``)
						}
					>
						{MAX_TEXT_LENGTH - getPostRt(props.post).length}
					</span>

					<IconButton
						icon={() => {
							return on(
								() => props.post.languages,
								(languages) => {
									if (languages.length === 0) {
										return <TranslateOutlinedIcon />;
									}

									const code = languages[0] + (languages.length !== 1 ? `+` : ``);
									return <span class="select-none text-xs font-bold uppercase tracking-widest">{code}</span>;
								},
							) as unknown as JSX.Element;
						}}
						title="Select language..."
						onClick={() => {
							openModal(() => (
								<LanguageSelectDialogLazy
									languages={props.post.languages.slice()}
									onChange={(next) => {
										props.post.languages = next;
									}}
								/>
							));
						}}
						variant="accent"
					/>

					{props.showAddPost && (
						<>
							<div class="my-2 self-stretch border-l border-outline opacity-70"></div>

							<IconButton
								icon={AddOutlinedIcon}
								title="Add post"
								disabled={!canAddPost()}
								onClick={props.onAddPost}
								variant="accent"
							/>
						</>
					)}
				</div>
			</div>

			{canEmbedImage() && <ImageDnd onAddImages={addImages} />}
		</>
	);
};

const ImageDnd = (props: { onAddImages: (blobs: Blob[]) => void }) => {
	const onAddImages = props.onAddImages;
	const [dropping, setDropping] = createSignal(false);

	let tracked: any;

	createEventListener(document, 'paste', (ev) => {
		const clipboardData = ev.clipboardData;
		if (!clipboardData) {
			return;
		}

		if (clipboardData.types.includes('Files')) {
			ev.preventDefault();
			onAddImages(Array.from(clipboardData.files));
		}
	});

	createEventListener(document, 'drop', (ev) => {
		const dataTransfer = ev.dataTransfer;
		if (!dataTransfer) {
			return;
		}

		ev.preventDefault();
		setDropping(false);

		tracked = undefined;

		if (dataTransfer.types.includes('Files')) {
			onAddImages(Array.from(dataTransfer.files));
		}
	});

	createEventListener(document, 'dragover', (ev) => {
		ev.preventDefault();
	});

	createEventListener(document, 'dragenter', (ev) => {
		if (!tracked && ev.dataTransfer?.types.includes('Files')) {
			setDropping(true);
			tracked = ev.target;
		} else if (tracked) {
			tracked = ev.target;
		}
	});

	createEventListener(document, 'dragleave', (ev) => {
		if (tracked === ev.target) {
			setDropping(false);
			tracked = undefined;
		}
	});

	return on(dropping, ($dropping) => {
		if (!$dropping) {
			return;
		}

		return (
			<div class="pointer-events-none fixed inset-0 z-1 flex items-center justify-center bg-contrast-overlay/40">
				<div class="rounded-lg bg-background p-2">
					<p class="rounded border-2 border-dashed border-outline px-9 py-11">Drop to add images</p>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const PostEmbeds = (props: { embed: PostEmbed; active: boolean }) => {
	const removeLink = () => {
		props.embed.link = undefined;
	};
	const removeMedia = () => {
		props.embed.media = undefined;
	};
	const removeRecord = () => {
		props.embed.record = undefined;
	};

	return (
		<>
			<Switch>
				<Match
					when={(() => {
						const media = props.embed.media;
						if (media && media.type === 'image') {
							return media;
						}
					})()}
				>
					{(image) => <ImageEmbed embed={image()} active={props.active} onRemove={removeMedia} />}
				</Match>

				<Match
					when={(() => {
						const media = props.embed.media;
						if (media && media.type === 'gif') {
							return media;
						}
					})()}
				>
					{(gif) => <GifEmbed embed={gif()} active={props.active} onRemove={removeMedia} />}
				</Match>

				<Match when={props.embed.link}>
					{(link) => <LinkEmbed embed={link()} active={props.active} onRemove={removeLink} />}
				</Match>
			</Switch>

			<Switch>
				<Match
					when={(() => {
						const record = props.embed.record;
						if (record && record.type === 'feed') {
							return record;
						}
					})()}
				>
					{(feed) => <FeedEmbed embed={feed()} active={props.active} onRemove={removeRecord} />}
				</Match>

				<Match
					when={(() => {
						const record = props.embed.record;
						if (record && record.type === 'list') {
							return record;
						}
					})()}
				>
					{(list) => <ListEmbed embed={list()} active={props.active} onRemove={removeRecord} />}
				</Match>

				<Match
					when={(() => {
						const record = props.embed.record;
						if (record && record.type === 'quote') {
							return record;
						}
					})()}
				>
					{(quote) => <QuoteEmbed embed={quote()} active={props.active} onRemove={removeRecord} />}
				</Match>
			</Switch>
		</>
	);
};
