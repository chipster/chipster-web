/// <reference types="@angular/localize" />

import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  DateFilterModule,
  ModuleRegistry,
  provideGlobalGridOptions,
  RowApiModule,
  TextFilterModule,
  themeAlpine,
  ValidationModule,
} from "ag-grid-community";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";
import log from "loglevel";

if (environment.production) {
  enableProdMode();
}

log.setDefaultLevel(log.levels.INFO);

// ag-grid needs its features registered, and its theme replaces the css files. In
// development, ValidationModule logs the name of any module that a grid is missing.
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowApiModule,
  TextFilterModule,
  CellStyleModule,
  DateFilterModule,
  ...(environment.production ? [] : [ValidationModule]),
]);
provideGlobalGridOptions({ theme: themeAlpine });

bootstrapApplication(AppComponent, appConfig).catch((err) => log.error(err));
