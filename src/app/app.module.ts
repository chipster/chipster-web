import { BrowserModule } from '@angular/platform-browser';
import {NgModule, ErrorHandler, Injector} from '@angular/core';
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
import {StoreModule} from "@ngrx/store";
import {selectedJobs} from "./state/selectedJobs.reducer";
import {selectedDatasets} from "./state/selectedDatasets.reducer";
import {ErrorComponent} from "./views/error/error.component";
import {AppErrorHandler} from "./core/errorhandler/apperrorhandler";
import {ErrorService} from "./core/errorhandler/error.service";
import {toolSelection} from "./state/selected-tool.reducer";
import {ContactComponent} from "./views/contact/contact.component";
import {HttpClientModule} from "@angular/common/http";
import {ManualModule} from "./views/manual/manual.module";
import {setAppInjector} from './app-injector';


@NgModule({
    imports: [
      BrowserModule,
      HttpModule,
      HttpClientModule,
      FormsModule,
      CoreModule,
      SessionModule,
      ManualModule,
      NgbModule.forRoot(),
      AppRoutingModule,
      StoreModule.provideStore({selectedDatasets, selectedJobs, toolSelection}),
    ],
    declarations: [ NavigationComponent, LoginComponent, HomeComponent, AppComponent, ErrorComponent, ContactComponent ],
    providers: [SelectionService, TokenService, ErrorService, {provide: ErrorHandler, useClass: AppErrorHandler}],
    bootstrap: [ AppComponent ]
})

export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }

}

