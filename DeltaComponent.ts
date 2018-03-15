/// <reference path="./def/eventemitter3.d.ts" />
import EventEmitter from "eventemitter3";

/*
    This class is a component to extend for static pages. It retrieves the view at the route passed and renders it once
*/

export default abstract class DeltaComponent extends EventEmitter {
    private route: string;
    protected view: string;
    protected container: string; // location where content will be rendered

    public constructor(route: string, container?: string) {
        super()
        this.container = (container) ? container : "#root" // default to id root
        this.route = route;
    }

    // call after object construction to asynchronously get the view
    public async init(): Promise<void> {
        this.view = await $.ajax({
            url: this.route,
            method: "GET",
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            }
        });
    };

    // call in place of $(document).ready, overwrite to add more actions
    public async load(): Promise<void> {
        this.render();
    }

    // default rendering for static pages
    protected render(): void {
        $(this.container).html(this.view);
    }
}
