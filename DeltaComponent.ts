/// <reference path="./def/eventemitter3.d.ts" />
import EventEmitter from "eventemitter3";
export default abstract class DeltaComponent extends EventEmitter {
    // HTML with context implemented - re1ady to be inserted into the pag
    public view: string;
    private route: string;
    protected container: string | JQuery = "#root";
    public constructor(route: string) {
        super()
        this.route = route;
    }

    // call after object construction
    public async init(): Promise<void> {
        return this.getView();
    };

    // call on page load in place of document ready
    public async load(): Promise<void> {
        this.render(); // default rendering
    }

    public render(): void {
        $(this.container).html(this.view);
    }

    protected async getView(): Promise<void> {
        this.view = await $.ajax({
            url: this.route,
            method: "GET",
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            }
        });
    }
}
