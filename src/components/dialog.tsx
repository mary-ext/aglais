import { type ParentProps } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { useMediaQuery } from '~/lib/hooks/media-query';
import { useModalClose } from '~/lib/hooks/modal-close';

import { Fieldset } from './fieldset';
import IconButton from './icon-button';
import CrossLargeOutlinedIcon from './icons-central/cross-large-outline';

const DialogBackdrop = () => {
	return <div class="fixed inset-0 z-0 bg-contrast-overlay/40"></div>;
};

export { DialogBackdrop as Backdrop };

export interface DialogContainerProps extends ParentProps {
	fullHeight?: boolean;
	centered?: boolean;
	maxWidth?: 'sm' | 'md';
	disabled?: boolean;
	onClose?: () => void;
}

const DialogContainer = (props: DialogContainerProps) => {
	const { close, isActive } = useModalContext();

	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');
	const isDisabled = () => !!props.disabled;

	const containerRef = (node: HTMLElement): void => {
		useModalClose(node, props.onClose ?? close, () => isActive() && !isDisabled());
	};

	return (
		<Fieldset standalone disabled={isDisabled()}>
			<div
				ref={containerRef}
				role="dialog"
				class={containerClasses(isDesktop, props)}
				style={{ '--dialog-width': getMaxDialogWidth(props) }}
			>
				<div class="mx-auto flex h-full min-h-0 w-full max-w-[var(--dialog-width)] flex-col overflow-hidden">
					{props.children}
				</div>
			</div>
		</Fieldset>
	);
};

const getMaxDialogWidth = ({ maxWidth = 'md' }: DialogContainerProps) => {
	if (maxWidth === 'md') {
		return `600px`;
	} else if (maxWidth === 'sm') {
		return `446px`;
	}
};

const containerClasses = (isDesktop: () => boolean, props: DialogContainerProps): string => {
	var cn = `z-1 bg-background`;

	if (isDesktop()) {
		cn += ` a-dialog-desktop w-full max-w-[var(--dialog-width)] rounded-xl`;

		if (props.fullHeight) {
			cn += ` grow`;
		}

		if (props.centered) {
			cn += ` my-auto`;
		} else {
			cn += ` mt-11`;
		}
	} else {
		cn += ` h-full w-full grow`;
	}

	return cn;
};

export { DialogContainer as Container };

export interface DialogHeaderProps extends ParentProps {}

const DialogHeader = (props: DialogHeaderProps) => {
	return <div class="flex h-13 shrink-0 items-center justify-between gap-4 px-2.5">{props.children}</div>;
};

export { DialogHeader as Header };

export interface DialogHeadingProps {
	title?: string;
	subtitle?: string;
}

const DialogHeading = (props: DialogHeadingProps) => {
	return (
		<div class="flex min-w-0 grow flex-col gap-0.5">
			<p class="text-base font-bold empty:hidden">{props.title}</p>
		</div>
	);
};

export { DialogHeading as Heading };

export interface DialogHeaderAccessoryProps extends ParentProps {}

const DialogHeaderAccessory = (props: DialogHeaderAccessoryProps) => {
	return <div class="flex shrink-0 gap-2 empty:hidden">{props.children}</div>;
};

export { DialogHeaderAccessory as HeaderAccessory };

export interface DialogCloseProps {
	onClose?: () => void;
}

const DialogClose = (props: DialogCloseProps) => {
	const { close } = useModalContext();
	const onClose = props.onClose ?? close;

	return <IconButton title="Close dialog" icon={CrossLargeOutlinedIcon} onClick={onClose} />;
};

export { DialogClose as Close };

export interface DialogBodyProps extends ParentProps {
	unpadded?: boolean;
	class?: string;
}

const DialogBody = (props: DialogBodyProps) => {
	return (
		<div class={`grow overflow-y-auto` + (!props.unpadded ? ` p-4` : ``) + ` ` + (props.class ?? '')}>
			{props.children}
		</div>
	);
};

export { DialogBody as Body };

export interface DialogActionsProps extends ParentProps {}

const DialogActions = (props: DialogActionsProps) => {
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');

	return (
		<div
			class={
				`flex shrink-0 gap-4 px-4 py-5` + (isDesktop() ? ` items-center justify-end` : ` flex-col-reverse`)
			}
		>
			{props.children}
		</div>
	);
};

export { DialogActions as Actions };
