'use strict';
/*global document*/

export interface Disposable {
	dispose: () => void;
}

export namespace DOM {
	export function on<K extends keyof DocumentEventMap>(
		selector: string,
		name: K,
		listener: (this: Element, ev: DocumentEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions,
		el?: Element
	): Disposable;
	export function on<K extends keyof DocumentEventMap>(
		el: Document | Element,
		name: K,
		listener: (this: Element, ev: DocumentEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions
	): Disposable;
	export function on<K extends keyof DocumentEventMap>(
		selectorOrElement: string | Document | Element,
		name: K,
		listener: (this: Element, ev: DocumentEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions,
		el?: Element
	): Disposable {
		let disposed = false;

		if (typeof selectorOrElement === 'string') {
			const $els = (el ?? document).querySelectorAll(selectorOrElement);
			for (const $el of $els) {
				$el.addEventListener(name, listener as EventListener, options ?? false);
			}

			return {
				dispose: () => {
					if (disposed) return;
					disposed = true;

					for (const $el of $els) {
						$el.removeEventListener(name, listener as EventListener, options ?? false);
					}
				}
			};
		}

		selectorOrElement.addEventListener(name, listener as EventListener, options ?? false);
		return {
			dispose: () => {
				if (disposed) return;
				disposed = true;

				selectorOrElement.removeEventListener(name, listener as EventListener, options ?? false);
			}
		};
	}

	export function $<T extends Element>(selector: string): NodeListOf<T> {
		return document.querySelectorAll<T>(selector);
	}
}

export namespace Storage {
	export function clear(): void {
		localStorage.clear();
	}

	export function get<T>(key: string): T | undefined {
		const value = localStorage.getItem(key);
		if (value == null) return undefined;

		return JSON.parse(value) as T;
	}

	export function remove(key: string): void {
		localStorage.removeItem(key);
	}

	export function set<T>(key: string, value: T): void {
		localStorage.setItem(key, JSON.stringify(value));
	}
}
