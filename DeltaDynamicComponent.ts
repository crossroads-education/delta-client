import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

/*
    This class is a dynamic component to extend for any portion of content containing variables that will change while remaining rendered. The type variable parameter will be an interface describing the ViewModel.
*/

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<Partial<P>>;
    public context: JQuery
    public props: Partial<P>; // contains view's active state

    public constructor(route: string, container: string, template?: HandlebarsTemplateDelegate) {
        super(route, container);
        this.props = {};
        // pass in template to request the view only once for components of the same type
        this.template = template;
    }

    // if template wasn't passed in, will retrieve and compile it now
    public async init(): Promise<void> {
        if (!this.template) {
            await super.init();
            this.template = Handlebars.compile(this.view);
        }
    }

    // pass in one or all of the state variables and render them
    public update(props: Partial<P>): void {
        // only update the variables passed in
        for (let key in props) this.props[key] = props[key];
        this.view = this.template(this.props);
        this.render();
    }

    // call instead of $(document).ready and load initial content
    public async load(props?: Partial<P>): Promise<void> {
        if(props) {
            this.update(props)
        };
    }

    // either append content to its container or swap out the changed element's values
    public render(): void {
        if(this.context && $(this.container).find(this.context).length) {
            let newView = $(this.view);
            for(let key in this.props) {
                let newElement = newView.find('[d-bind*="' + key + '"]');
                let oldElement = this.context.find('[d-bind*="' + key + '"]');
                oldElement.text(newElement.text());
                $.each(oldElement[0].attributes, function(index, attribute) {
                    if(newElement.attr(attribute.name)){
                        oldElement.attr(attribute.name, newElement.attr(attribute.name));
                    }
                });
            }
        } else {
            this.context = $(this.view);
            $(this.container).append(this.context);
        }

    }

    // retrieve template in order to construct multiple components
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
