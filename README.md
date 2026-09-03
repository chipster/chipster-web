# Chipster Web

The browser frontend for [Chipster](https://chipster.csc.fi), a platform for bioinformatics data analysis. An Angular single-page application that talks to the REST APIs in `chipster-web-server`.

## Development server
Run `npm start` or `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project, or `npm run build` for a production build. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `npm test` to execute the unit tests via [Vitest](https://vitest.dev). Use `npm run test:watch` to re-run them on file changes.

## Running end-to-end tests

Run `npm run test:e2e` to execute the end-to-end tests via [Playwright](https://playwright.dev). They drive a real browser against a running dev environment, so start the Angular dev server and chipster-web-server first. Chromium comes from the dev container image, see PLAYWRIGHT_BROWSERS_PATH.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
