import { createMemo, createSignal } from 'solid-js';

import * as TID from '@mary/atproto-tid';

import { useModalContext } from '~/globals/modals';

import type { TagItem } from '~/lib/aglais-bookmarks/db';
import { modelText } from '~/lib/input-refs';
import { useBookmarks } from '~/lib/states/bookmarks';

import Button from '../button';
import * as Dialog from '../dialog';
import BookmarkSolidIcon from '../icons-central/bookmark-solid';
import CheckOutlinedIcon from '../icons-central/check-outline';
import TextInput from '../text-input';

import { BOOKMARK_ICONS, getForegroundColor, hexStringToRgb } from './bookmark-folder-avatar';

const rawColorOptions: { color: string | undefined; label: string }[] = [
	{ color: undefined, label: `Default` },
	{ color: '#ffd400', label: `Yellow` },
	{ color: '#f91880', label: `Pink` },
	{ color: '#7856ff', label: `Purple` },
	{ color: '#ff7a00', label: `Orange` },
	{ color: '#00ba7c', label: `Green` },
];

const rawIconOptions: { icon: keyof typeof BOOKMARK_ICONS | undefined; label: string }[] = [
	{ icon: undefined, label: `Default` },
	{ icon: 'art', label: `Art` },
	{ icon: 'education', label: `Education` },
	{ icon: 'fire', label: `Fire` },
	{ icon: 'gaming', label: `Gaming` },
	{ icon: 'music', label: `Music` },
	{ icon: 'shopping', label: `Shopping` },
	{ icon: 'sports', label: `Sports` },
];

export interface BookmarkFolderFormDialogProps {
	folder?: TagItem;
	onSave?: () => void;
}

const BookmarkFolderFormDialog = ({ folder, onSave }: BookmarkFolderFormDialogProps) => {
	const colorOptions = rawColorOptions.map(({ label, color }) => {
		return {
			value: color,
			label: label,
			bgColor: color ? color : 'rgb(var(--p-accent))',
			fgColor: color ? getForegroundColor(hexStringToRgb(color)!) : 'rgb(var(--p-accent-fg))',
		};
	});

	const iconOptions = rawIconOptions.map(({ label, icon }) => {
		return {
			value: icon,
			label: label,
			component: icon ? BOOKMARK_ICONS[icon] : BookmarkSolidIcon,
		};
	});

	const bookmarks = useBookmarks();
	const { close } = useModalContext();

	const [name, setName] = createSignal<string>('');
	const [color, setColor] = createSignal<string>();
	const [icon, setIcon] = createSignal<string>();

	if (folder) {
		setName(folder.name);
		setColor(folder.color);
		setIcon(folder.icon);
	}

	const isValid = createMemo(() => {
		const $name = name();
		const nameLen = $name.length;

		return nameLen > 0 && nameLen <= 25;
	});

	const handleSubmit = async (ev: Event) => {
		ev.preventDefault();

		const db = await bookmarks.open();

		const entry: TagItem = {
			id: folder ? folder.id : TID.now(),
			name: name(),
			color: color(),
			icon: icon(),
			created_at: folder ? folder.created_at : Date.now(),
		};

		if (!folder) {
			await db.add('tags', entry);
		} else {
			await db.put('tags', entry);
		}

		onSave?.();
		close();
	};

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<form onSubmit={handleSubmit} class="contents">
					<Dialog.Header>
						<Dialog.HeaderAccessory>
							<Dialog.Close />
						</Dialog.HeaderAccessory>

						<Dialog.Heading title={!folder ? `Create a Bookmark Folder` : `Edit Bookmark Folder`} />

						<Dialog.HeaderAccessory>
							<Button type="submit" disabled={!isValid()} variant="primary">
								Save
							</Button>
						</Dialog.HeaderAccessory>
					</Dialog.Header>

					<Dialog.Body class="flex flex-col gap-6">
						<TextInput
							ref={(node) => {
								modelText(node, name, setName);
							}}
							label="Folder name"
						/>

						<div class="flex flex-col gap-3">
							<span class="text-sm font-medium text-contrast">Folder color</span>

							<div class="grid grid-cols-3 justify-items-center gap-3">
								{colorOptions.map(({ value, label, fgColor, bgColor }) => {
									const isSelected = createMemo(() => color() === value);

									return (
										<button
											type="button"
											title={label}
											aria-checked={isSelected()}
											onClick={() => setColor(value)}
											class="grid h-12 w-12 place-items-center rounded-full text-3xl"
											style={{ background: bgColor, color: fgColor }}
										>
											{isSelected() && <CheckOutlinedIcon />}
										</button>
									);
								})}
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium text-contrast">Folder icon</span>

							<div class="grid grid-cols-3 gap-3">
								{iconOptions.map(({ value, label, component: Icon }) => {
									const isSelected = createMemo(() => icon() === value);

									return (
										<button
											type="button"
											title={label}
											aria-checked={isSelected()}
											onClick={() => setIcon(value)}
											class={
												`grid place-items-center rounded p-4 text-2xl hover:bg-contrast/sm active:bg-contrast/sm-pressed` +
												(isSelected() ? ` -my-px border-2 border-accent` : ` border border-outline`)
											}
										>
											<Icon />
										</button>
									);
								})}
							</div>
						</div>
					</Dialog.Body>
				</form>
			</Dialog.Container>
		</>
	);
};

export default BookmarkFolderFormDialog;
