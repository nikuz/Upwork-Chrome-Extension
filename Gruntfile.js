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
          'mkdir release/js/',
          'cp js/main.js release/js/',
          'cp js/verifier.js release/js/'
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
      specs_copy_js: {
        command: [
          'mkdir release/js/data',
          'cp specs/data/*.json release/js/data'
        ].join(' && ')
      },
      release_clear: {
        command: [
          'rm -rf release/bower_components',
          'rm release/js/background/daemon.js',
          'rm -rf release/js/components',
          'rm -rf release/js/modules',
          'rm release/js/config.js',
          'rm release/js/popup.js',
          'rm release/*.min.html'
        ].join(' && ')
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
          src: ['**/*.js', '!main.js', '!verifier.js'],
          dest: 'release/js'
        }]
      },
      specs: {
        files: [{
          expand: true,
          cwd: 'specs',
          src: ['**/*.js', '!test.main.js'],
          dest: 'release/js'
        }]
      },
      prod: {
        options: {
          compact: true
        },
        files: [{
          expand: true,
          cwd: 'js',
          src: ['**/*.js', '!main.js', '!verifier.js'],
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
        'js/**/*.js',
        'specs/**/*.js'
      ]
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        '*.js',
        'js/**/*.js',
        'specs/**/*.js'
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
        dest: 'release/',
        ext: '.min.html'
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
    /** karma configuration */
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        autoWatch: false,
        singleRun: true
      }
    },
    'string-replace': {
      dist: {
        files: [{
          expand: true,
          cwd: 'release/',
          src: '*.min.html',
          dest: 'release/',
          ext: '.html'
        }],
        options: {
          replacements: [{
            pattern: '<script src="/bower_components/requirejs/require.js"></script>',
            replacement: ''
          }]
        }
      }
    },
    requirejs: {
      options: {
        baseUrl: 'release/js',
        include: [
          '../bower_components/almond/almond'
        ],
        paths: {
          jquery: '../bower_components/jquery/dist/jquery',
          underscore: '../bower_components/underscore/underscore',
          async: '../bower_components/async/lib/async',
          reflux: '../bower_components/reflux/dist/reflux',
          mustache: '../bower_components/mustache/mustache',
          timeago: '../bower_components/jquery-timeago/jquery.timeago'
        },
        packages: [{
          name: 'crypto-js',
          location: '../bower_components/crypto-js',
          main: 'index'
        }],
        preserveLicenseComments: false,
        name: 'main',
        out: 'release/js/main.js',
        wrap: true
      },
      main: {
        options: {
          name: 'main',
          out: 'release/js/main.js'
        }
      },
      verifier: {
        options: {
          name: 'verifier',
          out: 'release/js/verifier.js'
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-string-replace');

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
    'shell:clean',
    'shell:copy_dependencies',
    'shell:copy_html',
    'shell:copy_js',
    'shell:copy_css',
    'shell:copy_images',
    'shell:specs_copy_js',
    'bower',
    'babel:dev',
    'babel:specs',
    'karma:unit'
  ]);

  grunt.registerTask('before_push_test', [
    'jscs',
    'jshint'
  ]);

  grunt.registerTask('manifest_copy', function() {
    var manifestFile = 'manifest.json',
      manifest = grunt.file.readJSON(manifestFile),
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

  grunt.registerTask('build', [
    'manifest_copy',
    'shell:clean',
    'shell:copy_dependencies',
    'shell:copy_js',
    'cssmin',
    'bower',
    'shell:remove_bower_surpluses',
    'babel:prod',
    'htmlmin',
    'string-replace',
    'imagemin',
    'requirejs',
    'shell:release_clear',
    'compress'
  ]);
};
