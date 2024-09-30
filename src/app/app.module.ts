import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { ErrorHandler, Injector, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
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
  selectedToolById,
  selectedToolWithInputs,
  selectedToolWithPopulatedParams,
  selectedToolWithValidatedInputs,
  selectedToolWithValidatedParams,
  validatedTool,
} from "./state/tool.reducer";
import { AccessModule } from "./views/access/access.module";
import { AccessibilityComponent } from "./views/accessibility/accessibility.component";
import { AdminModule } from "./views/admin/admin.module";
import { ContactModule } from "./views/contact/contact.module";
import { ErrorComponent } from "./views/error/error.component";
import { MyllyHasMovedComponent } from "./views/error/mylly.component";
import { NotFoundComponent } from "./views/error/not-found.component";
import { HomeComponent } from "./views/home/home.component";
import { AuthButtonComponent } from "./views/login/auth-button.component";
import { LoginComponent } from "./views/login/login.component";
import { OidcCallbackComponent } from "./views/login/oidc-callback.component";
import { ManualModule } from "./views/manual/manual.module";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { PrivacyNoticeComponent } from "./views/privacy-notice/privacy-notice.component";
import { DatasetContextMenuService } from "./views/sessions/session/dataset.cotext.menu.service";
import { SelectionService } from "./views/sessions/session/selection.service";
import { SessionModule } from "./views/sessions/session/session.module";
import { TermsComponent } from "./views/terms/terms.component";

@NgModule({ declarations: [
        NavigationComponent,
        LoginComponent,
        AuthButtonComponent,
        OidcCallbackComponent,
        HomeComponent,
        AppComponent,
        ErrorComponent,
        TermsComponent,
        NotFoundComponent,
        MyllyHasMovedComponent,
        AccessibilityComponent,
        PrivacyNoticeComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        CoreModule,
        ContactModule,
        SessionModule,
        ManualModule,
        AccessModule,
        NgbModule,
        AdminModule,
        StoreModule.forRoot({
            selectedDatasets,
            selectedJobs,
            selectedToolById,
            selectedTool,
            selectedToolWithInputs,
            selectedToolWithValidatedInputs,
            selectedToolWithPopulatedParams,
            selectedToolWithValidatedParams,
            validatedTool,
            latestSession,
        }, {
            runtimeChecks: {
                strictStateImmutability: false, // TODO refactor store usage so that these can be removed
                strictActionImmutability: false, // for example parameter.value is currently mutated
            },
        }),
        SharedModule,
        RoutingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
            toastComponent: ActionToastComponent,
        }),
        HotkeyModule.forRoot({ cheatSheetCloseEsc: true }),
        AppRoutingModule], providers: [
        SelectionService,
        DatasetContextMenuService,
        TokenService,
        ErrorService,
        { provide: ErrorHandler, useClass: AppErrorHandler },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }
}
