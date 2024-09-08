import { type ParentProps, createContext, createMemo, useContext } from 'solid-js';

export interface FieldsetContext {
	readonly disabled: boolean;
}

const DEFAULT_FIELDSET: FieldsetContext = {
	disabled: false,
};

const Context = createContext<FieldsetContext>(DEFAULT_FIELDSET);

export const useFieldset = (): FieldsetContext => {
	return useContext(Context);
};

export interface FieldsetProps extends ParentProps {
	standalone?: boolean;
	disabled?: boolean;
}

export const Fieldset = (props: FieldsetProps) => {
	let context: FieldsetContext;

	if (!('disabled' in props) && props.standalone) {
		context = DEFAULT_FIELDSET;
	} else {
		const parent = useFieldset();

		const isDisabled = createMemo((): boolean => {
			return (!props.standalone && parent.disabled) || !!props.disabled;
		});

		context = {
			get disabled() {
				return isDisabled();
			},
		};
	}

	return <Context.Provider value={context}>{props.children}</Context.Provider>;
};
