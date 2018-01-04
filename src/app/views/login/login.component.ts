import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {Component, OnInit, ViewChild} from "@angular/core";
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from "@angular/router";
import {RestErrorService} from "../../core/errorhandler/rest-error.service";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'ch-login',
  templateUrl: './login.component.html',
  styleUrls: ["./login.component.less"]
})
export class LoginComponent implements OnInit {

  private error: string;
  private returnUrl: string;

  @ViewChild('myForm')
  private myForm: FormGroup;


  constructor(private router: Router,
              private route: ActivatedRoute,
              private authenticationService: AuthenticationService) {
  }


  ngOnInit() {
    // get the return url from the query params
    this.route.queryParams
      .subscribe(params => this.returnUrl = params['returnUrl'] || '/sessions');
    // TODO unsubscribe?
  }

  login(username: string, password: string) {
    this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe(() => {
      //Route to Session creation page
      console.log("login successful");
      this.router.navigateByUrl(this.returnUrl);
    }, (errorResponse: HttpErrorResponse) => {

      if (RestErrorService.isForbidden(errorResponse)) {
        this.error = 'Incorrect username or password'
      } else {
        this.error = 'Connecting to authentication service failed';
        console.error(errorResponse);
      }
    });
  }

  //Hack for the Enter key press for the button type="button"
  keyDownFunction(event) {
    if (event.keyCode == 13) {
      if (this.myForm.value.username && this.myForm.value.password) {
        this.login(this.myForm.value.username, this.myForm.value.password);
      } else if (!this.myForm.value.username && !this.myForm.value.password) {
        this.error = "Please Enter Username and Password to login";
      } else if (!this.myForm.value.username) {
        this.error = "Please Enter Username";
      } else if (!this.myForm.value.password) {
        this.error = "Please Enter Passsword";
      }

    }
  }
}

