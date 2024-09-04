import { createContext, createSignal, useContext, type JSX } from 'solid-js';
import { assert } from '~/lib/utils/invariant';

type ModalRenderer = (context: ModalContext) => JSX.Element;

export interface ModalState {
	id: number;
	render: ModalRenderer;
}

const [modals, _setModals] = createSignal<ModalState[]>([]);
let _id = 0;

export const hasModals = (): boolean => {
	return modals().length !== 0;
};

export const openModal = (fn: ModalRenderer): number => {
	const id = _id++;

	_setModals(($modals) => $modals.concat({ id, render: fn }));
	return id;
};

export const closeModal = (id: number): void => {
	_setModals(($modals) => {
		const index = $modals.findIndex((v) => v.id === id);

		if (index === -1) {
			return $modals;
		}

		return $modals.toSpliced(index, 1);
	});
};

export const closeAllModals = (): void => {
	_setModals([]);
};

export interface ModalContext {
	id: number;
	/** Whether this dialog is currently the top-most dialog presented */
	isActive(): boolean;
	/** Close this dialog */
	close(): void;
}

const Context = createContext<ModalContext>();

export const useModalContext = (): ModalContext => {
	const context = useContext(Context);
	assert(context !== undefined, `Expected useModalContext to be used under a modal`);

	return context;
};

export { Context as INTERNAL_ModalContext, modals as INTERNAL_modals };
