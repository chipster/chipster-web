import { BrowserModule } from "@angular/platform-browser";
import { NgModule, ErrorHandler, Injector } from "@angular/core";
import { HttpModule } from "@angular/http";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { FormsModule } from "@angular/forms";
import { LoginComponent } from "./views/login/login.component";
import { SelectionService } from "./views/sessions/session/selection.service";
import { HomeComponent } from "./views/home/home.component";
import { SessionModule } from "./views/sessions/session/session.module";
import { CoreModule } from "./core/core.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AppComponent } from "./app.component";
import { TokenService } from "./core/authentication/token.service";
import { AppRoutingModule } from "./app-routing.module";
import { StoreModule } from "@ngrx/store";
import { ErrorComponent } from "./views/error/error.component";
import { AppErrorHandler } from "./core/errorhandler/apperrorhandler";
import { ErrorService } from "./core/errorhandler/error.service";
import { ContactComponent } from "./views/contact/contact.component";
import { HttpClientModule } from "@angular/common/http";
import { ManualModule } from "./views/manual/manual.module";
import { setAppInjector } from "./app-injector";
import { AdminModule } from "./views/admin/admin.module";
import { TermsComponent } from "./views/terms/terms.component";
import { SharedModule } from "./shared/shared.module";
import { HotkeyModule } from "angular2-hotkeys";
import { selectedJobs } from "./state/selectedJobs.reducer";
import { selectedDatasets } from "./state/selectedDatasets.reducer";
import { toolSelection } from "./state/selected-tool.reducer";
import { latestSession } from "./state/latest-session.reducer";
import { NotFoundComponent } from "./views/error/not-found.component";
import { RoutingModule } from "./core/routing/routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ToastrModule } from "ngx-toastr";

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
    AdminModule,
    StoreModule.forRoot({
      selectedDatasets,
      selectedJobs,
      toolSelection,
      latestSession
    }),
    SharedModule,
    RoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      preventDuplicates: true,
      resetTimeoutOnDuplicate: true,
      timeOut: 1500
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
    ContactComponent,
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
