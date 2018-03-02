export abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    view: string;
    container: HTMLElement;

    constructor(route: string) {
        $.get({
            url: route,
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            },
            success: (html) => this.view = html
        });
    }

    render(): void {
        $(this.container).html(this.view);
    }

    // Call on page load in place of document ready
    load(): void {

    }

    // Call when leaving page
    unload(): void {

    }

    async getView(path: string): Promise<void> {
        await $.ajax({
            url: path,
            method: "GET",
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            },
            success: view => this.view = view
        });
    }
}

export default DeltaComponent;
