/// <reference types="@angular/localize" />

import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import log from 'loglevel';

if (environment.production) {
  enableProdMode();
}

log.setDefaultLevel(log.levels.INFO);

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.log(err));
