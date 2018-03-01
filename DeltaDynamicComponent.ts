import DeltaComponent from "./DeltaComponent";

export abstract class DeltaDynamicComponent extends DeltaComponent {
    // Check the type of a compiled handlebars template
    template: any;
    container: HTMLElement;

    update(url: string): void {

    }

    // Figure out how to overload this for real
    // update(object: {[key:string]: any}) {
    //
    // }

    compileTemplate() {

    }
}

export default DeltaDynamicComponent;
