
import * as configConstants from '../app.constants';
import ConfigurationResource from "../resources/configurationresource";

export default class ConfigService {

    static $inject = ['$location', 'ConfigurationResource'];

    public services: any;
    public config: any;
    public baseUrl: string;

    constructor(private $location: ng.ILocationService, private configurationResource: ConfigurationResource){
        this.services = {};
        this.config = {};
        this.config.modules = configConstants.ChipsterModules;
    }

    init() {
        this.configurationResource.getConfigurationResource().query().$promise.then((response: any) => {
            response.forEach(( item: any ) => {
                let camelCaseRole = item.role.replace(/-([a-z])/g, (m: string, w: string) => w.toUpperCase() );
                this.services[camelCaseRole] = item.publicUri;
            });
            this.baseUrl = this.services.sessionDb;
            console.log('sessionDb', this.services.sessionDb);
        });
    };

    getApiUrl() {
        return this.baseUrl;
    };

    getSessionDbUrl() {
        if (this.services.sessionDb) {
            return this.services.sessionDb;
        }
        return this.baseUrl + 'sessiondb' + '/';
    };

    getSessionDbEventsUrl(sessionId:string) {

        if (this.services.sessionDbEvents) {
            return URI(this.services.sessionDbEvents).path('events/' + sessionId).toString();
        }

        // different api server
        var eventUrl = this.baseUrl
                .replace('http://', 'ws://')
                .replace('https://', 'wss://')
            + 'sessiondbevents/events/' + sessionId;

        // api and client served from the same host
        if (this.baseUrl === "") {
            eventUrl = "ws://" + this.$location.host() + ":" + this.$location.port()
                + "/sessiondbevents/events/" + sessionId;
        }

        return eventUrl;
    };

    getAuthUrl() {
        if (this.services.authenticationService) {
            return this.services.authenticationService;
        }
        return this.baseUrl + 'auth' + '/';
    };

    getFileBrokerUrl() {
        if (this.services.fileBroker) {
            return this.services.fileBroker;
        }
        return this.baseUrl + 'filebroker' + '/';
    };

    getToolboxUrl() {
        if (this.services.toolbox) {
            return this.services.toolbox;
        }
        return this.baseUrl + 'toolbox/';
    };

    getModules() {
        return this.config.modules;
    };
}

