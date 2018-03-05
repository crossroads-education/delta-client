import DeltaComponent from "./DeltaComponent.js";
import Navigo from "navigo";

// Make abstract if we want the module instance to include hard references to components
export default class DeltaApp {
    private components: {[route: string]: DeltaComponent};
    private current: DeltaComponent;
    private router: Navigo;
    private basePath: string;

    public constructor() {
        this.components = {};
        this.basePath = window.location.pathname;
        this.router = new Navigo("http://localhost:3000" + this.basePath, false);
        this.init();
    }

    public async init(): Promise<void> {
        // Retrieve list of routes and create a component instance for each
        const data: {routes: string[]} = await $.post("/delta/v1/getRoutes", { basePath: this.basePath });
        await Promise.all(
            data.routes.map(async route => {
                const def = await SystemJS.import("/js" + this.basePath + route + ".js");
                this.components[route] = new def.default(this.basePath + route);
                this.components[route].init();
            }));
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
            // _deltaPath is the server-set original path (redirected from)
            const originalPath = urlParams.get("_deltaPath");
            // remove _deltaPath so we can recreate the original query string
            urlParams.delete("_deltaPath");
            // recreate original query string with params if necessary
            const newPath = originalPath.substring(this.basePath.length) + (urlParams.toString() ? "?" + urlParams.toString() : "");
            // re-route to the correct path
            this.router.navigate(newPath, false);
        }

        this.components[route].load();
    }

}
