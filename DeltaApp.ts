import DeltaComponent from "./DeltaComponent.js";
import Navigo from "navigo";

// Make abstract if we want the module instance to include hard references to components
export class DeltaApp {
    private components: {[route: string]: DeltaComponent};
    private current: DeltaComponent;
    private router: Navigo;
    private basePath: string;

    constructor() {
        this.init();
    }

    public async init(): Promise<void> {
        this.components = {};
        this.basePath = window.location.pathname;
        this.router = new Navigo("http://localhost:3000" + this.basePath, false);
        // Retrieve list of routes and create a component instance for each
        await $.post("/delta/v1/getRoutes", { basePath: this.basePath }, (data: {routes: string[]}) => {
            Promise.all([
                data.routes.map(route => {
                    SystemJS.import("/js" + this.basePath + route + ".js").then((def) => {
                        console.log(this.basePath + route);
                        this.components[route] = new def.default(this.basePath + route);
                        this.components[route].init("#root");
                        console.log(this.components[route].view);
                    });
                })
            ]);
        });
        // Router to handle base page
        this.router.on("/", () => {
            this.loadPage("/index");
        });
        // Universal router: for each route passed, render that page's content
        for (const route in this.components) {
            this.router.on(route, (params, query) => {
                this.loadPage(route);
            });
        }
    }

    private loadPage(route: string) {
        const urlParams = new URLSearchParams(window.location.search);
        // handle server redirection
        if (urlParams.has("_deltaPath")) {
            // _spaPath is the server-set original path (redirected from)
            const originalPath = urlParams.get("_deltaPath");
            // remove _spaPath so we can recreate the original query string
            urlParams.delete("_deltaPath");
            // recreate original query string with params if necessary
            const newPath = originalPath.substring(this.basePath.length) + (urlParams.toString() ? "?" + urlParams.toString() : "");
            // re-route to the correct path
            this.router.navigate(newPath, false);
        }
    }

}

export default DeltaApp;
