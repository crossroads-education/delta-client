import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<P>;
    public parent: string;
    public props: P;
    public constructor(route: string, container?: string | JQuery, template?: HandlebarsTemplateDelegate, parent?: string) {
        super(route);
        this.container = container;
        if (template) {
            this.template = template;
        }
        if(parent) {
            this.parent = parent;
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
        this.props = props;
        this.view = this.template(props);
        this.render();
    }

    public async load(props?: P): Promise<void> {
        this.update(props);
        if (this.parent) {
            this.container = $(this.view);
            $(this.parent).append(this.container);
        }
    }

    public render(): void {
        if(this.container) {
            let newView = $(this.view);
            for(let key in this.props) {
                let newElement = newView.find('[d-bind*="' + key + '"]');
                let oldElement = $(this.container).find('[d-bind*="' + key + '"]');
                oldElement.text(newElement.text());
                $.each(oldElement[0].attributes, function(index, attribute) {
                    if(newElement.attr(attribute.name)){
                        oldElement.attr(attribute.name, newElement.attr(attribute.name));
                    }
                });
            }
        } else {
            $(this.container).html(this.view);
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

    public getContext(): JQuery {
        return (typeof this.container === "string") ? $(this.container) : this.container;
    }
}
