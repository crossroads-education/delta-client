import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<P>;
    public constructor(route: string, template?: HandlebarsTemplateDelegate) {
        super(route);
        this.template = template;
    }


    public render(container: JQuery): void {
        container.html(this.view);
    }

    public async load(): Promise<void> {
        if(!this.template){
            await this.getView();
            this.template = Handlebars.compile(this.view);
        }
    }

    public static async getTemplate(route: string): Promise<HandlebarsTemplateDelegate> {
        const view: string = await $.ajax({
            url: route,
            method: "GET",
            beforeSend: xhr => {
                xhr.setRequestHeader("x-eta-delta-component", "true");
            }
        });
        return Handlebars.compile(view);
    }

    // should be overwritten most times, but provide default functionality
    public update(props: P): void {
        this.view = this.template(props);
    }
}
