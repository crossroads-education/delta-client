export abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    view: string;
    route: string;
    container: string; // jquery identifier

    constructor(route: string) {
        this.route;
    }

    render(): void {
        $(this.container).html(this.view);
    }
    // call after object construction
    abstract async init(container: string): Promise<void>;

    // call on page load in place of document ready
    abstract async load(): Promise<void>;

    protected async getView(): Promise<void> {
        await $.ajax({
            url: this.route,
            method: "GET",
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            },
            success: (view) => {
                this.view = view;
            }
        });
    }
}

export default DeltaComponent;
