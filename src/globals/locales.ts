import { uniq } from '~/lib/utils/misc';

export const systemLanguages = uniq(navigator.languages.map((lang) => lang.split('-')[0]));

export const primarySystemLanguage = systemLanguages[0];
