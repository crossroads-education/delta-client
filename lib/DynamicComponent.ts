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
        if (props) {
            this.view = this.template(props);
            this.props =  props;
            this.context = $(this.view);
            $(this.container).append(this.context);
        } else {
            throw new Error("Missing properties, cannot update viewmodel variables");
        }


    }
    /* two-way data-binder, supports handlebars arrays, objects, and primitives
     *   Value: value of the property of the object you're currently iterating over, such as props[name], or an array of names, or an object name: {first: string, last: string}
     *   Container: containing parent element, begins at context, refines as object searching becomes more defined
     *   arrayIndex: if we're iterating over an array we must support passing the arrayIndex, arrays are updated one value at a time
     *   key: current key of property you're iterating over. will always be a string.
     */
    protected updateView(value: any, container: JQuery, arrayIndex?: number, key?: any): void {
        const boundProperty = '[d-bind*="' + key + '"]';
        if (value.constructor.name === "Array") {
            const parent = container.find(boundProperty).parent();
            if ((<any>this.props)[key].length === value.length) { // check if our new property is the same length as our parent
                value.forEach((val: any, index: number) => { // iterate over each value in array of values
                    // send current value in arrray, the parent dom element, index of array, and key value
                    this.updateView(val, parent, index, key);
                });
                return;
            }
            // if our value is not equal length we have to do some checks
            const elements = container.find(boundProperty); // find all current elements with that key as a bound property
            if ((<any>this.props)[key].length > value.length) { // size of array has shrunk from current size, must remove extra elements and change current ones
                for (let i = (<any>this.props)[key].length; i < value.length; i++) {
                    // remove extra elements from DOM
                    elements.eq(i).remove();
                }
            }
            for (let i = 0; i < value.length; i++) { // iterate through new values
                if (i < (<any>this.props)[key].length) { // check if we're a new element, because we're out of bounds of our current props
                    this.updateView(value[arrayIndex], parent, arrayIndex, key); // if not we update with the array index
                } else {
                    // if we are a new element we pull it from the new rendered DOM and append it to the containing element
                    let newElement = $(this.view).find(boundProperty);
                    if (!newElement.length) newElement = $(this.view).closest(boundProperty);
                    container.append(newElement);
                }
            }
            return;
        }
        if (value.constructor.name === "Object") { // property of view model is an object
            let parentElement = container.find(boundProperty); // find containing element
            if (parentElement.length > 1 || parentElement.length === 0) { // if theres more than one then we assume that we have an array index, i.e. an array of objects.
                parentElement = container;
            }
            for (const childKey in value) {
                this.updateView(value[childKey], parentElement, arrayIndex, childKey); // iterate through keys of object, arrayIndex will be null if we're not an array of objects
            }
            return;
        }
        // finally replacing property values, have refined down to primitive type (bool, number, string, etc)
        if (container.length === 0) return;
        let element = container.find(boundProperty);
        let newElement = $(this.view).find(boundProperty);
        if (newElement.length === 0) {
            newElement = $(this.view).closest(boundProperty); // assume the the same with the newElement. we're at top level.
            element = container;
        }
        if (arrayIndex) { // if we're an array of objects, we use the dom rendered element to find which node to replace
            element = element.eq(arrayIndex);
            newElement = newElement.eq(arrayIndex);
        }
        const elementContent: Node = element[0].childNodes[0]; // get text content
        if (elementContent && elementContent.nodeValue) elementContent.nodeValue = newElement[0].childNodes[0].nodeValue; // if we have text, replace the text
        $.each(element[0].attributes, (index, attribute) => { // replace all attributes of the element with the new properties, if they exist as a dom rendered property
            if (attribute.name === "data-" + key) {
                $(element).attr("data-" + key, value);
            }
        });
    }

    public getProps(): Partial<P> {
        return this.props;
    }

    // retrieve template in parent to pass into one or multiple components
    public static async getTemplate(url: string): Promise<HandlebarsTemplateDelegate> {
        return Handlebars.compile(await Component.getView(url));
    }
}
