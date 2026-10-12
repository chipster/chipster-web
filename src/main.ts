/// <reference types="@angular/localize" />

import { enableProdMode } from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";
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

import { AppModule } from "./app/app.module";
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

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => log.error(err));
