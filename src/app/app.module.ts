import { BrowserModule } from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
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
import {selectedJobs} from "./state/selectedJobs.reducer";
import {selectedDatasets} from "./state/selectedDatasets.reducer";
import {ErrorComponent} from "./views/error/error.component";
import {AppErrorHandler} from "./views/error/apperrorhandler";
import {ErrorService} from "./views/error/error.service";
import {toolSelection} from "./state/selected-tool.reducer";

@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      FormsModule,
      CoreModule,
      SessionModule,
      NgbModule.forRoot(),
      AppRoutingModule,
      StoreModule.provideStore({selectedDatasets, selectedJobs, toolSelection})
    ],
    declarations: [ NavigationComponent, LoginComponent, HomeComponent, AppComponent, ErrorComponent ],
    providers: [SelectionService, TokenService, SessionResolve, ErrorService, {provide: ErrorHandler, useClass: AppErrorHandler}],
    bootstrap: [ AppComponent ]
})
export class AppModule {}
