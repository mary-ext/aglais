import { createMemo, createSignal } from 'solid-js';

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
	{ icon: 'gaming', label: `Gaming` },
	{ icon: 'music', label: `Music` },
	{ icon: 'shopping', label: `Shopping` },
	{ icon: 'sports', label: `Sports` },
];

const CreateFolderDialog = () => {
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

	const [color, setColor] = createSignal<string>();
	const [icon, setIcon] = createSignal<string>();

	return (
		<>
			<Dialog.Backdrop />
			<Dialog.Container fullHeight>
				<form class="contents">
					<Dialog.Header>
						<Dialog.HeaderAccessory>
							<Dialog.Close />
						</Dialog.HeaderAccessory>

						<Dialog.Heading title="Create a bookmark folder" />

						<Dialog.HeaderAccessory>
							<Button type="submit" disabled variant="primary">
								Save
							</Button>
						</Dialog.HeaderAccessory>
					</Dialog.Header>

					<Dialog.Body class="flex flex-col gap-6">
						<TextInput label="Folder name" />

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

export default CreateFolderDialog;
