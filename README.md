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

## Formatting

Run `npm run prettier` to check formatting and `npm run prettier-write` to fix it. Prettier covers TypeScript, HTML, LESS and CSS under `src/` and `e2e/`, and `.prettierignore` excludes the vendored code in `src/assets`.

A pre-commit hook checks staged files with Prettier and ESLint, and refuses the commit if any are unformatted or have lint errors. `npm install` activates it by pointing `core.hooksPath` at `.githooks`. `lint-staged` picks the staged files by the patterns in `package.json` and runs each tool once on those only, so the check stays fast whatever the size of the repo. Skip it for one commit with `git commit --no-verify`, or turn it off in your clone with `git config --unset core.hooksPath`.

## Linting

Run `npm run lint` to check and `npm run lint-fix` to fix what ESLint can fix by itself. `ng lint` checks the same files through the Angular builder. The rules are in `eslint.config.mjs`, in the flat config format that ESLint 9 requires.

The config extends the recommended sets of ESLint, typescript-eslint, eslint-plugin-import and angular-eslint, and adds the rules listed at the end of the typescript block by hand. Those hand-listed ones come from `eslint-config-airbnb-base`, which the project used until ESLint 9: airbnb has not been updated since, supports neither ESLint 9 nor typescript-eslint 8, and ships no flat config. Only the airbnb rules that catch mistakes were kept, not the ones that only enforce a style, which Prettier handles anyway.

The pre-commit hook runs ESLint on the staged files too, see Formatting above. It fails the commit on errors only, so the warnings below stay out of its way; `npm run lint` is where you see them.

`no-explicit-any` and `no-empty-object-type` are warnings rather than errors. Neither was enforced before and the codebase has hundreds of both, so they stay visible without failing the lint until the types are written properly. `import/no-cycle` warns for the same reason: the session services import each other in 17 cycles, which work only because Angular's dependency injection resolves them lazily, and untangling them is a job of its own.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
