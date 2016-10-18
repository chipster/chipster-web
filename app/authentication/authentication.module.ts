import { NgModule } from '@angular/core';
import AuthenticationService from "./authenticationservice";
import {BrowserModule} from "@angular/platform-browser";

@NgModule({
    imports: [BrowserModule],
    providers: [AuthenticationService]
})
export class AuthenticationModule {

}


