/// <reference types="@angular/localize" />

import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";
import log from "loglevel";

if (environment.production) {
  enableProdMode();
}

log.setDefaultLevel(log.levels.INFO);

bootstrapApplication(AppComponent, appConfig).catch((err) => log.error(err));
