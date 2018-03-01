import DeltaComponent from "./DeltaComponent.js";
import Navigo from "navigo";
import "jquery";
import "node";

// Make abstract if we want the module instance to include hard references to components
export class DeltaApp {
    private components: {[route: string]: DeltaComponent };
    private current: DeltaComponent;

    public async initRoutes(): Promise<void> {
        const basePath = window.location.pathname;
        const router = new Navigo("http://localhost:3000" + basePath, false);

        // Retrieve list of routes and create a component instance for each
        await $.post("/delta/v1/getRoutes", { basePath }, data => {
            for(const route in data.routes) {
                // Figure out if it needs the last parentheses to create an object or not
                this.components[route] = require(route).default()();
            }
        });

        // Router to handle base page
        router.on("/", () => {
            router.navigate("/index", false);
        });
        // Universal router: for each route passed, render that page's content
        for (const c in this.components) {
            router.on(c, (p, x) => {
                delete this.current;
                this.current = this.components[c];
                this.current.load();
            });
        }
    }
}

export default DeltaApp;
