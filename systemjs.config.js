
(function(global) {

    SystemJS.config({
        paths: {
            'npm:': '/node_modules/'
        },
        map: {
            'app':                        '/app', // 'dist',
            // angular bundles
            '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
            '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
            '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
            '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
            '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
            '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
            '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
            '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
            '@angular/upgrade': 'npm:@angular/upgrade/bundles/upgrade.umd.js',


            'angular2-in-memory-web-api': 'npm:angular2-in-memory-web-api',
            'rxjs':                       'npm:rxjs',
            'typescript':                   'npm:typescript/lib/typescript.js',
            'lodash':                       'npm:lodash',
            'd3':                           'npm:d3',
            'd3-context-menu':              'npm:d3-context-menu',
            'd3-tip':                       'npm:d3-tip'
        },
        packages: {
            'app':                       { main: 'app.main.js',  defaultExtension: 'js' },
            'rxjs':                       { defaultExtension: 'js' },
            'angular2-in-memory-web-api': { main: 'index.js', defaultExtension: 'js' },
            'lodash':                     {main: 'lodash.js', defaultExtension: 'js'},
            'd3':                           {main: 'd3.js', defaultExtension: 'js'},
            'd3-context-menu':              {main: 'js/d3-context-menu', defaultExtension: 'js'},
            'd3-tip':                       {main: 'index.js', defaultExtension: 'js'}
        }
    });

})(this);


