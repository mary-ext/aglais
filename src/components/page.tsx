import type { ParentProps } from 'solid-js';

import { useProfileQuery } from '~/api/queries/profile';

import { openModal } from '~/globals/modals';

import { useAgent } from '~/lib/states/agent';
import { useSession } from '~/lib/states/session';

import Avatar from './avatar';
import IconButton from './icon-button';
import MenuOutlinedIcon from './icons-central/menu-outline';
import MainSidebarLazy from './main/main-sidebar';

export interface PageHeaderProps extends ParentProps {}

const PageHeader = (props: PageHeaderProps) => {
	return (
		<>
			<div class="sticky top-0 z-1 flex h-13 w-full max-w-md shrink-0 items-center justify-between gap-4 bg-c-contrast-0 px-2.5">
				{props.children}
			</div>
		</>
	);
};

export { PageHeader as Header };

export interface PageHeadingProps {
	title?: string;
	subtitle?: string;
}

const PageHeading = (props: PageHeadingProps) => {
	return (
		<div class="flex min-w-0 grow flex-col gap-0.5">
			<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
				{props.title}
			</p>
		</div>
	);
};

export { PageHeading as Heading };

export interface PageHeaderAccessoryProps extends ParentProps {}

const PageHeaderAccessory = (props: PageHeaderAccessoryProps) => {
	return <div class="flex shrink-0 gap-2 empty:hidden">{props.children}</div>;
};

export { PageHeaderAccessory as HeaderAccessory };

export interface PageMainMenuProps {}

const PageMainMenu = ({}: PageMainMenuProps) => {
	const { currentAccount } = useSession();
	const { persister } = useAgent();

	return (
		<IconButton
			title="Open main menu"
			icon={() => {
				if (currentAccount) {
					const profile = useProfileQuery(() => currentAccount.did, persister);
					return <Avatar type="user" src={profile.data?.avatar} size="sm" />;
				}

				return <MenuOutlinedIcon />;
			}}
			onClick={() => {
				openModal(() => <MainSidebarLazy />);
			}}
		/>
	);
};

export { PageMainMenu as MainMenu };
