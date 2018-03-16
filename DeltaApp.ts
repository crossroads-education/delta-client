import DeltaComponent from "./DeltaComponent.js";
import Navigo from "navigo";

/**
 * This class creates a page component for each route in the application and initializes it and all its children.
 */
export default class DeltaApp {
    private components: {[route: string]: DeltaComponent} = {}; // default assign so we can push to it
    private router: Navigo;
    private basePath: string; // path that prefixes all components
    private routeSource: string; // endpoint returning a list of the app's routes

    public constructor(routeSource?: string) {
        this.basePath = window.location.pathname;
        this.router = new Navigo();
        // if no route source is provided, use default endpoint in eta-web-delta module
        this.routeSource = routeSource || "/delta/v1/routes";
    }

    public async init(): Promise<void> {
        // retrieve list of routes that begin with that base path
        const data: {routes: string[]} = await $.get(this.routeSource, { basePath: this.basePath });
        // create and initialize component at each route
        await Promise.all(
            data.routes.map(async route => {
                this.components[route] = new (await SystemJS.import("/js" + this.basePath + route + ".js")).default(this.basePath + route);
                await this.components[route].init();
            }));
        // universal route handler that loads content for each component

        for (const route in this.components) {
            this.router.on(route, async (params, query) => {
                await this.components[route].load();
                this.router.updatePageLinks();
            });
        }
        // handle initial server-side redirection
        const urlParams = new URLSearchParams(window.location.search);
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
        this.router.resolve();
    }
}
