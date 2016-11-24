import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import ConfigurationResource from './resources/configurationresource';
import {NavigationComponent} from "./views/navigation/navigation.component";
import {FormsModule} from "@angular/forms";
import {LoginComponent} from "./views/login/login.component";
import SelectionService from "./views/sessions/session/selection.service";
import ConfigService from "./services/config.service";
import {AuthenticationModule} from "./authentication/authentication.module";
import {TSVReader} from "./services/TSVReader";
import {VisualizationsModule} from "./views/sessions/session/visualization/visualizations.module";
import {RouterModule} from "@angular/router";


@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      RouterModule,
      AuthenticationModule,
      VisualizationsModule
    ],
    declarations: [ NavigationComponent, LoginComponent ],
    providers: [ ConfigurationResource, SelectionService, ConfigService, TSVReader ]
})
export class AppModule {}
