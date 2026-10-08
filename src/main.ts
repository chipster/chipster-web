/// <reference types="@angular/localize" />

import { enableProdMode } from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import log from "loglevel";

if (environment.production) {
  enableProdMode();
}

log.setDefaultLevel(log.levels.INFO);

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
