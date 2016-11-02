'use strict';
const gulp = require('gulp');
const babel = require('gulp-babel');
const exec = require('child_process').exec;
const sourcemaps = require('gulp-sourcemaps');
const seq = require('gulp-sequence');
const Promise = require('bluebird');
const rimraf = Promise.promisify(require('rimraf'));
const path = require('path');

gulp.task('del-es5', function () {
    return rimraf(path.join(__dirname, 'es5'));
});

gulp.task('compile-lib', function () {
    return gulp.src('lib/**/*.js', {base: '.'})
        .pipe(sourcemaps.init())
        .pipe(babel({
            ignore: 'TooTallNates/*.js',
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('es5'));
});

gulp.task('compile-test', function () {
    return gulp.src('test/**/*.js', {base: '.'})
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('es5'));
});

gulp.task('compile-benchmarks', function () {
    return gulp.src('benchmarks/**/*.js', {base: '.'})
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('es5'));
});

gulp.task('compile', seq('del-es5', ['compile-test', 'compile-lib', 'compile-benchmarks']));

gulp.task('default', ['compile']);

gulp.task('npm-publish', function (done) {
    exec('npm publish').on('close', function(err) {
        if (err) {
            return done(new Error('Cannot publish to the npm. Exit code: ' + err + '.'));
        }
        done();
    });
});

gulp.task('publish', seq('compile', 'npm-publish'));