/*
 * Importing @angular/common pulls in declarations that are only partially
 * compiled in the published packages. Angular's build normally runs the linker
 * over them, but Vitest imports the packages directly, so the JIT compiler has
 * to be available as a fallback.
 */
import "@angular/compiler";
