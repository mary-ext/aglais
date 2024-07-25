import { Suspense, lazy, type Accessor, type Component, type ComponentProps } from 'solid-js';

import type { AppBskyNotificationGetUnreadCount } from '@mary/bluesky-client/lexicons';
import type { CreateQueryResult } from '@mary/solid-query';

import { createNotificationCountQuery } from './api/queries/notification-count';

import { globalEvents } from './globals/events';
import { hasModals } from './globals/modals';
import { history } from './globals/navigation';

import { RouterView, useMatchedRoute, type MatchedRouteState } from './lib/navigation/router';
import { useSession } from './lib/states/session';

import BellOutlinedIcon from './components/icons-central/bell-outline';
import BellSolidIcon from './components/icons-central/bell-solid';
import HashtagOutlinedIcon from './components/icons-central/hashtag-outline';
import HomeOutlinedIcon from './components/icons-central/home-outline';
import HomeSolidIcon from './components/icons-central/home-solid';
import MagnifyingGlassOutlinedIcon from './components/icons-central/magnifying-glass-outline';
import MailOutlinedIcon from './components/icons-central/mail-outline';
import MailSolidIcon from './components/icons-central/mail-solid';

const SignedOutView = lazy(() => import('./views/_signed-out'));

const Shell = () => {
	const { currentAccount } = useSession();

	// Will always match because we've set a 404 handler.
	const route = useMatchedRoute() as Accessor<MatchedRouteState>;
	const unread = createNotificationCountQuery();

	return (
		<div
			inert={hasModals()}
			class="relative z-0 mx-auto flex min-h-[100dvh] max-w-md flex-col-reverse border-outline sm:border-x"
		>
			{!!(currentAccount && route().def.meta?.main) && <NavBar route={route} unread={unread} />}

			<div class="z-0 flex min-h-0 grow flex-col overflow-clip">
				<RouterView
					render={({ def }) => {
						return (
							<Suspense
								children={(() => {
									if (!currentAccount && !def.meta?.public) {
										return <SignedOutView />;
									}

									return <def.component />;
								})()}
							/>
						);
					}}
				/>
			</div>
		</div>
	);
};

export default Shell;

const enum MainTabs {
	HOME = 'Home',
	SEARCH = 'Search',
	NOTIFICATIONS = 'Notifications',
	MESSAGES = 'Messages',
	FEEDS = 'Feeds',
}

const MainTabsRoutes = {
	[MainTabs.HOME]: '/',
	[MainTabs.SEARCH]: '/search',
	[MainTabs.NOTIFICATIONS]: '/notifications',
	[MainTabs.MESSAGES]: '/messages',
	[MainTabs.FEEDS]: '/feeds',
};

const NavBar = ({
	route,
	unread,
}: {
	route: Accessor<MatchedRouteState>;
	unread: CreateQueryResult<AppBskyNotificationGetUnreadCount.Output>;
}) => {
	const active = () => route().def.meta?.name;

	const bindClick = (to: MainTabs) => {
		return () => {
			const from = active();

			if (from === to) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				globalEvents.emit('softreset');
				return;
			}

			const fromHome = !!(history.location.state as any)?.fromHome;
			const href = MainTabsRoutes[to];

			if (to === MainTabs.HOME && fromHome) {
				history.back();
				return;
			}

			history.navigate(href, {
				replace: from !== MainTabs.HOME,
				state: {
					// inherit `fromHome` state
					fromHome: fromHome || from === MainTabs.HOME,
				},
			});
		};
	};

	return (
		<>
			<div class="sticky bottom-0 z-1 flex h-13 w-full max-w-md shrink-0 items-stretch border-t border-outline bg-background">
				<NavItem
					label="Home"
					active={active() === MainTabs.HOME}
					onClick={bindClick(MainTabs.HOME)}
					icon={HomeOutlinedIcon}
					iconActive={HomeSolidIcon}
				/>
				<NavItem
					label="Search"
					active={active() === MainTabs.SEARCH}
					onClick={bindClick(MainTabs.SEARCH)}
					icon={MagnifyingGlassOutlinedIcon}
				/>
				<NavItem
					label="Notifications"
					badge={getUnreadCountLabel(unread.data?.count)}
					active={active() === MainTabs.NOTIFICATIONS}
					onClick={bindClick(MainTabs.NOTIFICATIONS)}
					icon={BellOutlinedIcon}
					iconActive={BellSolidIcon}
				/>
				<NavItem
					label="Direct Messages"
					active={active() === MainTabs.MESSAGES}
					onClick={bindClick(MainTabs.MESSAGES)}
					icon={MailOutlinedIcon}
					iconActive={MailSolidIcon}
				/>
				<NavItem
					label="Feeds"
					active={active() === MainTabs.FEEDS}
					onClick={bindClick(MainTabs.FEEDS)}
					icon={HashtagOutlinedIcon}
				/>
			</div>
		</>
	);
};

const getUnreadCountLabel = (count: number = 0) => {
	return count > 0 ? (count > 30 ? `${count}+` : `${count}`) : ``;
};

type IconComponent = Component<ComponentProps<'svg'>>;

interface NavItemProps {
	active?: boolean;
	label: string;
	badge?: string;
	icon: IconComponent;
	iconActive?: IconComponent;
	onClick?: () => void;
}

const NavItem = (props: NavItemProps) => {
	const InactiveIcon = props.icon;
	const ActiveIcon = props.iconActive;

	return (
		<button title={props.label} onClick={props.onClick} class="relative grid grow basis-0 place-items-center">
			{(() => {
				const active = props.active;

				const Icon = active && ActiveIcon ? ActiveIcon : InactiveIcon;
				return <Icon class={`text-2xl` + (active && !ActiveIcon ? ` stroke-contrast *:stroke-[3]` : ``)} />;
			})()}

			{props.badge && (
				<div class="absolute -mr-4 -mt-4 flex items-center justify-center rounded-md bg-accent px-1 py-px text-xs font-bold">
					{props.badge}
				</div>
			)}
		</button>
	);
};
