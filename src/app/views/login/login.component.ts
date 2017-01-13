import {ServiceLocator} from "../../core/app.constants";
import AuthenticationService from "../../core/authentication/authenticationservice";
import {Component, Inject, ViewChild} from "@angular/core";
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'ch-login',
    templateUrl: './login.html'
})
export class LoginComponent {

    error: string;

    @ViewChild('myForm')
    private myForm: FormGroup;

    constructor(@Inject('$location') private $location: ng.ILocationService, @Inject('AuthenticationService') private authenticationService: AuthenticationService) {}


    login(username: string, password: string) {
        this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe( () => {
            //Route to Session creation page
            this.$location.path('/sessions')
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

