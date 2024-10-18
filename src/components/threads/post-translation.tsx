import { Match, Switch, createMemo, createSignal } from 'solid-js';

import { XRPC, simpleFetchHandler } from '@atcute/client';
import { createQuery } from '@mary/solid-query';

import { systemLanguages } from '~/globals/locales';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import { getEnglishLanguageName } from '~/lib/intl/languages';
import { useSession } from '~/lib/states/session';
import { pickRandom } from '~/lib/utils/misc';

import CircularProgressView from '~/components/circular-progress-view';

export interface PostTranslationProps {
	text: string;
}

const matchLanguage = (tag: string, ranges: string[]) => {
	return ranges.find((code) => code === tag || code.startsWith(tag + '-'));
};

const PostTranslation = (props: PostTranslationProps) => {
	const { currentAccount } = useSession();

	const [source, _setSource] = createSignal('auto');
	const [target, _setTarget] = createDerivedSignal(() => {
		return currentAccount?.preferences.translation.to ?? 'system';
	});

	const instanceUrl = createMemo((previous?: string) => {
		const instances = currentAccount?.preferences.translation.instances;
		if (!instances || instances.length === 0) {
			return;
		}
		if (previous && instances.includes(previous)) {
			return previous;
		}

		return pickRandom(instances);
	});

	const query = createQuery(() => {
		const $source = source();
		const $target = target();

		const $instanceUrl = instanceUrl();
		const $text = props.text;

		return {
			enabled: !!$instanceUrl,
			queryKey: ['basa-translate', $source, $target, $instanceUrl, $text],
			async queryFn() {
				let targetLang = $target;
				if (targetLang === 'system') {
					const { googleLanguages } = await import('~/api/basa/languages');

					let found: string | undefined;
					found ??= systemLanguages.find((code) => matchLanguage(code, googleLanguages));
					found ??= matchLanguage('en', googleLanguages);

					if (!found) {
						throw new Error(`Unable to match system language`);
					}

					targetLang = found;
				}

				console.log(targetLang);

				const rpc = new XRPC({ handler: simpleFetchHandler({ service: $instanceUrl! }) });
				const { data } = await rpc.get('x.basa.translate', {
					params: {
						engine: 'google',
						text: $text,
						from: $source,
						to: targetLang,
					},
				});

				return data;
			},
		};
	});

	return (
		<div class="mt-3">
			<Switch>
				<Match when={query.data} keyed>
					{({ result, sourceLanguage }) => {
						return (
							<>
								<p class="text-sm text-contrast-muted">
									{sourceLanguage
										? `Translated from ${getEnglishLanguageName(sourceLanguage) ?? sourceLanguage} (detected)`
										: `Translated text`}
								</p>
								<p class="whitespace-pre-wrap break-words text-base">{result}</p>
							</>
						);
					}}
				</Match>

				<Match when>
					<CircularProgressView />
				</Match>
			</Switch>
		</div>
	);
};

export default PostTranslation;
