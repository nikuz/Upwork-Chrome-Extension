'use strict';

var webpack = require('webpack'),
  path = require('path');

module.exports = function (config) {
  config.set({
    browsers: [ 'Chrome_without_security' ], //run in Chrome
    customLaunchers: {
      Chrome_without_security: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      }
    },
    singleRun: true, //just run once by default
    frameworks: [ 'mocha' ], //use the mocha test framework
    files: [
      'index.js' //just load this file
    ],
    preprocessors: {
      'index.js': [ 'webpack', 'sourcemap' ] //preprocess with webpack and our sourcemap loader
    },
    client: {
      mocha: {
        timeout: 1000 * 10
      }
    },
    reporters: [ 'dots' ], //report results in this format
    webpack: { //kind of a copy of your webpack config
      devtool: 'inline-source-map', //just do inline source maps instead of the default
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            'CURRENT_ENV': JSON.stringify('TEST')
          }
        })
      ],
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: ['babel'],
            query: {
              optional: ['runtime'],
              stage: 0
            }
          },
          {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
          },
          {
            test: /\.(otf|eot|svg|ttf|woff|woff2)(\?.+)?$/,
            loader: 'url-loader?limit=8192'
          },
          {
            test: /\.less$/,
            loader: 'style!css!less'
          },
          {
            test: /\.scss$/,
            loaders: ['style', 'css', 'sass']
          }
        ]
      },
      resolve: {
        extensions: ['', '.js', '.jsx', '.less'],
        modulesDirectories: ['node_modules'],
        alias: {
          linkify: path.join(__dirname, '../node_modules/linkifyjs/lib/linkify-string'),
          config: path.join(__dirname, '../src/js/config'),
          components: path.join(__dirname, '../src/js/components'),
          modules: path.join(__dirname, '../src/js/modules'),
          utils: path.join(__dirname, '../src/js/utils'),
          css: path.join(__dirname, '../src/css'),
          tests: path.join(__dirname, '../tests')
        }
      }
    },
    webpackServer: {
      noInfo: true //please don't spam the console when running in karma!
    }
  });
};