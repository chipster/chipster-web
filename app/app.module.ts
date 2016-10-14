import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import ConfigurationResource from './resources/configurationresource';
import {NavigationComponent} from "./views/navigation/navigation.component";
import {FormsModule} from "@angular/forms";
import {LoginComponent} from "./views/login/login.component";
import SelectionService from "./views/sessions/session/selection.service";


@NgModule({
    imports: [ BrowserModule, HttpModule, FormsModule ],
    declarations: [ NavigationComponent, LoginComponent ],
    providers: [ ConfigurationResource, SelectionService ]
})
export class AppModule {}

