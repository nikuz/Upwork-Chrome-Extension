module.exports = function(grunt) {

    grunt.file.copy('js/core/angular.1.4.min.js', 'release/js/core/angular.1.4.min.js');

    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Project configuration.
    grunt.initConfig({
        cssmin: {
            files: {
                expand: true,
                cwd: 'css/',
                src: '*.css',
                dest: 'release/css/',
                ext: '.css'
            }
        },
        uglify: {
            files: {
                expand: true,
                cwd: 'js/',
                src: ['**/*.js', '!core/angular.1.4.min.js'],
                dest: 'release/js/'
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
                    return 'release/'+( manifest.short_name.replace(/\s/g, '_')+'_'+manifest.version )+'.zip';
                }
            },
            files: {
                expand: true,
                cwd: 'release/',
                src: ['**'],
                dest: ''
            }
        }
    });

    grunt.registerTask('other', [
        'cssmin',
        'uglify',
        'htmlmin',
        'imagemin',
        'compress'
    ]);
    grunt.registerTask('build', function(){
        grunt.task.run('other');

        var manifestFile = 'manifest.json';

        var manifest = grunt.file.readJSON(manifestFile),
            version = manifest['version'].split('.');

        version[2]++;

        if(version[2] > 9){
            version[2] = 0;
            version[1]++;
        }
        if(version[1] > 9){
            version[1] = 0;
            version[0]++;
        }

        manifest['version'] = version.join('.');

        grunt.file.write(manifestFile, JSON.stringify(manifest, null, 4));
        grunt.file.write('release/'+manifestFile, JSON.stringify(manifest));

        console.log('Copy manifest: release/'+manifestFile);
    });
};