import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<P>;

    public constructor(route: string, container: string, template?: HandlebarsTemplateDelegate) {
        super(route, container);
        if (template) {
            this.template = template;
        }
    }

    public async init(): Promise<void> {
        if (!this.template) {
            await super.init();
            this.template = Handlebars.compile(this.view);
        }
    }

    // each component will call this but also set its own variables
    public update(props: P): void {
        this.view = this.template(props);
    }

    public insertBefore(): void {
        $(this.container).prepend(this.view);
    }

    public insertAfter(): void {
        $(this.container).append(this.view);
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
}
