var gulp = require("gulp");
var ts = require("gulp-typescript");
var browserSync = require('browser-sync').create();

var tsProject = ts.createProject("tsconfig.json");

gulp.task("compile", function () {
    return tsProject.src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest('dist/'));
});

gulp.task('start', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch('./app/**/*.ts', ['compile']);
    gulp.watch("./dist/dist.js").on('change', browserSync.reload);
    gulp.watch("./app/**/*.html").on('change', browserSync.reload);
    gulp.watch("./app/**/*.css").on('change', browserSync.reload);
});

gulp.task('default', ['start']);
