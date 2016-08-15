
(function(global) {
    var map = {
        'app':                        '/app', // 'dist',
        '@angular':                   '/node_modules/@angular',
        'angular2-in-memory-web-api': '/node_modules/angular2-in-memory-web-api',
        'rxjs':                       '/node_modules/rxjs',
        'typescript':                   'node_modules/typescript/lib/typescript.js',
    };
    var packages = {
        '/app':                       { main: 'app.main.js',  defaultExtension: 'js' },
        'rxjs':                       { defaultExtension: 'js' },
        'angular2-in-memory-web-api': { main: 'index.js', defaultExtension: 'js' },
    };

    var ngPackageNames = [
        'common',
        'compiler',
        'core',
        'forms',
        'http',
        'platform-browser',
        'platform-browser-dynamic',
        'router',
        'router-deprecated',
        'upgrade'
    ];
    // Individual files (~300 requests):
    function packIndex(pkgName) {
        packages['@angular/'+pkgName] = { main: 'index.js', defaultExtension: 'js' };
    }
    // Bundled (~40 requests):
    function packUmd(pkgName) {
        packages['@angular/'+pkgName] = { main: '/bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
    }
    // Most environments should use UMD; some (Karma) need the individual index files
    var setPackageConfig = SystemJS.packageWithIndex ? packIndex : packUmd;
    // Add package entries for angular packages
    ngPackageNames.forEach(setPackageConfig);
    var config = {
        baseUrl: "/",
        map: map,
        packages: packages
    };
    SystemJS.config(config);
})(this);


