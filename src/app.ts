'use strict';
import { DOM } from './dom';
// import { MainView } from './mainView';
import { View } from './view';

const sectionRegex = /^is-section\S*/;

export class App {
    activeView: string = '';

    // readonly main: MainView;
    readonly views: View[];

    private _sectionCompleteTimer: NodeJS.Timer | undefined;

    constructor() {
        // this.main = new MainView();

        this.views = [];
        for (const el of document.querySelectorAll<HTMLInputElement>('.section[data-view]')) {
            const view = el.dataset.view;
            if (view === undefined) continue;

            new View(view);
        }

        DOM.listenAll('.js-button__back', 'click', this.onBackButtonClicked.bind(this));
        window.addEventListener('hashchange', this.onHashChanged.bind(this), false);

        this.switchView(document.location!.hash && document.location!.hash.substring(1), true);

        setTimeout(() => {
            document.body.classList.remove('preload');
        }, 750); // Wait for the length of the fade-out animation
    }

    switchView(view: string, loading: boolean = false) {
        // const previous = this.activeView;

        if (this._sectionCompleteTimer !== undefined) {
            clearTimeout(this._sectionCompleteTimer);
            this._sectionCompleteTimer = undefined;
        }

        const classList = document.body.classList;
        switch (view) {
            case '':
                this.activeView = '';

                if (!loading) {
                    const classesToRemove = [];
                    for (const c of classList) {
                        if (c !== 'section-complete' && !c.match(sectionRegex)) continue;

                        classesToRemove.push(c);
                    }

                    classList.remove(...classesToRemove);
                    document.location!.hash = '';
                }

                // this.main.activate(previous);

                break;

            default:
                this.activeView = view;

                // this.main.deactivate(view);

                const sectionClass = `is-section--${view}`;
                if (classList.contains(sectionClass)) {
                    classList.remove('is-section', 'section-complete', sectionClass);
                    document.location!.hash = '';

                    return;
                }

                if (classList.contains('is-section')) {
                    const classesToRemove = [];
                    for (const c of classList) {
                        if (!c.match(sectionRegex)) continue;

                        classesToRemove.push(c);
                    }

                    classList.remove(...classesToRemove);
                }

                classList.add('is-section', sectionClass);
                document.location!.hash = view;

                this._sectionCompleteTimer = setTimeout(() => classList.add('section-complete'), 1000);

                break;
        }
    }

    private onBackButtonClicked(e: MouseEvent) {
        document.location!.hash = '';
    }

    private onHashChanged(e: HashChangeEvent) {
        this.switchView(document.location!.hash && document.location!.hash.substring(1));
    }
}
