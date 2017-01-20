import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import {NavigationComponent} from "./views/navigation/navigation.component";
import {FormsModule} from "@angular/forms";
import {LoginComponent} from "./views/login/login.component";
import SelectionService from "./views/sessions/session/selection.service";
import ConfigService from "./shared/services/config.service";
import {HomeComponent} from "./views/home/home.component";
import {SessionModule} from "./views/sessions/session/session.module";
import {CoreModule} from "./core/core.module";

@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      CoreModule,
      SessionModule
    ],
    declarations: [ NavigationComponent, LoginComponent, HomeComponent ],
    providers: [ SelectionService ]
})
export class AppModule {}
