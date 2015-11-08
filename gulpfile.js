var gulp = require('gulp');

/* Import node modules */
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var es = require('event-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var tsify = require('tsify');
var glob = require('glob');
var babelify = require('babelify');


/* Config */
var config = {
  watchTarget: 'src/**/*.tsx',
  entryPoints: 'src/**/*.app.tsx',
  babelOpts:   { 
    presets: ["es2015", "react", "stage0"], 
    modules: 'common', 
    extensions: ['.js', '.ts', 'jsx'] 
  }
};



/**
 * TS Watch
 */
gulp.task('bundle', function () {
  var tasks = createBundles(true);
  var mergedSource = es.merge.apply(null, tasks);
  return mergedSource.pipe(gulp.dest('dist'));
});



function createBundles(isWatch){
  var files = glob.sync(config.entryPoints);
  return files.map(function(file){
    return createBundle(file, isWatch);
  });
}


function createBundle(file, isWatch) {
  var opts = { entries: [file, "./typings/tsd.d.ts"], debug: true  };

  var watchOpts = Object.assign({}, watchify.args, opts);
  var somefy = isWatch ? watchify(browserify(watchOpts)) : browserify(opts);

  var bundler = somefy
    .plugin(tsify, { project: 'tsconfig.json' })
    .transform(babelify.configure(config.babelOpts));


  var bundle = function(){

    gutil.log("Compiling " + file + "...");

    var hasError = false;

    var errorReporter = function (err) {
      gutil.log(gutil.colors.red(err.toString()));
      hasError = true;
    };

    var endHandler = function () {
      var message = hasError ? gutil.colors.red('[Error] ' + file) : gutil.colors.green('[Sucess] ' + file);
      gutil.log(message)
      hasError = false;
    };

    return bundler
      .bundle()
      .on('error', errorReporter)
      .pipe(source(file))
      .on('end', endHandler);
  };

  if(isWatch) {
    bundler.on('update', function(){
      bundle().pipe(gulp.dest('dist/app/'));
    });
  }

  return bundle();
}
