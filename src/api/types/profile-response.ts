import type { AppBskyActorDefs } from '@atcute/client/lexicons';

export interface ProfilesListPage {
	cursor: string | undefined;
	profiles: AppBskyActorDefs.ProfileView[];
}

export interface ProfilesListWithSubjectPage {
	cursor: string | undefined;
	profiles: AppBskyActorDefs.ProfileView[];
	subject: AppBskyActorDefs.ProfileView;
}

type ProfileableProperties<T> = {
	[K in keyof T]: T[K] extends AppBskyActorDefs.ProfileView[] ? K : never;
}[keyof T];

type BarePage = { cursor?: string };
export const toProfilesListPage = <T extends BarePage>(
	page: T,
	key: ProfileableProperties<T>,
): ProfilesListPage => {
	return {
		cursor: page.cursor,
		profiles: page[key] as AppBskyActorDefs.ProfileView[],
	};
};

type BareWithSubjectPage = { cursor?: string; subject: AppBskyActorDefs.ProfileView };
export const toProfilesListWithSubjectPage = <T extends BareWithSubjectPage>(
	page: T,
	key: ProfileableProperties<T>,
): ProfilesListWithSubjectPage => {
	return {
		cursor: page.cursor,
		subject: page.subject,
		profiles: page[key] as AppBskyActorDefs.ProfileView[],
	};
};
