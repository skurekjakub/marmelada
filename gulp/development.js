

const browserSync = require('browser-sync').create();
const fs = require('fs');
const babel = require('gulp-babel');
const colorify = require('ansi-colors');
const gulp = require('gulp');
const less = require('gulp-less');
const sort = require('gulp-sort');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const uglify = require('gulp-uglify-es').default;
// deminifies javascript on the client, included only in development builds
const sourcemaps = require('gulp-sourcemaps');


const WEBHELP_ROOT = 'src/main/resources/com/k15t/scroll/scroll-webhelp-theme';

function build_scripts()
{
    return gulp.src([WEBHELP_ROOT + '/_sources/js/**/*.js'])
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
        .pipe(gulp.dest(WEBHELP_ROOT + '/scroll-html/assets/js'))
        .pipe(gulp.dest('docs/du/assets/js'));;
}

function build_styles()
{
    return gulp.src(WEBHELP_ROOT + '/_sources/less/theme.*.less', { sourcemaps: true })
        .pipe(sort())
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(cleanCss({debug: true}, (details) => {
            console.log(`${details.name}: Original: ${details.stats.originalSize}`);
            console.log(`${details.name}: Minified: ${details.stats.minifiedSize}`);
        }))   
        .pipe(gulp.dest(WEBHELP_ROOT + '/scroll-html/assets/css'))
        .pipe(gulp.dest('docs/du/assets/css'));
}



const build = gulp.parallel(build_styles, build_scripts);


module.exports = {build, build_styles, build_scripts };