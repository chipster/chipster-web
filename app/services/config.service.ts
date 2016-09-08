
import * as configConstants from '../app.constants';
import ConfigurationResource from "../resources/configurationresource";

class Services {
    sessionDb: string;
    sessionDbEvents: string;
    authenticationService: string;
    fileBroker: string;
    toolbox: string;
}

export default class ConfigService {

    static $inject = ['$location', 'ConfigurationResource'];

    public services: Services;
    public config: any;
    public baseUrl: string;
    private queryPromise: Promise<any>;

    constructor(private $location: ng.ILocationService, private configurationResource: ConfigurationResource){
        this.config = {};
        this.config.modules = configConstants.ChipsterModules;

        this.init();
    }

    init() {
        this.queryPromise = <Promise<any>>this.configurationResource.getConfigurationResource();
    }

    getServices() {
        return this.queryPromise.then((response: any) => {
            let services = new Services();

            if (!this.services) {
                angular.forEach(response, (item: any) => {
                    let camelCaseRole = item.role.replace(/-([a-z])/g, (m: string, w: string) => w.toUpperCase());
                    services[camelCaseRole] = item.publicUri;
                });
                this.services = services;
                this.baseUrl = this.services.sessionDb;
                console.log('sessionDb', this.services.sessionDb);
            }
            return this.services;
        });
    }

    getApiUrl() {
        return this.baseUrl;
    }

    getSessionDbUrl() {
        return this.getServices().then((services: Services) => services.sessionDb);
    }

    getSessionDbEventsUrl(sessionId:string) {
        return this.getServices().then((services: Services) => URI(services.sessionDbEvents).path('events/' + sessionId).toString());
    }

    getAuthUrl() {
        return this.getServices().then((services: Services) => services.authenticationService);
    }

    getFileBrokerUrl() {
        return this.getServices().then((services: Services) => services.fileBroker);
    }

    getFileBrokerUrlIfInitialized() {
        return this.services.fileBroker;
    }

    getToolboxUrl() {
        return this.getServices().then((services: Services) => services.toolbox);
    }

    getModules() {
        return this.config.modules;
    }
}

