/** Ignore this label */
export const PreferenceIgnore = 1;
/** Warn when viewing content with this label present */
export const PreferenceWarn = 2;
/** Hide content if this label is present */
export const PreferenceHide = 3;

export type LabelPreference = 1 | 2 | 3;
export type KeywordPreference = 1 | 2 | 3;

/** Don't blur any parts of the content */
export const BlurNone = 0;
/** Only blur the media present in the content */
export const BlurMedia = 1;
/** Blur the entire content */
export const BlurContent = 2;
/** Special blur value, guaranteed blurring of profile and content */
export const BlurForced = 3;

export type LabelBlur = 0 | 1 | 2 | 3;

/** Don't inform the user */
export const SeverityNone = 0;
/** Lightly inform the user about this label's presence */
export const SeverityInform = 1;
/** Alert the user about this label's presence */
export const SeverityAlert = 2;

export type LabelSeverity = 0 | 1 | 2;

/** No flags are present */
export const FlagsNone = 0;
/** Don't allow blurred content to be expanded */
export const FlagsForced = 1 << 0;
/** Don't apply label to self */
export const FlagsNoSelf = 1 << 1;
/** Label is adult-only. */
export const FlagsAdultOnly = 1 << 2;

/** Label is intended for content */
export const TargetContent = 0;
/** Label is intended for profile itself */
export const TargetProfile = 1;
/** Label is intended for the whole account */
export const TargetAccount = 2;

export type LabelTarget = 0 | 1 | 2;

/** Concerns viewing a post in full */
export const ContextContentView = 0;
/** Concerns the media of a post */
export const ContextContentMedia = 1;
/** Concerns post feed */
export const ContextContentList = 2;
/** Concerns viewing a profile in full */
export const ContextProfileView = 3;
/** Concerns avatar and banner of a profile */
export const ContextProfileMedia = 4;
/** Concerns profile listing (follows, liked by, reposted by, etc...) */
export const ContextProfileList = 5;

export type ModerationContext = 0 | 1 | 2 | 3 | 4 | 5;
