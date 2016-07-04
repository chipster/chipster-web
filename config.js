SystemJS.config({
    baseURL: "/",
    defaultJSExtensions: true,
    transpiler: "typescript",
    paths: {
        "npm:*": "node_modules/*"
    },
    map: {
        "angular": "npm:angular/angular.js",
        "angular-route": "npm:angular-route/angular-route.js",
        "angular-resource": "npm:angular-resource/angular-resource.js",
        "typescript": "npm:typescript/lib/typescript.js",
        "angular-local-storage": "npm:angular-local-storage/dist/angular-local-storage.js",
        "restangular": "npm:restangular/dist/restangular.js",
        "bluebird": "npm:bluebird/js/browser/bluebird.js",
        "ng-flow": "npm:ng-flow/dist/ng-flow-standalone.js"
    }
});