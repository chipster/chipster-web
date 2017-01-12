
import ConfigService from "../../services/config.service";
import {Inject, Injectable} from "@angular/core";

@Injectable()
export default class AuthenticationService {

    tokenHeader:{};

    constructor(@Inject('$http') private $http: ng.IHttpService,
                private ConfigService: ConfigService,
                @Inject('$rootScope') private $rootScope: ng.IRootScopeService,
                @Inject('$location') private $location: ng.ILocationService) {

        this.$rootScope.$on("$routeChangeStart", (event: any, next: any) => {
            if (next.$$route.authenticated) {
                var userAuth = this.getToken();
                if (!userAuth) {
                    console.log('token not found, forward to login');
                    this.$location.path('/login');
                }
            }
        });
    }

    // Do the authentication here based on userid and password
    login(username:string, password:string) {
        // clear any old tokens
        this.setAuthToken(null);

        return this.requestToken('POST', username, password).then( (response: any) => {

            let token = response.data.tokenKey;
            this.setAuthToken(token);
        });
    };

    logout() {
        localStorage.clear();
    };

    getTokenHeader() {
        this.updateTokenHeader();
        return this.tokenHeader;
    };

    requestToken(method: string, username: string, password: string) {
        return this.ConfigService.getAuthUrl().then((authUrl) => {

            var urlString = URI(authUrl).path('tokens').toString();
            var string = username + ":" + password;
            var encodedString = btoa(string); //Convert it to base64 encoded string

            return this.$http({
                url: urlString,
                method: method,
                withCredentials: true,
                headers: {'Authorization': 'Basic ' + encodedString}
            });
        });
    }

    getToken() {
        return localStorage['ch-auth-token'];
    };

    setAuthToken(val: string) {
        localStorage['ch-auth-token'] = val;
        this.updateTokenHeader();
    };

    updateTokenHeader() {
        // return always the same instance so that we can update it later
        if (!this.tokenHeader) {
            this.tokenHeader = {};
        }
        this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken())
    };

}

