'use strict';

export namespace DOM {
    export function listenAll(selector: string, name: string, listener: EventListenerOrEventListenerObject) {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
            el.addEventListener(name, listener, false);
        }
    }
}
