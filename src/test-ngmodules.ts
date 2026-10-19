/*
 * The unit-test builder makes only the specs and this setup file the roots
 * of the compilation. A component declared in an NgModule gets its template
 * scope from that module, so when a spec reaches such a component, but not
 * its module, the template fails to compile: none of its elements, pipes or
 * bindings is known.
 *
 * This type-only export brings AppModule, and with it every NgModule of the
 * app, into the compilation. It is erased from the output, so nothing runs.
 * Remove this file when all components are standalone.
 */
export type { AppModule } from "./app/app.module";
