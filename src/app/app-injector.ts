import { Injector } from "@angular/core";

/**
 * Needed for getting around circular dependency with subclasses such as scatterplot.component.ts
 *
 *
 * Allows for retrieving singletons using `AppInjector.get(MyService)` (whereas
 * `ReflectiveInjector.resolveAndCreate(MyService)` would create a new instance
 * of the service).
 */
export let AppInjector: Injector;

/**
 * Helper to access the exported {@link AppInjector}, needed as ES6 modules export
 * immutable bindings; see http://2ality.com/2015/07/es6-module-exports.html
 */
export function setAppInjector(injector: Injector) {
  if (AppInjector) {
    // Should not happen
    console.error("Programming error: AppInjector was already set");
  } else {
    AppInjector = injector;
  }
}
