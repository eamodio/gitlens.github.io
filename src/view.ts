'use strict';
/*global document*/
import { DOM } from './dom';

export class View {
	private classes: string[];
	private observer: IntersectionObserver | undefined;

	private activeVersion: string | undefined = '11.3.0';
	private versions = new Map<string, boolean>();

	constructor(public name: string) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const me = this;

		DOM.on(`[data-action="${this.name}"]`, 'click', this.onButtonClicked.bind(this));

		DOM.on(
			`[data-view="${this.name}"] [data-action="scrollTo"]`,
			'click',
			function (this: HTMLElement, e: MouseEvent) {
				me.onScrollToClicked(this, e);
			}
		);
		DOM.on(
			`[data-view="${this.name}"] [data-action="showVersion"]`,
			'click',
			function (this: HTMLElement, e: MouseEvent) {
				me.onShowVersionClicked(this, e);
			}
		);

		const $el = DOM.$<HTMLDivElement>(`.section[data-view="${this.name}"]`)[0];

		this.classes = ['is-section', `is-section--${this.name}`];

		const classes = $el.dataset.classes;
		if (classes != null) {
			this.classes.push(...classes.split(' '));
		}

		this.observer = new IntersectionObserver(this.onObserver.bind(this), {
			rootMargin: '0px 0px 0px 0px',
		});

		for (const el of document.querySelectorAll('.changelog__list>.changelog__list-item--version[id]')) {
			this.versions.set(el.id, false);

			this.observer.observe(el);
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

	private onObserver(entries: IntersectionObserverEntry[], _observer: IntersectionObserver) {
		for (const entry of entries) {
			this.versions.set(entry.target.id, entry.isIntersecting);
		}

		let nextActive: string | undefined;
		for (const [id, visible] of this.versions.entries()) {
			if (visible) {
				nextActive = id;

				break;
			}
		}

		if (nextActive === undefined) {
			if (entries.length !== 1) return;

			const entry = entries[0];
			if (entry.boundingClientRect == null || entry.rootBounds == null) return;

			nextActive = entry.target.id;
			if (entry.boundingClientRect.top >= entry.rootBounds.bottom) {
				const keys = [...this.versions.keys()];
				const index = keys.indexOf(nextActive);
				if (index <= 0) return;

				nextActive = keys[index - 1];
			}
		}

		if (this.activeVersion === nextActive) {
			this.toggleVersionLink(this.activeVersion, true);
			return;
		}

		if (this.activeVersion !== undefined) {
			this.toggleVersionLink(this.activeVersion, false);
		}

		this.activeVersion = nextActive;
		this.toggleVersionLink(this.activeVersion, true);
	}

	private onScrollToClicked($el: HTMLElement, e: MouseEvent) {
		const scrollTo = $el.dataset.scrollTo!;
		const $scrollTo = document.getElementById(scrollTo)!;
		const $section = $scrollTo.closest<HTMLDivElement>('section[id]')!;

		const offset =
			DOM.$(`[data-target="patches"][data-version="${$section.dataset.version!}"]`)[0].getBoundingClientRect()
				.height + 8;

		const scrollerTop = $section.getBoundingClientRect().top;
		const elementTop = $scrollTo.getBoundingClientRect().top;
		const top = elementTop - scrollerTop - offset;

		$section.parentElement!.scrollTo({
			top: top,
			behavior: 'smooth',
		});
	}

	private onShowVersionClicked($el: HTMLElement, e: MouseEvent) {
		const $view = DOM.$<HTMLDivElement>(`[data-view="${this.name}"]`)[0];
		$view.dataset.version = $el.dataset.version;
	}

	private toggleVersionLink(version: string, active: boolean) {
		const el = document.querySelector(`a[data-action="scrollTo"][data-scroll-to="${version}"]`);
		if (el != null) {
			el.classList.toggle('active', active);
		}
	}
}
