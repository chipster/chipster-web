import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import {NavigationComponent} from "./views/navigation/navigation.component";
import {FormsModule} from "@angular/forms";
import {LoginComponent} from "./views/login/login.component";
import {SelectionService} from "./views/sessions/session/selection.service";
import {HomeComponent} from "./views/home/home.component";
import {SessionModule} from "./views/sessions/session/session.module";
import {CoreModule} from "./core/core.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {AppComponent} from "./app.component";
import {TokenService} from "./core/authentication/token.service";
import {AppRoutingModule} from "./app-routing.module";
import {SessionResolve} from "./views/sessions/session/session.resolve";
import {StoreModule} from "@ngrx/store";
import {datasetSelection, jobSelection} from "./state/reducers";

@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      CoreModule,
      SessionModule,
      NgbModule.forRoot(),
      AppRoutingModule,
      StoreModule.provideStore({datasetSelection, jobSelection})
    ],
    declarations: [ NavigationComponent, LoginComponent, HomeComponent, AppComponent ],
    providers: [ SelectionService, TokenService, SessionResolve ],
    bootstrap: [ AppComponent ]
})
export class AppModule {}
