import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideCheckNoChangesConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideStore } from "@ngrx/store";
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
    provideZonelessChangeDetection(),
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
    /*
    The errors that the app doesn't catch, e.g. in a timer, a promise or a subscription without an
    error callback, to the ErrorHandler above. zone.js did this for the code that ran in Angular's
    zone; without it they would go only to the console.
    */
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    /*
    Check also the OnPush views, and once a second, that no binding has changed without
    notifying Angular. A view that would stay stale throws ExpressionChangedAfterItHasBeenChecked
    instead, which the ErrorHandler above logs in the console, once a second until the page is
    reloaded. Angular compiles this out of production builds.
    */
    provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 }),
  ],
};
