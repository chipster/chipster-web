import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {Component, ViewChild} from "@angular/core";
import {FormGroup } from '@angular/forms';
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
            if (error && error.status === 403) {
                this.error = 'Incorrect username or password'
            } else {
              throw error;
            }
        });
    }
}

