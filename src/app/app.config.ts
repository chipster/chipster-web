import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from "@angular/core";
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
  ],
};
