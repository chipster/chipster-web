import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["src/test-setup.ts"],
    include: ["src/**/*.spec.ts"],
    /*
     * TSVFile.input.spec.ts only exports test data for the other specs to
     * import. It has no tests of its own, so it must not be collected as a
     * test file, but it is still importable.
     */
    exclude: [...configDefaults.exclude, "src/**/*.input.spec.ts"],
    /*
     * These tests are plain TypeScript: model classes and services created
     * with stub dependencies. Nothing renders a component, so no DOM is
     * needed. Angular's own TestBed support would come from its unit-test
     * builder (@angular/build:unit-test), which is deliberately not used:
     * vitest runs directly, and moving to the builder is a separate decision
     * after the Angular upgrade. It would also tie the vitest version to the
     * builder's.
     */
    environment: "node",
  },
});
