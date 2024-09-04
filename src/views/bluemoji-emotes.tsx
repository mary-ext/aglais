import { createEffect, createSignal, type JSX } from 'solid-js';

import { remove as removeExif } from '@mary/exif-rm';
import { createInfiniteQuery } from '@mary/solid-query';

import { listRecords } from '~/api/utils/records';

import { hasModals, openModal } from '~/globals/modals';

import { createEventListener } from '~/lib/hooks/event-listener';
import { on } from '~/lib/utils/misc';
import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import { MAX_ORIGINAL_SIZE, SUPPORTED_IMAGE_TYPES } from '~/lib/bluemoji/compress';
import { getCdnUrl } from '~/lib/bluemoji/render';

import IconButton from '~/components/icon-button';
import AddOutlinedIcon from '~/components/icons-central/add-outline';
import * as Page from '~/components/page';
import PagedList from '~/components/paged-list';
import * as Prompt from '~/components/prompt';

import AddEmotePrompt from '~/components/settings/bluemoji/add-emote-prompt';

const BluemojiEmotesPage = () => {
	const handleBlob = async (blob: Blob) => {
		const exifRemoved = removeExif(new Uint8Array(await blob.arrayBuffer()));
		if (exifRemoved !== null) {
			blob = new Blob([exifRemoved], { type: blob.type });
		}

		if (blob.size > MAX_ORIGINAL_SIZE) {
			openModal(() => (
				<Prompt.Confirm
					title="This image is too large"
					description="Images used for emotes cannot exceed more than 1 MB"
					confirmLabel="Okay"
					noCancel
				/>
			));

			return;
		}

		openModal(() => <AddEmotePrompt blob={blob} onAdd={() => {}} />);
	};

	const { rpc } = useAgent();
	const { currentAccount } = useSession();

	const query = createInfiniteQuery(() => ({
		queryKey: ['bluemoji', 'emotes'],
		async queryFn(ctx) {
			return listRecords(rpc, {
				repo: currentAccount!.did,
				collection: 'blue.moji.collection.item',
				limit: 100,
				cursor: ctx.pageParam,
			});
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (last) => last.cursor,
	}));

	return (
		<>
			<FileDnd onAdd={handleBlob} />

			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/settings" />
				</Page.HeaderAccessory>

				<Page.Heading title="Emotes" />

				<Page.HeaderAccessory>
					<IconButton
						title="Upload emote"
						icon={AddOutlinedIcon}
						onClick={() => {
							const input = document.createElement('input');
							input.type = 'file';
							input.accept = SUPPORTED_IMAGE_TYPES.join(',');

							input.oninput = () => {
								const files = input.files;
								if (files && files.length !== 0) {
									handleBlob(files[0]);
								}
							};

							input.click();
						}}
					/>
				</Page.HeaderAccessory>
			</Page.Header>

			<p class="text-pretty p-4 text-de text-contrast-muted">
				Here be dragons, this is an experimental feature, and things can change at any time. Animated emotes
				are not yet supported.
			</p>

			<PagedList
				data={query.data?.pages.map((page) => page.records)}
				render={(item) => {
					const record = item.value;
					const formats = record.formats;

					const blob = formats.png_128 ?? formats.original;

					return (
						<div class="flex items-center gap-4 px-4 py-4">
							<img
								src={/* @once */ getCdnUrl(currentAccount!.did, blob!.ref.$link)}
								class="h-8 w-8 object-cover"
							/>

							<div class="grow text-sm font-medium">
								<span class="text-contrast-muted">:</span>
								<span>{/* @once */ record.name}</span>
								<span class="text-contrast-muted">:</span>
							</div>
						</div>
					);
				}}
				fallback={<p class="py-6 text-center text-base font-medium">No emotes added yet.</p>}
				hasNextPage={query.hasNextPage}
				isFetchingNextPage={query.isFetching}
				onEndReached={() => query.fetchNextPage()}
			/>
		</>
	);
};

export default BluemojiEmotesPage;

const FileDnd = ({ onAdd }: { onAdd: (blob: Blob) => void }) => {
	const [dropping, setDropping] = createSignal(false);

	createEffect(() => {
		if (hasModals()) {
			return;
		}

		let tracked: any;

		createEventListener(document, 'paste', (ev) => {
			const clipboardData = ev.clipboardData;
			if (!clipboardData) {
				return;
			}

			if (clipboardData.types.includes('Files')) {
				const files = Array.from(clipboardData.files).filter((file) =>
					SUPPORTED_IMAGE_TYPES.includes(file.type),
				);

				ev.preventDefault();

				if (files.length !== 0) {
					console.log(files);
					onAdd(files[0]);
				}
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
				const files = Array.from(dataTransfer.files).filter((file) =>
					SUPPORTED_IMAGE_TYPES.includes(file.type),
				);

				if (files.length !== 0) {
					console.log(files);
					onAdd(files[0]);
				}
			}
		});

		createEventListener(document, 'dragover', (ev) => {
			ev.preventDefault();
		});

		createEventListener(document, 'dragenter', (ev) => {
			setDropping(true);
			tracked = ev.target;
		});

		createEventListener(document, 'dragleave', (ev) => {
			if (tracked === ev.target) {
				setDropping(false);
				tracked = undefined;
			}
		});
	});

	return on(dropping, ($dropping) => {
		if (!$dropping) {
			return;
		}

		return (
			<div class="pointer-events-none fixed inset-0 z-[3] flex items-center justify-center bg-contrast-overlay/40">
				<div class="rounded-lg bg-background p-2">
					<p class="rounded border-2 border-dashed border-outline px-9 py-11">Drop to add emote</p>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};
