var gulp = require('gulp');
var tsc = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');


gulp.task('build', function() {
  var stream = gulp.src(['src/**/*.ts'])
    .pipe(sourcemaps.init())
    .pipe(tsc({target: 'ES5', module: 'commonjs'}))
    .on('error', function(error) {
      stream.emit('error', error);
    })
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return stream;
});