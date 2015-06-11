'use strict';

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      clean: {
        command: 'rm -rf release && mkdir release'
      },
      copy_dependencies: {
        command: 'cp manifest.json release/'
      },
      copy_html: {
        command: 'cp *.html release/'
      },
      copy_js: {
        command: [
          'cp --parents js/main.js release/',
          'cp --parents js/verifier.js release/',
          'cp --parents js/background/background.js release/'
        ].join(' && ')
      },
      copy_css: {
        command: 'cp -r css release/'
      },
      copy_images: {
        command: 'cp -r images release/'
      },
      remove_bower_surpluses: {
        command: 'rm release/bower_components/crypto-js/crypto-js.js'
      },
      copy_html_specs: {
        command: 'cp specs/*.html specs_babel/'
      }
    },
    bower: {
      dev: {
        options: {
          expand: true,
          packageSpecific: {
            'crypto-js': {
              files: [
                '*.js'
              ]
            },
            jquery: {
              files: [
                'dist/jquery.min.js'
              ]
            },
            underscore: {
              files: [
                'underscore-min.js'
              ]
            },
            reflux: {
              files: [
                'dist/reflux.min.js'
              ]
            },
            mustache: {
              files: [
                'mustache.min.js'
              ]
            }
          }
        },
        dest: 'release/bower_components/'
      }
    },
    babel: {
      options: {
        modules: 'amdStrict'
        //sourceMap: true
      },
      dev: {
        files: [{
          expand: true,
          cwd: 'js',
          src: ['**/*.js', '!main.js', '!verifier.js', '!background/background.js'],
          dest: 'release/js'
        }]
      },
      specs: {
        files: [{
          expand: true,
          cwd: 'specs',
          src: ['**/*.js'],
          dest: 'specs_babel'
        }]
      },
      prod: {
        options: {
          compact: true
        },
        files: [{
          expand: true,
          cwd: 'js',
          src: ['**/*.js', '!main.js', '!verifier.js', '!background/background.js'],
          dest: 'release/js'
        }]
      }
    },
    watch: {
      babel: {
        files: ['js/*.js', 'js/**/*.js'],
        tasks: ['babel:dev'],
        options: {
          spawn: false,
          interrupt: true
        }
      },
      html: {
        files: '*.html',
        tasks: ['shell:copy_html']
      },
      css: {
        files: 'css/*.css',
        tasks: ['shell:copy_css']
      },
      images: {
        files: 'images/*.*',
        tasks: ['shell:copy_images']
      }
    },
    jscs: {
      options: {
        preset: 'airbnb',
        config: '.jscsrc'
      },
      src: [
        '*.js',
        'js/**/*.js'
      ]
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        '*.js',
        'js/**/*.js'
      ]
    },
    cssmin: {
      files: {
        expand: true,
        cwd: 'css/',
        src: '*.css',
        dest: 'release/css/',
        ext: '.css'
      }
    },
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true
      },
      files: {
        expand: true,
        cwd: '',
        src: '*.html',
        dest: 'release/'
      }
    },
    imagemin: {
      files: {
        expand: true,
        cwd: 'images/',
        src: '**/*.{png,jpg,gif}',
        dest: 'release/images/'
      }
    },
    compress: {
      options: {
        archive: function() {
          var manifest = grunt.file.readJSON('release/manifest.json');
          return 'release/' + (manifest.short_name.replace(/\s/g, '_') + '_' + manifest.version) + '.zip';
        }
      },
      files: {
        expand: true,
        cwd: 'release/',
        src: ['**'],
        dest: ''
      }
    },
    mocha_phantomjs: {
      options: {
        //timeout: 1000 * 10,
        //reporter: 'spec'
      },
      all: ['specs_babel/index.html']
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('default', [
    'shell:clean',
    'shell:copy_dependencies',
    'shell:copy_html',
    'shell:copy_js',
    'shell:copy_css',
    'shell:copy_images',
    'bower',
    'babel:dev',
    'watch'
  ]);

  grunt.registerTask('specs', [
    'babel:specs',
    'shell:copy_html_specs',
    'mocha_phantomjs'
  ]);

  grunt.registerTask('before_push_test', [
    'jscs',
    'jshint'
  ]);

  grunt.registerTask('prebuild', [
    'shell:clean',
    'shell:copy_dependencies',
    'shell:copy_js',
    'cssmin',
    'bower',
    'shell:remove_bower_surpluses',
    'babel:prod',
    'htmlmin',
    'imagemin',
    'compress'
  ]);
  grunt.registerTask('build', function() {
    grunt.task.run('prebuild');

    var manifestFile = 'manifest.json';

    var manifest = grunt.file.readJSON(manifestFile),
      version = manifest.version.split('.');

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

    grunt.file.write(manifestFile, JSON.stringify(manifest, null, 2));
    grunt.file.write('release/' + manifestFile, JSON.stringify(manifest));

    console.log('Copy manifest: release/' + manifestFile);
  });
};
