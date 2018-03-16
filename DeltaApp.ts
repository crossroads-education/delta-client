import DeltaComponent from "./DeltaComponent.js";
import Navigo from "navigo";

/**
 * This class creates a page component for each route in the application and initializes it and all its children.
 */
export default class DeltaApp {
    private pages: {[route: string]: DeltaComponent} = {}; // default assign so we can push to it
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
        const data: {routes: string[]} = await $.get(this.routeSource, { basePath: "/js" + this.basePath });
        // create and initialize component at each route
        await Promise.all(data.routes.map(async route => {
            try {
                this.pages[route] = new (await SystemJS.import("/js" + this.basePath + route + ".js")).default(this.basePath + route);
            } catch (err) {
                if (err.name === "TypeError" && err.message === "(intermediate value).default is not a constructor") {
                    throw new Error("Route component " + route + " does not have a default export!");
                } else throw err;
            }
            await this.pages[route].init();
        }));
        // universal route handler that loads content for each component
        for (const route in this.pages) {
            this.router.on(route, (params, query) => {
                // can't do async here because Navigo doesn't handle promises
                this.pages[route].load().then(() => {
                    this.router.updatePageLinks();
                }).catch(err => console.error(err));
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
        } else {
            this.router.navigate("index");
        }
        this.router.resolve();
    }
}
