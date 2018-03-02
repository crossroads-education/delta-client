import DeltaComponent from "./DeltaComponent";
import Handlebars from "handlebars";

export abstract class DeltaDynamicComponent extends DeltaComponent {
    // Check the type of a compiled handlebars template
    template: any;

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
