import {ServiceLocator} from "../../core/app.constants";
import AuthenticationService from "../../core/authentication/authenticationservice";
import {Component, ViewChild} from "@angular/core";
import { FormGroup } from '@angular/forms';
import {Router} from "@angular/router";

@Component({
  selector: 'ch-login',
  templateUrl: './login.html'
})
export class LoginComponent {

    error: string;

    @ViewChild('myForm')
    private myForm: FormGroup;

    constructor(private router: Router, private authenticationService: AuthenticationService) {}


    login(username: string, password: string) {
        this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe( () => {
            //Route to Session creation page
          this.router.navigate(['/sessions']);
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

