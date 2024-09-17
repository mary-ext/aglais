export class DisposableStack {
	#disposed = false;
	#disposables: Disposable[] = [];

	get disposed(): boolean {
		return this.#disposed;
	}

	[Symbol.dispose](): void {
		this.dispose();
	}

	dispose(): void {
		if (this.#disposed) {
			return;
		}

		const disposables = this.#disposables;
		const errors: unknown[] = [];

		this.#disposed = true;
		this.#disposables = [];

		for (let idx = disposables.length - 1; idx >= 0; idx--) {
			const disposable = disposables[idx];

			try {
				disposable[Symbol.dispose]();
			} catch (err) {
				errors.push(err);
			}
		}

		if (errors.length) {
		}
	}

	use<T extends Disposable>(disposable: T): T {
		if (this.#disposed) {
			throw new Error(`stack already disposed`);
		}

		this.#disposables.push(disposable);
		return disposable;
	}

	defer(dispose: () => void): void {
		if (this.#disposed) {
			throw new Error(`stack already disposed`);
		}

		this.#disposables.push({ [Symbol.dispose]: dispose });
	}

	adopt<T>(value: T, dispose: (value: T) => void): T {
		if (this.#disposed) {
			throw new Error(`stack already disposed`);
		}

		this.#disposables.push({ [Symbol.dispose]: () => dispose(value) });
		return value;
	}

	move(): DisposableStack {
		if (this.#disposed) {
			throw new Error(`stack already disposed`);
		}

		const stack = new DisposableStack();

		stack.#disposables = this.#disposables;

		this.#disposed = true;
		this.#disposables = [];

		return stack;
	}
}
