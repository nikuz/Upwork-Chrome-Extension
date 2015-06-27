'use strict';

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      clean: {
        command: 'rm -rf release && mkdir release'
      },
      copy_manifest_odesk: {
        command: 'cp manifest-odesk.json release/manifest.json'
      },
      copy_manifest_upwork: {
        command: 'cp manifest-upwork.json release/manifest.json'
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
      copy_images: {
        command: 'cp -r images release/'
      },
      copy_fontawesome: {
        command: [
          'mkdir release/css/',
          'mkdir release/css/fontawesome/',
          'mkdir release/fonts/',
          'cp -r bower_components/components-font-awesome/less/* release/css/fontawesome/',
          'cp -r bower_components/components-font-awesome/fonts/fontawesome-webfont.woff2 release/fonts/'
        ].join(' && ')
      },
      remove_fontawesome_surpluses: {
        command: 'rm -rf release/css/fontawesome'
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
          'rm -rf release/js/background',
          'rm -rf release/js/components',
          'rm -rf release/js/modules',
          'rm release/js/config.js',
          'rm release/js/popup.js',
          'rm release/*.min.html'
        ].join(' && ')
      },
      build_move: {
        command: 'mv release/*.zip .'
      },
      build_move_back: {
        command: 'mv *.zip release/'
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
          },
          ignorePackages: ['components-font-awesome']
        },
        dest: 'release/bower_components/'
      }
    },
    babel: {
      options: {
        modules: 'amdStrict'
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
        files: 'css/*.less',
        tasks: ['less:upwork']
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
    less: {
      odesk: {
        options: {
          modifyVars: {
            headerColor: '#28b7ed',
            btnColor: '#28b7ed',
            linkColor: '#0093f0',
            odesk: true,
            upwork: false
          },
          compress: true
        },
        files: {
          'release/css/main.css': 'css/main.less'
        }
      },
      upwork: {
        options: {
          modifyVars: {
            headerColor: '#6FDA44',
            btnColor: '#5bbc2e',
            linkColor: '#43ac12',
            odesk: false,
            upwork: true
          },
          compress: true
        },
        files: {
          'release/css/main.css': 'css/main.less'
        }
      },
      fontawesome: {
        options: {
          compress: true
        },
        files: {
          'release/css/fontawesome.css': 'release/css/fontawesome/font-awesome.less'
        }
      }
    },
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true,
        processScripts: ['text/template']
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
      odesk: {
        files: [{
          expand: true,
          cwd: 'images/',
          src: ['**/odesk*.*', '**/common*.*'],
          dest: 'release/images/'
        }]
      },
      upwork: {
        files: [{
          expand: true,
          cwd: 'images/',
          src: ['**/upwork*.*', '**/common*.*'],
          dest: 'release/images/'
        }]
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
      require: {
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
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.registerTask('default', [
    'shell:clean',
    'shell:copy_manifest_upwork',
    'shell:copy_html',
    'shell:copy_js',
    'shell:copy_images',
    'shell:copy_fontawesome',
    'less:upwork',
    'less:fontawesome',
    'shell:remove_fontawesome_surpluses',
    'bower',
    'babel:dev',
    'watch'
  ]);

  grunt.registerTask('specs', [
    'shell:clean',
    'shell:copy_manifest_upwork',
    'shell:copy_html',
    'shell:copy_js',
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

  grunt.registerTask('manifest_copy', function(name) {
    var manifestFile = 'manifest-' + name + '.json',
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
    grunt.file.write('release/manifest.json', JSON.stringify(manifest));

    console.log('Copy manifest: release/manifest.json');
  });

  grunt.registerTask('build', [
    'shell:clean',
    'manifest_copy:upwork',
    'shell:copy_js',
    'shell:copy_fontawesome',
    'less:upwork',
    'less:fontawesome',
    'shell:remove_fontawesome_surpluses',
    'bower',
    'shell:remove_bower_surpluses',
    'babel:dev',
    'htmlmin',
    'string-replace',
    'imagemin:upwork',
    'requirejs',
    'shell:release_clear',
    'compress'
  ]);

  grunt.registerTask('build:odesk', [
    'shell:clean',
    'manifest_copy:odesk',
    'shell:copy_js',
    'shell:copy_fontawesome',
    'less:odesk',
    'less:fontawesome',
    'shell:remove_fontawesome_surpluses',
    'bower',
    'shell:remove_bower_surpluses',
    'babel:dev',
    'htmlmin',
    'string-replace',
    'imagemin:odesk',
    'requirejs',
    'shell:release_clear',
    'compress'
  ]);

  grunt.registerTask('build:all', [
    'build:odesk',
    'shell:build_move',
    'build',
    'shell:build_move_back'
  ]);
};
