import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

export abstract class DeltaDynamicComponent<P> extends DeltaComponent {

    constructor(route: string){
        super(route);
        this.template = Handlebars.compile(this.view);
    }

    template: HandlebarsTemplateDelegate<P>;

    update(props: P): void { //should be overwritten most times, but provide default functionality
        this.view = this.template(props);
        this.render();
    }
}

export default DeltaDynamicComponent;
