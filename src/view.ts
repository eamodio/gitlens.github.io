'use strict';
/*global document*/
import { DOM } from './dom';

export class View {
	private classes: string[];

	constructor(public name: string) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const me = this;

		DOM.on(`[data-action="${this.name}"]`, 'click', this.onButtonClicked.bind(this));
		DOM.on('[data-action="scrollTo"]', 'click', function (this: HTMLElement, e: MouseEvent) {
			me.onScrollToClicked(this, e);
		});
		DOM.on('[data-action="showVersion"]', 'click', function (this: HTMLElement, e: MouseEvent) {
			me.onShowVersionClicked(this, e);
		});

		const $el = DOM.$<HTMLDivElement>(`.section[data-view="${this.name}"]`)[0];

		this.classes = ['is-section', `is-section--${this.name}`];

		const classes = $el.dataset.classes;
		if (classes != null) {
			this.classes.push(...classes.split(' '));
		}
	}

	get hash(): string {
		return `#${this.name}`;
	}

	activate(paths?: string[], loading: boolean = false): void {
		// console.log(`View(${this.name}).activate`);
		document.body.classList.add(...this.classes);
	}

	deactivate(): void {
		// console.log(`View(${this.name}).deactivate`);
		document.body.classList.remove(...this.classes);
	}

	protected getHash(path?: string): string {
		return `${this.hash}${!path ? '' : `${path.startsWith('/') ? path : `/${path}`}`}`.toLowerCase();
	}

	protected matchesPath(path?: string): boolean {
		return document.location.hash?.toLowerCase() === this.getHash(path);
	}

	protected setPath(path?: string): void {
		document.location.hash = this.getHash(path);
	}

	private onButtonClicked(e: MouseEvent) {
		if (document.location.hash?.startsWith(this.hash)) {
			document.location.hash = '';
		} else {
			this.setPath();
		}
	}

	private onScrollToClicked($el: HTMLElement, e: MouseEvent) {
		const scrollTo = $el.dataset.scrollTo!;
		const $scrollTo = document.getElementById(scrollTo)!;
		$scrollTo.scrollIntoView({ behavior: 'smooth' });
	}

	private onShowVersionClicked($el: HTMLElement, e: MouseEvent) {
		const $view = DOM.$<HTMLDivElement>(`.section[data-view="${this.name}"]`)[0];
		$view.dataset.version = $el.dataset.version;
	}
}
