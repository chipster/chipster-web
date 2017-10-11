import {AuthenticationService} from "../../core/authentication/authenticationservice";
import {Component, ViewChild} from "@angular/core";
import {FormGroup} from '@angular/forms';
import {Router} from "@angular/router";

@Component({
  selector: 'ch-login',
  templateUrl: './login.html'
})
export class LoginComponent {

  error: string;

  @ViewChild('myForm')
  private myForm: FormGroup;

  constructor(private router: Router, private authenticationService: AuthenticationService) {
  }


  login(username: string, password: string) {
    this.authenticationService.login(this.myForm.value.username, this.myForm.value.password).subscribe(() => {
      //Route to Session creation page
      this.router.navigate(['/sessions']);
    }, (error: any) => {
      console.log(error);
      //this.authenticationService.logout();
      if (error && error.status === 403) {
        this.error = 'Incorrect username or password'
      } else {
        throw error;
      }
    });
  }

  //Hack for the Enter key press for the button type="button"
  keyDownFunction(event){
    if(event.keyCode==13){
      if(this.myForm.value.username && this.myForm.value.password){
        this.login(this.myForm.value.username,this.myForm.value.password);
      } else if(!this.myForm.value.username && !this.myForm.value.password){
        this.error="Please Enter Username and Password to login";
      }else if(!this.myForm.value.username){
        this.error="Please Enter Username";
      }else if(!this.myForm.value.password){
        this.error="Please Enter Passsword";
      }

    }
  }
}

