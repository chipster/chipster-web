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
import {VennDiagram} from "./views/sessions/session/visualization/venndiagram/venndiagram";
import ExpressionProfileTSVService from "./views/sessions/session/visualization/expressionprofile/expressionprofileTSV.service";
import ExpressionProfileService from "./views/sessions/session/visualization/expressionprofile/expressionprofile.service";


@NgModule({
    imports: [ BrowserModule, HttpModule, FormsModule, AuthenticationModule ],
    declarations: [ NavigationComponent, LoginComponent, VennDiagram ],
    providers: [ ConfigurationResource, SelectionService, ConfigService, TSVReader, ExpressionProfileTSVService, ExpressionProfileService ]
})
export class AppModule {}