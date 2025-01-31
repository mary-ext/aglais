import { unique } from '@mary/array-fns';

export const systemLanguages = unique(navigator.languages.map((lang) => lang.split('-')[0]));

export const primarySystemLanguage = systemLanguages[0];
