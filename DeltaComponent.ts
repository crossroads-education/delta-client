export default abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    protected view: string;
    private route: string;

    public constructor(route: string) {
        this.route = route;
    }

    private render(container: JQuery): void {
        container.html(this.view);
    }
    // call after object construction
    public init(): Promise<void> {
        return this.getView();
    };

    // call on page load in place of document ready
    public abstract load(): Promise<void>;

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
