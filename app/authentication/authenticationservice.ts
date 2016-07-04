
import ConfigService from "../services/ConfigService";

export default class AuthenticationService {

    static $inject = ['localStorageService', '$http', 'ConfigService'];

    tokenHeader:{};

    constructor(private localStorageService: any,
                private $http: ng.IHttpService,
                private ConfigService: ConfigService) {}

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

    requestToken(method, username, password) {
        var string = username + ":" + password;
        var encodedString = btoa(string); //Convert it to base64 encoded string
        var urlString = URI(this.ConfigService.getAuthUrl()).path('tokens').toString();
        return this.$http({
            url: urlString,
            method: method,
            withCredentials: true,
            headers: {'Authorization': 'Basic ' + encodedString}
        });
    };

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

