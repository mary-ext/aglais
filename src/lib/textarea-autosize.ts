// Based off Andarist's react-textarea-autosize, licensed under MIT License
// Commit reference: 5953e024310ab0b6ad1c26b2bc36addb9cc23afa

import { createRenderEffect, onCleanup, onMount } from 'solid-js';

import { createEventListener } from './hooks/event-listener';
import { useResizeObserver } from './hooks/resize-observer';

// src/getSizingData.ts#L4
const SIZING_STYLES = [
	'borderBottomWidth',
	'borderLeftWidth',
	'borderRightWidth',
	'borderTopWidth',
	'boxSizing',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
	'paddingTop',
	// non-standard
	'tabSize',
	'textIndent',
	// non-standard
	'textRendering',
	'textTransform',
	'width',
	'wordBreak',
];

// src/forceHiddenStyles.ts#L1
// !important doesn't seem too important
const hiddenStyles = {
	minHeight: '0',
	maxHeight: 'none',
	height: '0',
	visibility: 'hidden',
	overflow: 'hidden',
	position: 'absolute',
	top: '0',
	right: '0',
	zIndex: '-1000',
};

export interface AutosizeOptions {
	minRows?: number;
	maxRows?: number;
}

const noop = () => {};

export const useTextareaAutosize = (
	node: HTMLTextAreaElement,
	value: (() => string | undefined) | undefined,
	{ maxRows, minRows }: AutosizeOptions = {},
) => {
	onMount(() => {
		let resync: (value: string) => void = noop;

		// src/calculateNodeHeight.ts#L30
		const mimic = document.createElement('textarea');
		mimic.tabIndex = -1;
		mimic.ariaHidden = 'true';

		// src/calculateNodeHeight.ts#L37
		document.body.appendChild(mimic);
		onCleanup(() => mimic.remove());

		useResizeObserver(node, () => {
			const style = window.getComputedStyle(node);

			// src/calculateNodeHeight.ts#L43
			for (const prop of SIZING_STYLES) {
				// @ts-expect-error
				mimic.style[prop] = style[prop];
			}

			// src/calculateNodeHeight.ts#L48
			Object.assign(mimic.style, hiddenStyles);

			const paddingSize = parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
			const borderSize = parseFloat(style.borderBottomWidth) + parseFloat(style.borderTopWidth);

			const isBorderBox = style.boxSizing === 'border-box';
			const padSize = isBorderBox ? borderSize : -paddingSize;

			if (maxRows !== undefined || minRows !== undefined) {
				// src/calculateNodeHeight.ts#L56
				mimic.value = 'x';

				const rowHeight = mimic.scrollHeight - paddingSize;

				// src/calculateNodeHeight.ts#L60
				if (minRows !== undefined) {
					let minHeight = rowHeight * minRows;
					if (isBorderBox) {
						minHeight = minHeight + paddingSize + borderSize;
					}

					node.style.minHeight = minHeight + 'px';
				}

				// src/calculateNodeHeight.ts#66
				if (maxRows !== undefined) {
					let maxHeight = rowHeight * maxRows;
					if (isBorderBox) {
						maxHeight = maxHeight + paddingSize + borderSize;
					}

					node.style.maxHeight = maxHeight + 'px';
				}
			}

			resync = (value) => {
				// src/calculateNodeHeight.ts#L50
				mimic.value = value;
				node.style.height = mimic.scrollHeight + padSize + 'px';
			};

			// It's fine.
			resync(node.value);
		});

		if (value) {
			createRenderEffect(() => {
				resync(value() ?? '');
			});
		} else {
			createEventListener(node, 'input', () => {
				resync(node.value);
			});
		}
	});
};
