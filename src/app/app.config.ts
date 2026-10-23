import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import {
  ApplicationConfig,
  ErrorHandler,
  provideCheckNoChangesConfig,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideStore } from "@ngrx/store";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";
import { AppErrorHandler } from "./core/errorhandler/apperrorhandler";
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
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
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    /*
    Development builds only: check also the OnPush views, and once a second, that no
    binding has changed without notifying Angular. A view that would stay stale throws
    ExpressionChangedAfterItHasBeenChecked in the console instead.
    */
    ...(environment.production ? [] : [provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })]),
  ],
};
