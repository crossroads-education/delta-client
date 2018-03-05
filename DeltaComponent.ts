export default abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    public view: string;
    private route: string;

    public constructor(route: string) {
        this.route = route;
    }

    protected render(container: JQuery): void {
        container.html(this.view);
    }
    // call after object construction
    public init(): Promise<void> {
        return this.getView();
    };

    // call on page load in place of document ready
    public async load(): Promise<void> {
        this.render($("#root"));
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
