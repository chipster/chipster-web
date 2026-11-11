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
import { environment } from "../../environments/environment";

/*
 * ag-grid needs its features registered, and its theme replaces the css files. In
 * development, ValidationModule logs the name of any module that a grid is missing.
 *
 * Every component with a grid imports this file for its side effect, before the grid is
 * created. It runs once, when the first of them is loaded. Registering in main.ts would put
 * ag-grid, a third of the bundle, in the code that every page loads, though only the admin
 * storage view and the wrangle modal of the session view have grids.
 */
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
