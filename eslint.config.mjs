// @ts-check
import eslint from "@eslint/js";
import angular from "angular-eslint";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // src/assets holds vendored libraries, same as in .prettierignore
    ignores: ["projects/**/*", "dist/**/*", ".angular/**/*", "coverage/**/*", "src/assets/**/*"],
  },
  {
    files: ["**/*.ts", "**/*.mts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: ["tsconfig.json"],
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    settings: {
      // the typescript resolver understands the exports maps of @angular/* and
      // the paths of tsconfig.json, which the node resolver does not
      "import/resolver": {
        typescript: {
          project: "tsconfig.json",
        },
      },
    },
    rules: {
      "@angular-eslint/directive-selector": ["error", { type: "attribute", prefix: "ch", style: "camelCase" }],
      "@angular-eslint/component-selector": ["error", { type: "element", prefix: "ch", style: "kebab-case" }],

      // rules kept from the airbnb set that was dropped with eslint 9, see
      // README. these catch mistakes, the style-only airbnb rules are gone.
      "array-callback-return": "error",
      "consistent-return": "error",
      "default-case": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "guard-for-in": "error",
      "no-console": "warn",
      "no-else-return": "error",
      // rebinding a parameter hides which value a later line reads. mutating
      // the fields of one is allowed, as angular and d3 code does that a lot
      "no-param-reassign": "error",
      "no-return-assign": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      radix: "error",
      // imports have to be declared in package.json, so that they don't
      // depend on what other packages happen to pull in
      "import/no-extraneous-dependencies": ["error", { devDependencies: false, optionalDependencies: false }],
      // an inner variable with the name of an outer one is usually a mistake,
      // and reads as one even when it isn't
      "@typescript-eslint/no-shadow": "error",

      // our angular components don't use default export
      "import/prefer-default-export": "off",

      // neither of these was enforced before the airbnb configs were dropped,
      // and the codebase has hundreds of both. warn to keep them visible and
      // to stop new ones spreading, until the types are written properly.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",

      // a leading underscore marks a binding that has to exist but isn't used,
      // like the parameters of an interface method or a d3 callback
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // plain javascript, like tooling scripts and this config. these are not
    // part of tsconfig.json, so the type-aware typescript block above can't
    // parse them.
    files: ["**/*.js", "**/*.mjs"],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended],
    rules: {
      // templates use the `x != null` idiom to catch undefined too, same as
      // the eqeqeq exception for typescript above
      "@angular-eslint/template/eqeqeq": ["error", { allowNullOrUndefined: true }],
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      // ambient declarations are vars by convention
      "no-var": "off",
    },
  },
  {
    files: ["playwright.config.ts", "vitest.config.mts", "e2e/**/*.ts", "**/*.spec.ts"],
    rules: {
      // tooling configs and tests import dev dependencies on purpose
      "import/no-extraneous-dependencies": ["error", { devDependencies: true, optionalDependencies: false }],
    },
  },
  prettier,
);
