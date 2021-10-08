'use strict';
/*global window document*/
import { DOM } from './dom';
import { View } from './view';

export class App {
	activeView = '';

	readonly views: View[];

	private _sectionCompleteHandle = 0;

	constructor() {
		this.views = [];
		for (const $el of DOM.$<HTMLInputElement>('.section[data-view]')) {
			const view = $el.dataset.view;
			if (view == null) continue;

			this.views.push(new View(view));
		}

		DOM.on('[data-action="back"]', 'click', this.onBackButtonClicked.bind(this));
		DOM.on('.changelog__image', 'click', function (this: HTMLImageElement) {
			this.classList.toggle('expand', !this.classList.contains('expand'));
		});
		window.addEventListener('hashchange', this.onHashChanged.bind(this), false);

		const [hash, paths] = this.getHashAndPaths();
		this.switchView(hash, paths, true);
	}

	switchView(hash: string, paths: string[], loading = false): void {
		window.clearTimeout(this._sectionCompleteHandle);
		this._sectionCompleteHandle = 0;

		const previous = this.activeView;

		switch (hash) {
			case '': {
				this.activeView = '';

				if (previous !== this.activeView) {
					const prev = this.views.find((v) => v.name === previous);
					if (prev != null) {
						prev.deactivate();
					}
				}

				document.body.classList.toggle('complete', loading);
				if (!loading) {
					document.location.hash = '';
				}

				break;
			}
			default: {
				const view = this.views.find((v) => v.name === hash);
				if (view == null) {
					this.switchView('', [], false);
					return;
				}

				this.activeView = hash;

				if (previous !== this.activeView) {
					const prev = this.views.find((v) => v.name === previous);
					if (prev != null) {
						prev.deactivate();
					}
				}

				view.activate(paths, loading);

				document.body.classList.toggle('complete', loading);
				if (!loading) {
					this._sectionCompleteHandle = window.setTimeout(
						() => document.body.classList.add('complete'),
						1000
					);
				}

				break;
			}
		}

		if (loading) {
			setTimeout(() => document.body.classList.remove('preload'), 1);
		}
	}

	private onBackButtonClicked(e: MouseEvent) {
		document.location.hash = '';
	}

	private onHashChanged(e: Event) {
		const [hash, paths] = this.getHashAndPaths();

		if (this.redirect(hash, paths)) return;

		this.switchView(hash, paths);
	}

	private getHashAndPaths(): [string, string[]] {
		let hash = document.location.hash?.substring(1);
		let paths: string[] = [];
		if (hash) {
			[hash, ...paths] = hash.split('/');
		}

		return [hash, paths];
	}

	private redirect(hash: string, paths: string[]): boolean {
		if (hash === 'support-gitlens' || hash === 'sponsor') {
			document.location.hash = '#';
			return true;
		}

		return false;
	}
}
