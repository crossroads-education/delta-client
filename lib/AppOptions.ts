export default interface AppOptions {
    auth: {
        loginUrl: string;
        logoutUrl: string;
    };
    /** endpoint returning a list of the app's routes */
    routeSource: string;
}
