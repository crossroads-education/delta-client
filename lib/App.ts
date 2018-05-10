import _ from "lodash";
import Navigo from "navigo";
import AppOptions from "./AppOptions.js";
import Component from "./Component.js";

/**
 * This class creates a page component for each route in the application and initializes it and all its children.
 */
export default class App {
    private isAuthorized = false; // whether the base page was loaded with ?isAuthorized
    private pages: {[route: string]: Component} = {}; // default assign so we can push to it
    private router: Navigo;
    private basePath: string; // path that prefixes all components
    public readonly options: AppOptions;

    public constructor(options?: AppOptions) {
        this.options = _.defaultsDeep(options, {
            auth: {
                loginUrl: "/login",
                logoutUrl: "/logout"
            },
            routeSource: "/delta/v1/routes"
        } as AppOptions);
        this.basePath = window.location.pathname;
        this.router = new Navigo();
        this.isAuthorized = window.location.search.includes("isAuthorized");
    }

    public async init(): Promise<void> {
        // retrieve list of routes that begin with that base path
        const data: {routes: string[]} = await $.get(this.options.routeSource, { basePath: this.basePath });
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
            this.router.on(route, async (params, query) => {
                if (this.pages[route].requiresAuth && !this.isAuthorized) {
                    // for example, redirects browser to /login?redirectTo=/foo/bar?isAuthorized=✓
                    // the login page should then redirect back to /foo/bar?isAuthorized=✓
                    const urlParams = new URLSearchParams();
                    // preserve existing GET parameters
                    Object.keys(params || {}).forEach(k => urlParams.set(k, params[k]));
                    // we need this for when Delta is re-loaded
                    urlParams.set("isAuthorized", "✓");
                    const redirectUrl = this.basePath + route + encodeURIComponent("?" + urlParams.toString());
                    return window.location.replace(this.options.auth.loginUrl + "?redirectTo=" + redirectUrl);
                }
                await this.pages[route].load();
                this.router.updatePageLinks();
            });
        }
        // handle initial server-side redirection
        const urlParams = new URLSearchParams(window.location.search);
        /*
        Example use: you have an SPA based at /foo.
        If you visit /foo, this logic will not be run, and isn't necessary.
        If you visit /foo/bar, the server should redirect you to /foo?_deltaPath=/foo/bar, which will trigger this logic.
        This logic cleans up the querystring (removes _deltaPath and the optional isAuthorized),
            and navigates the SPA to the page in _deltaPath.
        */
        if (urlParams.has("_deltaPath")) {
            // _deltaPath is the server-set original path (redirected from)
            const originalPath = urlParams.get("_deltaPath");
            // remove _deltaPath so we can recreate the original query string
            urlParams.delete("_deltaPath");
            // we don't need isAuthorized to be displayed to the user
            urlParams.delete("isAuthorized");
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
