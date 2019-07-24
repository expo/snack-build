const gulp = require('gulp');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
  source: {
    js: 'src/**/*.js',
  },
  build: {
    node: 'dist',
    esm: 'esm',
  },
};

const transpile = (destination, config) =>
  gulp
    .src(paths.source.js)
    .pipe(changed(destination))
    .pipe(plumber())
    .pipe(sourcemaps.init({ identityMap: true }))
    .pipe(babel(config))
    .pipe(sourcemaps.write('__sourcemaps__', { sourceRoot: '/snack-build/src' }))
    .pipe(gulp.dest(destination));

gulp.task('build:node', () => transpile(paths.build.node));
gulp.task('build:esm', () => transpile(paths.build.esm, require('./.babelrc.esm.json')));

gulp.task('clean', () => del([paths.build.node, paths.build.esm]));
gulp.task('build', gulp.series('clean', gulp.parallel('build:node', 'build:esm')));
gulp.task('watch', gulp.series('build', () => gulp.watch(paths.source.js, gulp.series('build'))));

gulp.task('default', gulp.series('watch'));
