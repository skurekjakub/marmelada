"use strict";

const ViewportTheme = require('gulp-viewport-kentico');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const babel = require('gulp-babel');
const colorify = require('ansi-colors');
const gulp = require('gulp');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const uglify = require('gulp-uglify-es').default;
// deminifies javascript on the client, included only in development builds
const sourcemaps = require('gulp-sourcemaps');


const TARGETDEV = 'DEV';
const THEME_NAME = 'Kentico Theme';
const BROWSERSYNC_URL = 'http://10.1.6.1:8090/';


var viewportThemeDev = new ViewportTheme({
    env: TARGETDEV,
    themeName: THEME_NAME,
    sourceBase: './'
});


function download_existing_theme(cb)
{
    viewportThemeDev.downloadTheme();

    cb();
}

function restore_development()
{
    if (!fs.existsSync(`./restore/assets`))
    {
        console.log(colorify.bold.yellow('Unpack a backup to the \'restore\' folder and run this command again.'));
        process.exit(1);
    }

    return gulp.src(['restore/**/*', '!restore/META-INF/**', '!restore/atlassian-plugin.xml', '!restore/README.txt'])
        .pipe(viewportThemeDev.upload(
            {
                sourceBase: 'restore/'
            }
        ));
}


function build_fonts() 
{
    return gulp.src('src/assets/fonts/**/*')
        .pipe(gulp.dest('build/assets/fonts'));
}


function build_img()
{
    return gulp.src('src/assets/img/**/*')
        .pipe(gulp.dest('build/assets/img'));
}


function build_scripts()
{
    return gulp.src(['src/assets/js/**/*.js'])
        .pipe(sourcemaps.init())
            .pipe(babel({
                presets: [
                  ['@babel/preset-env', {
                    modules: false,
                    targets: {
                        "ie": "11"
                      }
                  }]
                ]
              }))
            .pipe(uglify())
        .pipe(sourcemaps.write())		
        .pipe(gulp.dest('build/assets/js'));
}

function build_new_styles()
{
    return gulp.src('src/assets/less/theme.*.less', { sourcemaps: true })
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(cleanCss({debug: true}, (details) => {
            console.log(`${details.name}: Original: ${details.stats.originalSize}`);
            console.log(`${details.name}: Minified: ${details.stats.minifiedSize}`);
        }))   
        .pipe(gulp.dest('build/assets/css'));
}


function build_templates()
{
    return gulp.src('src/**/*.vm')
        .pipe(gulp.dest('build'));
}


function watch()
{
    console.log(`${viewportThemeDev.getUserAnnotation()} Changing theme ${colorify.bold.yellow(viewportThemeDev.options.themeName)} at ${colorify.green(viewportThemeDev.options.target.confluenceBaseUrl)}`);

    browserSync.init({
        proxy: BROWSERSYNC_URL
    });

    // on the uploaded event, refresh browser tab
    viewportThemeDev.on('uploaded', browserSync.reload);

    gulp.watch('src/assets/fonts/**/*', gulp.series(build_fonts, fonts_upload));
    gulp.watch('src/assets/img/**/*', gulp.series(build_img, img_upload));
	gulp.watch('src/assets/js/**/*', gulp.series(build_scripts, scripts_upload));
	gulp.watch('src/assets/less/**/*', gulp.series(build_new_styles, styles_upload));
    gulp.watch('src/**/*.vm', gulp.series(build_templates, templates_upload));
}


function reset_theme(cb)
{
    console.log(`Resetting ${colorify.bold.yellow(viewportThemeDev.options.themeName)} at ${viewportThemeDev.options.target.confluenceBaseUrl}...`);
    viewportThemeDev.removeAllResources();
    cb();
}


function fonts_upload()
{
    return gulp.src('build/assets/fonts/**/*')
    .pipe(viewportThemeDev.upload(
        {
            sourceBase: 'build/'
        }
    ));
}


function img_upload()
{
    return gulp.src('build/assets/img/**/*')
        .pipe(viewportThemeDev.upload(
            {
                sourceBase: 'build/'
            }
        ));
}


function scripts_upload()
{
    return gulp.src('build/assets/js/*.js')
        .pipe(viewportThemeDev.upload(
            {
                sourceBase: 'build/'
            }
        ));
}


function styles_upload() 
{
    return gulp.src('build/assets/css/*.css')
        .pipe(viewportThemeDev.upload(
            { 
                targetPath: 'build/'
            }
        ));
}


function templates_upload()
{
    return gulp.src('build/**/*.vm')
        .pipe(viewportThemeDev.upload(
            {
                sourceBase: 'build/'
            }
        ));
}


const build = gulp.parallel(build_img, build_fonts, build_new_styles, build_scripts, build_templates);
const upload = gulp.parallel(fonts_upload, img_upload, scripts_upload, styles_upload, templates_upload);


module.exports = { reset_theme, build, watch, upload, download_existing_theme, restore_development, build_new_styles };