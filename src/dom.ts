'use strict';
/*global document*/

export namespace DOM {
    export function listenAll<K extends keyof WindowEventMap>(
        selector: string,
        name: K,
        listener: (this: Element, ev: WindowEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
            el.addEventListener(name, listener, false);
        }
    }
}
