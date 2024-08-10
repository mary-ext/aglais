import type { AppBskyLabelerDefs } from '@mary/bluesky-client/lexicons';

import { mapDefined } from '~/lib/misc';

import {
	BlurContent,
	BlurMedia,
	BlurNone,
	FlagsAdultOnly,
	FlagsNone,
	FlagsNoSelf,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
	SeverityAlert,
	SeverityInform,
	SeverityNone,
	type LabelBlur,
	type LabelDefinitionMapping,
	type LabelPreference,
	type LabelSeverity,
	type ModerationLabeler,
} from '.';

export const interpretLabelerDefinition = (
	service: AppBskyLabelerDefs.LabelerViewDetailed,
): ModerationLabeler => {
	const creator = service.creator;
	const policies = service.policies;

	const values = policies.labelValues;

	const supported = new Set(values);
	const defs: LabelDefinitionMapping = {};

	const indexedAt = new Date(service.indexedAt ?? NaN).getTime();

	// Sort the definitions as per labelValues
	for (const def of policies.labelValueDefinitions || []) {
		const id = def.identifier;

		// - Skip system label
		// - Skip if it's not even on labelValues
		if (id[0] === '!' || !supported.has(id)) {
			continue;
		}

		defs[id] = {
			i: id,
			d: convertPreferenceValue(def.defaultSetting),
			b: convertBlurValue(def.blurs),
			s: convertSeverityValue(def.severity),
			f: (def.adultOnly ? FlagsAdultOnly : FlagsNone) | FlagsNoSelf,
			l: mapDefined(def.locales, (locale) => {
				try {
					// Normalize locale codes
					const parsed = new Intl.Locale(locale.lang);

					return {
						i: parsed.baseName,
						n: locale.name,
						d: locale.description,
					};
				} catch {}
			}),
		};
	}

	return {
		did: creator.did,
		profile: {
			handle: creator.handle,
			avatar: creator.avatar,
			displayName: creator.displayName,
			description: creator.description,
		},
		provides: values,
		definitions: defs,
		indexedAt: !Number.isNaN(indexedAt) ? indexedAt : undefined,
	};
};

const convertPreferenceValue = (value: string | undefined): LabelPreference => {
	if (value === 'hide') {
		return PreferenceHide;
	}

	if (value === 'warn') {
		return PreferenceWarn;
	}

	return PreferenceIgnore;
};

const convertBlurValue = (value: string | undefined): LabelBlur => {
	if (value === 'content') {
		return BlurContent;
	}

	if (value === 'media') {
		return BlurMedia;
	}

	return BlurNone;
};

const convertSeverityValue = (value: string | undefined): LabelSeverity => {
	if (value === 'alert') {
		return SeverityAlert;
	}

	if (value === 'inform') {
		return SeverityInform;
	}

	return SeverityNone;
};
