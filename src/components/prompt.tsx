import type { JSX } from 'solid-js';

import { useModalContext } from '~/globals/modals';

import { useMediaQuery } from '~/lib/hooks/media-query';
import { useModalClose } from '~/lib/hooks/modal-close';
import { on } from '~/lib/utils/misc';

import Button from './button';
import { Backdrop } from './dialog';
import { Fieldset } from './fieldset';

export interface PromptContainerProps {
	disabled?: boolean;
	maxWidth?: 'sm' | 'md';
	children: JSX.Element;
}

const PromptContainer = (props: PromptContainerProps) => {
	const { close, isActive } = useModalContext();
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');

	const isDisabled = () => !!props.disabled;

	const containerRef = (node: HTMLElement): void => {
		useModalClose(node, close, () => isActive() && !isDisabled());
	};

	return on(isDesktop, ($isDesktop) => {
		if ($isDesktop) {
			return (
				<Fieldset standalone disabled={isDisabled()}>
					<Backdrop />
					<div
						ref={containerRef}
						class="a-dialog-desktop z-1 my-auto flex flex-col overflow-y-auto rounded-xl bg-background p-6"
						style={{ width: getPromptDesktopWidth(props) }}
					>
						{props.children}
					</div>
				</Fieldset>
			);
		} else {
			return (
				<Fieldset standalone disabled={isDisabled()}>
					<div class="flex grow flex-col self-stretch overflow-y-auto bg-contrast-overlay/40">
						<div class="h-[40dvh] shrink-0"></div>
						<div ref={containerRef} role="menu" class="mt-auto flex flex-col rounded-t-xl bg-background p-4">
							{props.children}
						</div>
					</div>
				</Fieldset>
			);
		}
	}) as unknown as JSX.Element;
};

const getPromptDesktopWidth = ({ maxWidth = 'sm' }: PromptContainerProps) => {
	if (maxWidth === 'sm') {
		return `320px`;
	} else if (maxWidth === 'md') {
		return `414px`;
	}
};

export { PromptContainer as Container };

export interface PromptTitleProps {
	children: JSX.Element;
}

const PromptTitle = (props: PromptTitleProps) => {
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');
	return (
		<h1 class={`mb-1 break-words font-bold` + (!isDesktop() ? ` text-base` : ` text-xl`)}>
			{props.children}
		</h1>
	);
};

export { PromptTitle as Title };

export interface PromptDescriptionProps {
	children: JSX.Element;
}

const PromptDescription = (props: PromptDescriptionProps) => {
	return <p class="text-pretty text-sm text-contrast-muted">{props.children}</p>;
};

export { PromptDescription as Description };

export interface PromptActionsProps {
	children: JSX.Element;
}

const PromptActions = (props: PromptActionsProps) => {
	const isDesktop = useMediaQuery('(width >= 688px) and (height >= 500px)');
	return <div class={`flex flex-col gap-3` + (!isDesktop() ? ` mt-5` : ` mt-6`)}>{props.children}</div>;
};

export { PromptActions as Actions };

export interface PromptActionProps {
	variant?: 'outline' | 'primary' | 'danger';
	noClose?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	children: JSX.Element;
}

const PromptAction = (props: PromptActionProps) => {
	const { close } = useModalContext();

	const noClose = props.noClose;
	const onClick = props.onClick;
	const handleClick = !noClose ? (onClick ? () => (close(), onClick()) : close) : onClick;

	return (
		<Button disabled={props.disabled} onClick={handleClick} variant={props.variant} size="lg">
			{props.children}
		</Button>
	);
};

export { PromptAction as Action };

export interface PromptConfirmProps {
	title: JSX.Element;
	description: JSX.Element;
	onConfirm?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	noCancel?: boolean;
	danger?: boolean;
}

const PromptConfirm = (props: PromptConfirmProps) => {
	return (
		<PromptContainer>
			<PromptTitle>{props.title}</PromptTitle>
			<PromptDescription>{props.description}</PromptDescription>

			<PromptActions>
				<PromptAction variant={!props.danger ? `primary` : `danger`} onClick={props.onConfirm}>
					{props.confirmLabel ?? `Confirm`}
				</PromptAction>

				{!props.noCancel && <PromptAction>{props.cancelLabel ?? `Cancel`}</PromptAction>}
			</PromptActions>
		</PromptContainer>
	);
};

export { PromptConfirm as Confirm };
