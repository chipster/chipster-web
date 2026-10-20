import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import { ErrorHandler, Injector, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { StoreModule } from "@ngrx/store";
import { setAppInjector } from "./app-injector";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { TokenService } from "./core/authentication/token.service";
import { CoreModule } from "./core/core.module";
import { AppErrorHandler } from "./core/errorhandler/apperrorhandler";
import { ErrorService } from "./core/errorhandler/error.service";
import { RoutingModule } from "./core/routing/routing.module";
import { HotkeyCheatsheetComponent } from "./shared/components/hotkey-cheatsheet/hotkey-cheatsheet.component";
import { ToastsComponent } from "./shared/components/toasts/toasts.component";
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
  selectedToolWithValidatedResources,
  validatedTool,
} from "./state/tool.reducer";
import { AdminRoutingModule } from "./views/admin/admin-routing.module";
import { ContactModule } from "./views/contact/contact.module";
import { ErrorComponent } from "./views/error/error.component";
import { NavigationComponent } from "./views/navigation/navigation.component";
import { DatasetContextMenuService } from "./views/sessions/session/dataset.cotext.menu.service";
import { SelectionService } from "./views/sessions/session/selection.service";
import { SessionModule } from "./views/sessions/session/session.module";

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    CoreModule,
    ContactModule,
    SessionModule,
    // before AppRoutingModule, so that the admin routes come before its "**" route
    AdminRoutingModule,
    StoreModule.forRoot(
      {
        selectedDatasets,
        selectedJobs,
        selectedToolById,
        selectedTool,
        selectedToolWithInputs,
        selectedToolWithValidatedInputs,
        selectedToolWithPopulatedParams,
        selectedToolWithValidatedParams,
        selectedToolWithValidatedResources,
        validatedTool,
        latestSession,
      },
      {
        runtimeChecks: {
          strictStateImmutability: false, // TODO refactor store usage so that these can be removed
          strictActionImmutability: false, // for example parameter.value is currently mutated
        },
      },
    ),
    SharedModule,
    RoutingModule,
    AppRoutingModule,
    NavigationComponent,
    HotkeyCheatsheetComponent,
    ErrorComponent,
    ToastsComponent,
  ],
  providers: [
    SelectionService,
    DatasetContextMenuService,
    TokenService,
    ErrorService,
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
})
export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }
}
