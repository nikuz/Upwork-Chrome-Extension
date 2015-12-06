'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  fs = require('fs'),
  livereload = require('gulp-livereload'),
  webpack = require('webpack'),
  WebpackDevServer = require('webpack-dev-server'),
  webpackConfig = require('./webpack.config.js'),
  eslint = require('gulp-eslint');

gulp.task('default', ['webpack-dev-server']);

gulp.task('webpack:build', function(callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      'process.env': {
        // This has effect on the react lib size
        'NODE_ENV': JSON.stringify('production'),
        'CURRENT_ENV': JSON.stringify('PROD')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(myConfig, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack:build', err);
    gutil.log('[webpack:build]', stats.toString({
      colors: true
    }));
    callback();
  });
});

gulp.task('copy:manifest', function(done) {
  var manifestFile = 'manifest.json',
    releaseFolder = 'release',
    manifest = require(`./${manifestFile}`),
    version = manifest.version.split('.');

  try {
    fs.accessSync(`./${releaseFolder}`);
  } catch(e) {
    fs.mkdirSync(`./${releaseFolder}`);
  }

  version.forEach(function(value, key) {
    version[key] = parseInt(value, 10);
  });

  version[2] += 1;
  if (version[2] > 9) {
    version[2] = 0;
    version[1] += 1;
  }
  if (version[1] > 9) {
    version[1] = 0;
    version[0] += 1;
  }

  manifest.version = version.join('.');

  fs.writeFileSync(`./${manifestFile}`, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(`./${releaseFolder}/${manifestFile}`, JSON.stringify(manifest, null, 2));
  done();
});

gulp.task('copy:images', function() {
  gulp.src(['./src/images/**/*']).pipe(gulp.dest('release/images'));
});

gulp.task('build', ['webpack:build', 'copy:manifest', 'copy:images']);

// modify some webpack config options
var myDevConfig = Object.create(webpackConfig);
myDevConfig.devtool = 'sourcemap';
myDevConfig.debug = true;

// create a single instance of the compiler to allow caching
var devCompiler = webpack(myDevConfig);

gulp.task('webpack:build-dev', function(callback) {
  // run webpack
  devCompiler.run(function(err, stats) {
    if(err) throw new gutil.PluginError('webpack:build-dev', err);
    gutil.log('[webpack:build-dev]', stats.toString({
      colors: true
    }));
    callback();
  });
});

// Build and watch cycle (another option for development)
// Advantage: No server required, can run app from filesystem
// Disadvantage: Requests are not blocked until bundle is available,
//               can serve an old app on refresh
gulp.task('build-dev', ['copy:manifest', 'copy:images', 'webpack:build-dev'], function() {
  gulp.watch(['src/**/*'], ['webpack:build-dev']);
});

gulp.task('webpack-dev-server', function(callback) {
  // modify some webpack config options
  var myConfig = Object.create(webpackConfig);
  myConfig.devtool = 'cheap-module-eval-source-map';
  myConfig.debug = true;
  myConfig.cache = true;
  myConfig.entry.main.unshift('webpack-dev-server/client?http://localhost:8080/', 'webpack/hot/only-dev-server');
  myConfig.plugins.unshift(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  );

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(myConfig), {
    //quiet: true,
    stats: {
      colors: true
    }
  }).listen(8080, 'localhost', function(err) {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
  });
});

gulp.task('eslint', function () {
  return gulp.src([
    'app/**/*.js',
    'src/**/*.js',
    'src/**/*.jsx'
  ])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});
