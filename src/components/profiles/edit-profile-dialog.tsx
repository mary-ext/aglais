import { createMemo, createSignal, Show } from 'solid-js';

import type { AppBskyActorDefs, At } from '@mary/bluesky-client/lexicons';
import { createMutation } from '@mary/solid-query';

import { uploadBlob } from '~/api/queries/blob';
import type { TimelineParams } from '~/api/queries/timeline';
import { graphemeLen } from '~/api/richtext/intl';
import { PLAIN_WS_RE } from '~/api/richtext/parser/parse';
import { getRecord, putRecord } from '~/api/utils/mutation';

import { openModal, useModalContext } from '~/globals/modals';

import { compressProfileImage } from '~/lib/bsky/image';
import { modelText } from '~/lib/input-refs';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';
import { convertBlobToUrl, openImagePicker } from '~/lib/utils/blob';

import Button from '../button';
import * as Dialog from '../dialog';
import IconButton from '../icon-button';
import ImageOutlinedIcon from '../icons-central/image-outline';
import ImageUploadMenu from '../images/image-upload-menu';
import CharCounterAccessory from '../input/char-counter-accessory';
import TextInput from '../text-input';
import TextareaInput from '../textarea-input';

export interface EditProfileDialogProps {
	profile: AppBskyActorDefs.ProfileViewDetailed;
}

const EditProfileDialog = ({ profile }: EditProfileDialogProps) => {
	const { close } = useModalContext();

	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	const snapshot = {
		name: profile.displayName ?? '',
		bio: profile.description ?? '',
		avatar: profile.avatar,
		banner: profile.banner,
	};

	const [name, setName] = createSignal(snapshot.name);
	const [bio, setBio] = createSignal(snapshot.bio);
	const [avatar, setAvatar] = createSignal<Blob | string | undefined>(snapshot.avatar);
	const [banner, setBanner] = createSignal<Blob | string | undefined>(snapshot.banner);

	const nameLen = createMemo(() => graphemeLen(name()));
	const bioLen = createMemo(() => graphemeLen(bio()));

	const isEqual = () => {
		return (
			name() === snapshot.name &&
			bio() === snapshot.bio &&
			avatar() === snapshot.avatar &&
			banner() === snapshot.banner
		);
	};

	const isValid = () => {
		return nameLen() < 64 && bioLen() < 256;
	};

	const mutation = createMutation((queryClient) => ({
		async mutationFn() {
			const repo = currentAccount!.did;

			const $name = name().trim();
			const $bio = bio().replace(PLAIN_WS_RE, '');
			const $avatar = avatar();
			const $banner = banner();

			let avatarPromise: Promise<At.Blob<any>> | undefined;
			let bannerPromise: Promise<At.Blob<any>> | undefined;

			if ($avatar instanceof Blob) {
				avatarPromise = compressProfileImage($avatar, 1000, 1000).then((res) => uploadBlob(rpc, res.blob));
			}
			if ($banner instanceof Blob) {
				bannerPromise = compressProfileImage($banner, 3000, 1000).then((res) => uploadBlob(rpc, res.blob));
			}

			const existing = await getRecord(rpc, {
				repo,
				collection: 'app.bsky.actor.profile',
				rkey: 'self',
			}).catch(() => undefined);

			let record = existing?.value ?? {};
			record.displayName = $name;
			record.description = $bio;

			if (avatarPromise) {
				record.avatar = await avatarPromise;
			} else if ($avatar === undefined) {
				record.avatar = undefined;
			}

			if (bannerPromise) {
				record.banner = await bannerPromise;
			} else if ($banner === undefined) {
				record.banner = undefined;
			}

			await putRecord(rpc, {
				repo,
				collection: 'app.bsky.actor.profile',
				rkey: 'self',
				record: record,
				swapRecord: existing?.cid ?? null,
			});
		},
		async onSuccess() {
			close();

			setTimeout(() => {
				queryClient.refetchQueries({
					queryKey: ['profile', currentAccount!.did],
					exact: true,
				});

				queryClient.resetQueries({
					queryKey: ['timeline'],
					predicate(query) {
						const [, params] = query.queryKey as [root: string, params: TimelineParams];
						return params.type === 'profile' && params.actor === currentAccount!.did;
					},
				});
			}, 1_500);
		},
	}));

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		mutation.mutate();
	};

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container disabled={mutation.isPending} fullHeight>
				<form onSubmit={handleSubmit} class="contents">
					<Dialog.Header>
						<Dialog.HeaderAccessory>
							<Dialog.Close />
						</Dialog.HeaderAccessory>

						<Dialog.Heading title="Edit profile" />

						<Dialog.HeaderAccessory>
							<Button type="submit" disabled={!isValid() || isEqual()} variant="primary">
								Save
							</Button>
						</Dialog.HeaderAccessory>
					</Dialog.Header>

					<Show when={mutation.error}>
						<p class="mx-2.5 mb-2.5 flex gap-4 rounded bg-p-red-900 px-3 py-2 text-de font-medium text-p-red-100">
							Something went wrong, try again later.
						</p>
					</Show>

					<Dialog.Body unpadded class="flex flex-col">
						<div class="relative aspect-banner overflow-hidden bg-outline-md">
							<Show when={banner()} keyed>
								{(banner) => (
									<img src={/* @once */ convertBlobToUrl(banner)} class="h-full w-full object-cover" />
								)}
							</Show>

							<div class="absolute inset-0 flex items-center justify-center gap-4 bg-background/25">
								<IconButton
									icon={ImageOutlinedIcon}
									title="Edit banner"
									onClick={(ev) => {
										if (banner()) {
											const anchor = ev.currentTarget;

											openModal(() => (
												<ImageUploadMenu
													anchor={anchor}
													onUpload={() => openImagePicker((files) => setBanner(files[0]), false)}
													onRemove={() => setBanner()}
												/>
											));

											return;
										}

										openImagePicker((files) => setBanner(files[0]), false);
									}}
									variant="black"
								/>
							</div>
						</div>

						<div class="z-1 flex flex-col gap-6 p-4">
							<div class="relative -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-outline-md outline-2 outline-background outline">
								<Show when={avatar()} keyed>
									{(avatar) => (
										<img src={/* @once */ convertBlobToUrl(avatar)} class="h-full w-full object-cover" />
									)}
								</Show>

								<div class="absolute inset-0 flex items-center justify-center gap-4 bg-background/25">
									<IconButton
										icon={ImageOutlinedIcon}
										title="Edit avatar"
										onClick={(ev) => {
											if (avatar()) {
												const anchor = ev.currentTarget;

												openModal(() => (
													<ImageUploadMenu
														anchor={anchor}
														onUpload={() => openImagePicker((files) => setAvatar(files[0]), false)}
														onRemove={() => setAvatar()}
													/>
												));

												return;
											}

											openImagePicker((files) => setAvatar(files[0]), false);
										}}
										variant="black"
									/>
								</div>
							</div>

							<TextInput
								ref={(node) => {
									modelText(node, name, setName);
								}}
								label="Display name"
								headerAccessory={<CharCounterAccessory value={nameLen()} max={64} />}
							/>

							<TextareaInput
								ref={(node) => {
									modelText(node, bio, setBio);
								}}
								label="Bio"
								headerAccessory={<CharCounterAccessory value={bioLen()} max={256} />}
								minRows={4}
							/>
						</div>
					</Dialog.Body>
				</form>
			</Dialog.Container>
		</>
	);
};

export default EditProfileDialog;
