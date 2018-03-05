import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<P>;

    public constructor(route: string, container: string) {
        super(route);
        this.template = Handlebars.compile(this.view);
    }

    // should be overwritten most times, but provide default functionality
    public update(props: P): void {
        this.view = this.template(props);
    }
}
