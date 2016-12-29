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
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {BytesPipe} from "./pipes/bytes.pipe";
import {SessionModule} from "./views/sessions/session/session.module";


@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      RouterModule,
      AuthenticationModule,
      SessionModule
    ],
    declarations: [ NavigationComponent, LoginComponent, HomeComponent ],
    providers: [ ConfigurationResource, SelectionService, ConfigService, TSVReader ]
})
export class AppModule {}
