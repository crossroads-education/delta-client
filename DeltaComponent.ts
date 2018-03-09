export default abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    public view: string;
    private route: string;
    protected container: string;

    public constructor(route: string, container?: string) {
        this.route = route;
        this.container = (container) ? container : "#root";
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
