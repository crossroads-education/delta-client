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
        this.view = this.template(props);
        for (const key in props) {
            this.updateView(props[key], this.context, undefined, key);
            this.props[key] = props[key];
        }
         // only update what changed
    }

    // call instead of $(document).ready and load initial content
    public async load(props?: Partial<P>): Promise<void> {
        this.render(props);
    }

    // render the component's view
    protected render(props?: Partial<P>): void {
        // if the component is already rendered, only update what changed
        /*
        if (this.context && $(this.container).find(this.context).length) {
            const newView = $(this.view);
            for (const key in this.props) {


            }
        } else {
            // render content normally and set context to reference its own location
            this.context = $(this.view);
            $(this.container).append(this.context);
        }
        */
        if (props) {
            this.view = this.template(this.props);
            this.props =  props;
            this.context = $(this.view);
            $(this.container).append(this.context);
        } else {
            throw new Error("Missing properties, cannot update viewmodel variables");
        }

    }

    protected updateView(value: any, container: JQuery, index?: number, key?: any): void {
        if (value.constructor.name === "Array") {
            if ((<any>this.props[key]).length !== value.length) {
                const elements = container.find('[d-bind*="' + key + '"]');
                const newElements = $(this.view).find('[d-bind*="' + key + '"]');
                newElements.each((index, newElement) => {
                    if (index < ((<any>this.props[key]).length)) {
                        this.updateView(value[index], $(elements).eq(index).parent(), index, key);
                    } else {
                        container.append(newElement);
                    }
                });

                if (elements.length > newElements.length) {
                    for (let i = newElements.length; i < elements.length; i++) {
                        elements.eq(i).remove();
                    }
                }
            } else {
                value.forEach((val: any, index: number) => {
                    this.updateView(val, container.find('[d-bind*="' + key + '"]').parent(), index, key);
                });
            }
        } else if (value.constructor.name === "Object") {
            $(container).find('[d-bind*="' + key + '"]').each((index, element) => {
                for (const childKey in value) {
                    this.updateView(value[childKey], $(element), undefined, childKey);
                }

            });

        } else {
            if (container.length > 0) {
                let oldElements = container.find('[d-bind*="' + key + '"]');
                if (oldElements.length === 0) {
                    oldElements = container.closest('[d-bind*="' + key + '"]');
                }
                if (oldElements.length !== 0) {
                    oldElements.each((index, element) => {
                        const elementContent: Node = element.childNodes[0];
                        if (elementContent && elementContent.nodeValue) elementContent.nodeValue = value;
                        $.each(element.attributes, (index, attribute) => {
                            if (attribute.name === key) {
                                $(element).attr(key, value);
                            }
                        });
                    });
                }
            }
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
