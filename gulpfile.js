'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  fs = require('fs'),
  webpack = require('webpack'),
  webpackConfig = require('./webpack.config.js'),
  eslint = require('gulp-eslint'),
  clean = require('gulp-clean');

gulp.task('webpack:build', ['build:clean'], function(done) {
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
    done();
  });
});

gulp.task('build:clean', function() {
  return gulp.src('./release', {read: false}).pipe(clean({force: true}));
});

gulp.task('copy:manifest', ['build:clean'], function(done) {
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

gulp.task('copy:manifest-dev', ['build:clean'], function() {
  return gulp.src(['./manifest.json']).pipe(gulp.dest('release'));
});

gulp.task('copy:images', ['build:clean'], function() {
  return gulp.src(['./src/images/**/*']).pipe(gulp.dest('release/images'));
});

var myDevConfig = Object.create(webpackConfig);
myDevConfig.devtool = 'sourcemap';
myDevConfig.debug = true;

var devCompiler = webpack(myDevConfig);

gulp.task('webpack:build-dev', ['build:clean'], function(callback) {
  return devCompiler.run(function(err, stats) {
    if(err) throw new gutil.PluginError('webpack:build-dev', err);
    gutil.log('[webpack:build-dev]', stats.toString({
      colors: true
    }));
    callback();
  });
});

gulp.task('build-dev', ['build:clean'], function() {
  return gulp.watch(['src/**/*'], ['webpack:build-dev']);
});

gulp.task('eslint', function () {
  return gulp.src([
      'app/**/*.js',
      'src/**/*.js',
      'src/**/*.jsx'
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('build', ['build:clean', 'webpack:build', 'copy:manifest', 'copy:images']);

gulp.task('default', ['build:clean', 'copy:manifest-dev', 'copy:images', 'webpack:build-dev', 'build-dev']);
