'use strict';
/*global window document*/
import { DOM } from './dom';
import { View } from './view';

const sectionRegex = /^is-section\S*/;

export class App {
    activeView = '';

    readonly views: View[];

    private _sectionCompleteTimer: NodeJS.Timer | undefined;

    constructor() {
        this.views = [];
        for (const el of document.querySelectorAll<HTMLInputElement>('.section[data-view]')) {
            const view = el.dataset.view;
            if (view === undefined) continue;

            this.views.push(new View(view));
        }

        DOM.listenAll('.js-button__back', 'click', this.onBackButtonClicked.bind(this));
        window.addEventListener('hashchange', this.onHashChanged.bind(this), false);

        this.switchView(document.location!.hash && document.location!.hash.substring(1), true);
    }

    switchView(view: string, loading = false) {
        if (this._sectionCompleteTimer !== undefined) {
            clearTimeout(this._sectionCompleteTimer);
            this._sectionCompleteTimer = undefined;
        }

        const classList = document.body.classList;
        switch (view) {
            case '': {
                this.activeView = '';

                if (!loading) {
                    const classesToRemove = [];
                    for (const c of classList) {
                        if (c !== 'complete' && !c.match(sectionRegex)) continue;

                        classesToRemove.push(c);
                    }

                    classList.remove(...classesToRemove);
                    document.location!.hash = '';
                }
                else {
                    classList.add('complete');
                }

                break;
            }
            default: {
                if (!this.views.some(v => v.name === view)) {
                    this.switchView('', false);
                    return;
                }

                this.activeView = view;

                const sectionClass = `is-section--${view}`;
                if (classList.contains(sectionClass)) {
                    classList.remove('is-section', 'complete', sectionClass);
                    document.location!.hash = '';

                    break;
                }

                if (classList.contains('is-section')) {
                    const classesToRemove = [];
                    for (const c of classList) {
                        if (!c.match(sectionRegex)) continue;

                        classesToRemove.push(c);
                    }

                    classList.remove(...classesToRemove);
                }
                else if (!loading && classList.contains('complete')) {
                    classList.remove('complete');
                }

                if (loading) {
                    classList.add('is-section', sectionClass, 'complete');
                }
                else {
                    classList.add('is-section', sectionClass);
                }
                document.location!.hash = view;

                if (!loading) {
                    this._sectionCompleteTimer = setTimeout(() => classList.add('complete'), 1000) as any;
                }

                break;
            }
        }

        if (loading) {
            setTimeout(() => document.body.classList.remove('preload'), 1);
        }
    }

    private onBackButtonClicked(e: MouseEvent) {
        document.location!.hash = '';
    }

    private onHashChanged(e: HashChangeEvent) {
        this.switchView(document.location!.hash && document.location!.hash.substring(1));
    }
}
