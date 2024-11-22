var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gls = require('gulp-live-server');
var insert = require('gulp-insert');
var del = require('del');


require('gulp-grunt')(gulp);


var paths = {
  tbjsTranslate: ['bower_components/sprintf/dist/sprintf.min.js', 'src/tb.translate.js'],
  scripts: [
    'src/tb.core.js',
    'src/tb.xerrors.js',
    'src/tb.browser.js',
    'src/tb.request.js',
    'src/tb.dispatcher.js',
    'src/tb.livegrid.js',
    'src/tb.file.js',
    'src/tb.crud.js',
    'src/tb.template.js',
    'src/tb.service.js'
  ],
  tbjsLivegrid: ['src/tb.core.js', 'src/tb.xerrors.js', 'src/tb.dispatcher.js', 'src/tb.livegrid.js'],
};


gulp.task('clean', function(cb) {
  del(['dist'], cb);
});

gulp.task('clean:jsdoc', function(cb) {
  del(['./public/jsdoc/**/*'], cb);
});


gulp.task('jsdoc', ['clean:jsdoc'], function() {
  gulp.run('grunt-jsdoc');
});


gulp.task('scripts', ['clean'], function() {
	gulp.src(paths.scripts)
/*
    .pipe(insert.wrap(`\
;(function(global, factory){
  (typeof exports === 'object' && typeof module !== 'undefined')
    ? module.exports = factory()
    : (typeof define === 'function' && define.amd)
      ? define(factory)
      : factory();
})(this, function(require) {
  'use strict';
  var TB = window.TB || {};
  window.TB = TB; 
`, `\
});
`))

*/
    .pipe(gulp.dest('./dist/js'));

  gulp.src(paths.tbjsTranslate)
    .pipe(concat('tb.translate.js'))
//    .pipe(insert.wrap(';(function(window){\n\'use strict\';\nvar TB = window.TB || {};\nwindow.TB = TB;\n', '})( typeof window === "undefined" ? this : window );\n'))
    .pipe(gulp.dest('./dist/js'));



  /* LIVEGRID */
  var tbjsLivegrid = gulp.src(paths.tbjsLivegrid)

  tbjsLivegrid
    .pipe(concat('tb.livegrid.min.js'))
//    .pipe(insert.wrap(';(function(window){\n\'use strict\';\nvar TB = window.TB || {};\nwindow.TB = TB;\n', '})( typeof window === "undefined" ? this : window );\n'))
    // .pipe(uglify())
    .pipe(gulp.dest('./dist/js/livegrid'));

  tbjsLivegrid
    .pipe(concat('tb.livegrid.js'))
//    .pipe(insert.wrap(';(function(window){\n\'use strict\';\nvar TB = window.TB || {};\nwindow.TB = TB;\n', '})( typeof window === "undefined" ? this : window );\n'))
    .pipe(gulp.dest('./dist/js/livegrid'));
  /* /LIVEGRID */




  // gulp.src(paths.scripts)
  //   // .pipe(sourcemaps.init())
  //   .pipe(uglify())
  //   .pipe(concat('all.min.js'))
  //   // .pipe(sourcemaps.write())
  //   .pipe(gulp.dest('./dist/js'));


});

gulp.task('watch', function() {
  gulp.watch(['./src/**/*.js'], ['scripts']);
});

gulp.task('serve', function() {
  // var server = gls([gls.script, 'public', 9200], undefined, 9300);
  var server = gls([gls.script, 'public', 9200]);

  server.start();

  gulp.watch(['./dist/**/*.js', './public/**/*'], function (file) {
    server.notify.apply(server, [file]);
  });
});


gulp.task('serve:tests', function() {

});

const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');

gulp.task('babeeel', () => {
  return gulp.src('src/tb.crud.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/js/'));
});
