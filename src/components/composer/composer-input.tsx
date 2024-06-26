import TextareaAutosize from 'solid-textarea-autosize';
import { type PreliminaryRichText } from '~/api/richtext/parser/parse';

export interface ComposerInputProps {
	ref?: (el: HTMLTextAreaElement) => void;

	value: string;
	rt: PreliminaryRichText;
	onChange: (next: string) => void;

	minRows?: number;
	placeholder?: string;
}

const ComposerInput = (props: ComposerInputProps) => {
	const onChange = props.onChange;

	return (
		<div class="group relative z-0 text-base">
			<div
				inert
				innerHTML={buildHtml(props.rt)}
				class={`absolute inset-0 z-0 whitespace-pre-wrap break-words` + ` pb-2 pr-4 pt-1`}
			></div>

			<TextareaAutosize
				ref={(node) => {
					props.ref?.(node);
				}}
				value={props.value}
				placeholder={props.placeholder}
				minRows={props.minRows}
				class={
					`relative z-10 block w-full resize-none overflow-hidden bg-transparent text-transparent caret-contrast outline-none placeholder:text-contrast-muted` +
					` pb-2 pr-4 pt-1`
				}
				onInput={(ev) => {
					onChange(ev.target.value);
				}}
			/>
		</div>
	);
};

export default ComposerInput;

const escape = (str: string, attr: boolean) => {
	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || (attr ? char === 34 : char === 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	return escaped + str.substring(last);
};

const buildHtml = (rt: PreliminaryRichText) => {
	const segments = rt.segments;

	let str = '';

	for (let i = 0, ilen = segments.length; i < ilen; i++) {
		const segment = segments[i];

		const type = segment.type;

		if (type === 'link' || type === 'mention' || type === 'tag') {
			str += `<span class=text-accent>` + escape(segment.raw, false) + `</span>`;
		} else if (type === 'escape') {
			str += `<span class=opacity-50>` + escape(segment.raw, false) + `</span>`;
		} else if (type === 'mdlink') {
			const className = segment.valid ? `text-accent` : `text-error`;
			const [_0, label, _1, uri, _2] = segment.raw;

			str +=
				`<span class=opacity-50>${_0}</span>` +
				`<span class=${className}>${escape(label, false)}</span>` +
				`<span class=opacity-50>${_1}${escape(uri, false)}${_2}</span>`;
		} else {
			str += escape(segment.raw, false);
		}
	}

	return str;
};
