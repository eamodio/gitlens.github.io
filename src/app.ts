'use strict';
import { DOM } from './dom';
// import { MainView } from './mainView';
import { View } from './view';

export class App {
    activeView: string = '';

    // readonly main: MainView;
    readonly views: View[];

    constructor() {
        // this.main = new MainView();

        this.views = [];
        for (const el of document.querySelectorAll<HTMLInputElement>('.section[data-view]')) {
            const view = el.dataset.view;
            if (view === undefined) continue;

            new View(view);
        }

        DOM.listenAll('.section__back-button', 'click', this.onBackButtonClicked.bind(this));
        window.addEventListener('hashchange', this.onHashChanged.bind(this), false);

        this.switchView(document.location!.hash && document.location!.hash.substring(1), true);

        setTimeout(() => {
            document.body.classList.remove('preload');
        }, 750); // Wait for the length of the fade-out animation
    }

    switchView(view: string, loading: boolean = false) {
        // const previous = this.activeView;

        const classList = document.body.classList;
        switch (view) {
            case '':
                this.activeView = '';

                if (!loading) {
                    classList.remove(
                        ...[...classList].filter(function(c) {
                            return c.match(/^is-section\S*/);
                        })
                    );
                    document.location!.hash = '';
                }

                // this.main.activate(previous);

                break;

            default:
                this.activeView = view;

                // this.main.deactivate(view);

                const sectionClass = `is-section--${view}`;
                if (classList.contains(sectionClass)) {
                    classList.remove('is-section', sectionClass);
                    document.location!.hash = '';

                    return;
                }

                if (classList.contains('is-section')) {
                    classList.remove(
                        ...[...classList].filter(function(c) {
                            return c.match(/^is-section--\S+/);
                        })
                    );
                }

                classList.add('is-section', sectionClass);
                document.location!.hash = view;

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
