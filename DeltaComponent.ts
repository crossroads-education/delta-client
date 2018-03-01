export abstract class DeltaComponent {
    // HTML with context implemented - ready to be inserted into the page
    view: string;

    render(): void {

    }

    // Call on page load in place of document ready
    load(): void {

    }

    // Call when leaving page
    unload(): void {

    }
}

export default DeltaComponent;
