import { NgModule } from '@angular/core';
import AuthenticationService from "./authenticationservice";
import {CommonModule} from "@angular/common";

@NgModule({
    imports: [CommonModule],
    providers: [AuthenticationService]
})
export class AuthenticationModule {

}


