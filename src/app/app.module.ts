import { HttpClientModule } from "@angular/common/http";
import { ErrorHandler, Injector, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { StoreModule } from "@ngrx/store";
import { HotkeyModule } from "angular2-hotkeys";
import { ToastrModule } from "ngx-toastr";
import { setAppInjector } from "./app-injector";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { TokenService } from "./core/authentication/token.service";
import { CoreModule } from "./core/core.module";
import { AppErrorHandler } from "./core/errorhandler/apperrorhandler";
import { ErrorService } from "./core/errorhandler/error.service";
import { RoutingModule } from "./core/routing/routing.module";
import { ActionToastComponent } from "./shared/components/action-toast";
import { SharedModule } from "./shared/shared.module";
import { latestSession } from "./state/latest-session.reducer";
import { selectedDatasets } from "./state/selectedDatasets.reducer";
import { selectedJobs } from "./state/selectedJobs.reducer";
import {
  selectedTool,
  selectedToolWithInputs,
  selectedToolWithPopulatedParams,
  selectedToolWithValidatedInputs,
  validatedTool
} from "./state/tool.reducer";
import { AdminModule } from "./views/admin/admin.module";
import { ContactModule } from "./views/contact/contact.module";
import { ErrorComponent } from "./views/error/error.component";
import { NotFoundComponent } from "./views/error/not-found.component";
import { HomeComponent } from "./views/home/home.component";
import { LoginComponent } from "./views/login/login.component";
import { ManualModule } from "./views/manual/manual.module";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { SelectionService } from "./views/sessions/session/selection.service";
import { SessionModule } from "./views/sessions/session/session.module";
import { TermsComponent } from "./views/terms/terms.component";

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    CoreModule,
    ContactModule,
    SessionModule,
    ManualModule,
    NgbModule.forRoot(),
    AdminModule,
    StoreModule.forRoot({
      selectedDatasets,
      selectedJobs,
      selectedTool,
      selectedToolWithInputs,
      selectedToolWithValidatedInputs,
      selectedToolWithPopulatedParams,
      validatedTool,
      latestSession
    }),
    SharedModule,
    RoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      toastComponent: ActionToastComponent
    }),
    HotkeyModule.forRoot({ cheatSheetCloseEsc: true }),
    AppRoutingModule // must be last because a wildcard route is defined here
  ],
  declarations: [
    NavigationComponent,
    LoginComponent,
    HomeComponent,
    AppComponent,
    ErrorComponent,
    TermsComponent,
    NotFoundComponent
  ],
  providers: [
    SelectionService,
    TokenService,
    ErrorService,
    { provide: ErrorHandler, useClass: AppErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }
}
