module.exports = function (grunt) {

    // Configuration goes here
    grunt.initConfig({
        less: {
            development: {
                files: {
                    'App_Themes/Default/bootstrap.css': 'App_Themes/Default/bootstrap.less',
                    'App_Themes/Default/DesignMode.css': 'App_Themes/Default/DesignMode.less',
                    'App_Themes/Design/OnSiteEdit.css': 'App_Themes/Design/OnSiteEdit.less',
                    'App_Themes/Design/UniGraph.css': 'App_Themes/Design/UniGraph.less',
                    'App_Themes/Design/Widgets.css': 'App_Themes/Design/Widgets.less',
                    'App_Themes/Global/Skin.css': 'App_Themes/Global/Skin.less',
                    'CMSModules/Newsletters/EmailBuilder/emailbuilder.iframe.css': 'CMSModules/Newsletters/EmailBuilder/emailbuilder.iframe.less'
                }
            },
            sampleSites: {
                files: {
                    'App_Themes/Global/Skin.css': 'App_Themes/Global/Skin.less'
                }
            }
        },
        devUpdate: {
            main: {
                options: {
                    packages: { // What packages to check
                        devDependencies: true // Only devDependencies
                    },
                    updateType: 'force', // Update modules and dependencies automatically
                    packageJson: null // Find package.json automatically
                }
            }
        },
        watch: {
            development: {
                files: ['App_Themes/Default/*.less', 'App_Themes/Default/**/*.less', 'App_Themes/Design/*.less', 'CMSModules/Newsletters/EmailBuilder/*.less'],
                tasks: ['less:development', 'autoprefixer:development']
            },
            sampleSites: {
                files: ['App_Themes/Global/*.less', 'App_Themes/Global/**/*.less'],
                tasks: ['less:sampleSites', 'autoprefixer:sampleSites']
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 9']
            },
            development: {
                src: [
                    'App_Themes/Default/bootstrap.css',
                    'App_Themes/Default/DesignMode.css',
                    'App_Themes/Design/OnSiteEdit.css',
                    'App_Themes/Design/UniGraph.css',
                    'App_Themes/Design/Widgets.css',
                    'App_Themes/Global/Skin.css',
                    'CMSModules/Newsletters/EmailBuilder/emailbuilder.iframe.css'
                ]
            },
            sampleSites: {
                src: 'App_Themes/Global/Skin.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-dev-update');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-autoprefixer');

    grunt.registerTask('default', ['devUpdate', 'watch']);
    grunt.registerTask('build', ['less', 'autoprefixer']);

};