
import {ServiceLocator} from "../../app.constants";
import AuthenticationService from "../../authentication/authenticationservice";

export default class LoginController {

    static $inject = ['$location', '$http', 'AuthenticationService'];

    error: string;

    constructor(private $location: ng.ILocationService,
                private $http: ng.IHttpService,
                private authenticationService: AuthenticationService) {}

    login(username: string, password: string) {
        this.authenticationService.login(username, password).then( () => {
            //Route to Session creation page
            this.$location.path("/sessions");
        }, (error: any) => {
            console.log('login failed', error);
            if (error) {
                this.error = error.status === 403 ? 'Incorrect username or password.' : error.data;
            } else {
                this.error = 'Could not connect to the server ' + ServiceLocator;
            }
        });
    }

}