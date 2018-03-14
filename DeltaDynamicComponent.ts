import DeltaComponent from "./DeltaComponent.js";
import Handlebars from "handlebars";

/*
    This class is a dynamic component to extend for any portion of content containing variables that will change while remaining rendered. The type variable parameter will be an interface describing the ViewModel.
*/

export default abstract class DeltaDynamicComponent<P> extends DeltaComponent {
    private template: HandlebarsTemplateDelegate<Partial<P>>;
    private props: Partial<P>; // component's active state
    public context: JQuery; // self-referential location of rendered content

    // optionally pass in temlate to avoid requesting it each time for multiple components of the same type
    public constructor(route: string, container: string, template?: HandlebarsTemplateDelegate) {
        super(route, container);
        this.props = {};
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
        for (let key in props) this.props[key] = props[key]; // only update what changed
        this.view = this.template(this.props);
        this.render();
    }

    // call instead of $(document).ready and load initial content
    public async load(props?: Partial<P>): Promise<void> {
        if(props) this.update(props);
    }

    // render the component's view
    protected render(): void {
        // if the component is already rendered, only update what changed
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
            // render content normally and set context to reference its own location
            this.context = $(this.view);
            $(this.container).append(this.context);
        }
    }

    public getProps(): Partial<P> {
        return this.props;
    }

    // retrieve template in parent to pass into one or multiple components
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
