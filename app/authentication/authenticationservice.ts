
import ConfigService from "../services/config.service";

export default class AuthenticationService {

    static $inject = ['localStorageService', '$http', 'ConfigService', '$rootScope', '$location'];

    tokenHeader:{};

    constructor(private localStorageService: any,
                private $http: ng.IHttpService,
                private ConfigService: ConfigService,
                private $rootScope: ng.IRootScopeService,
                private $location: ng.ILocationService) {
        $rootScope.$on("$routeChangeStart", (event: any, next: any) => {
            if (next.$$route.authenticated) {
                var userAuth = this.getToken();
                if (!userAuth) {
                    console.log('token not found, forward to login');
                    $location.path('/login');
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
        this.localStorageService.clearAll();
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
        return this.localStorageService.get('auth-token');
    };

    setAuthToken(val: string) {
        this.localStorageService.set('auth-token', val);
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

