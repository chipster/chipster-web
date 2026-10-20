import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  Injector,
  provideEnvironmentInitializer,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideStore } from "@ngrx/store";
import { setAppInjector } from "./app-injector";
import { routes } from "./app.routes";
import { CoreModule } from "./core/core.module";
import { AppErrorHandler } from "./core/errorhandler/apperrorhandler";
import { ErrorService } from "./core/errorhandler/error.service";
import { RoutingModule } from "./core/routing/routing.module";
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
import { ContactModule } from "./views/contact/contact.module";
import { DatasetContextMenuService } from "./views/sessions/session/dataset.cotext.menu.service";
import { SelectionService } from "./views/sessions/session/selection.service";
import { SessionModule } from "./views/sessions/session/session.module";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    // before any component is created, as the AppModule constructor did
    provideEnvironmentInitializer(() => setAppInjector(inject(Injector))),
    importProvidersFrom(CoreModule, ContactModule, SessionModule, SharedModule, RoutingModule),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: "enabled" })),
    provideStore(
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
    SelectionService,
    DatasetContextMenuService,
    ErrorService,
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
};
