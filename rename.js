'use strict';

var fs = require('fs'),
  exec = require('child_process').exec,
  _ = require('underscore');

var files = [];
function getJsFiles(dir) {
  var cont = fs.readdirSync(dir);
  _.each(cont, function(file) {
    file = `${dir}/${file}`;
    fs.stat(file, function(err, response) {
      if (err) {
        console.log(err);
      } else {
        if (response.isDirectory()) {
          getJsFiles(file);
        } else {
          if (file.indexOf('.js') !== -1) {
            files.push(file);
          }
        }
      }
    });
  });
}
getJsFiles('./src/js/components');
setTimeout(function() {
  _.each(files, function(file) {
    exec(`git mv ${file} ${file.replace('.js', '.jsx')}`)
  });
}, 3000);