import Component from "./Component.js";
import Handlebars from "handlebars";

/*
    This class is a dynamic component to extend for any portion of content containing variables that will change while remaining rendered. The type variable parameter will be an interface describing the ViewModel.
*/

export default abstract class DynamicComponent<P> extends Component {
    private template: HandlebarsTemplateDelegate<Partial<P>>;
    private props: Partial<P>; // component's active state
    public context: JQuery; // self-referential location of rendered content

    public constructor(route: string, container: string|JQuery) {
        super(route, container);
        this.props = {};
    }

    // if template wasn't passed in, will retrieve and compile it now
    public async init(template?: HandlebarsTemplateDelegate<Partial<P>>): Promise<void> {
        if (!template) {
            await super.init();
            this.template = Handlebars.compile(this.view);
        } else {
            this.template = template;
        }
    }

    // pass in one or all of the state variables and render them
    public update(props: Partial<P>): void {
        for (const key in props) this.props[key] = props[key]; // only update what changed
        this.view = this.template(this.props);
        this.render();
    }

    // call instead of $(document).ready and load initial content
    public async load(props?: Partial<P>): Promise<void> {
        if (props) {
            this.update(props);
        } else {
            this.render();
            throw new Error("Missing properties, cannot update viewmodel variables");
        }
    }

    // render the component's view
    protected render(): void {
        // if the component is already rendered, only update what changed
        if (this.context && $(this.container).find(this.context).length) {
            const newView = $(this.view);
            for (const key in this.props) {
                let newElement = newView.find('[d-bind*="' + key + '"]');
                let oldElement = (this.context.find('[d-bind*="' + key + '"]'));
                if (oldElement.length === 0) {
                    oldElement = this.context.closest('[d-bind*="' + key + '"]');
                    newElement = newView.closest('[d-bind*="' + key + '"]');
                }
                if (oldElement[0]) {
                    if (oldElement[0].childNodes[0]) oldElement[0].childNodes[0].nodeValue = newElement[0].childNodes[0].nodeValue;
                    $.each(oldElement[0].attributes, (index, attribute) => {
                        if (newElement.attr(attribute.name)) {
                            oldElement.attr(attribute.name, newElement.attr(attribute.name));
                        }
                    });
                }

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
    public static async getTemplate(url: string): Promise<HandlebarsTemplateDelegate> {
        return Handlebars.compile(await Component.getView(url));
    }
}
