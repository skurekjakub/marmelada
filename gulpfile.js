'use strict';

const dev = require("./gulp/development");
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const run = require('gulp-run');
const cheerio = require('cheerio');
const browserSync = require('browser-sync');

const server = browserSync.create('local');
const WEBHELP_RESOURCES = 'src/main/resources/com/k15t/scroll/scroll-webhelp-theme/_sources';

function fixExport(spaceKey)
{
    const docsPath = path.join(__dirname, "docs");
    const fullPath = path.join(docsPath, spaceKey);

    if(fs.existsSync(fullPath))
    {
        // create logger
        var logger = fs.createWriteStream(fullPath + 'logger.log');

        // Lowercase all HTML files
        fs.readdir(fullPath, (error, files) => {
            if (error) console.log(error)
            files.forEach( file => 
                {
                    logger.write(`Processing page ${file}`);

                    console.log(`Processing ... ${file}`);
                    const renamedFilePath = path.join(fullPath, file.toLowerCase());
                    // full lowercase the html filename
                    fs.renameSync(path.join(fullPath, file), renamedFilePath);

                    const stats = fs.statSync(renamedFilePath)
                    if (!stats.isDirectory())
                    {
                        //removeInThisSectionPanel(renamedFilePath, logger);
                        //fixTwoColumnPageLayout(renamedFilePath, logger);

                        generateHelpServiceRedirectHandler(renamedFilePath, logger);
                    }
                })
            })
    }
}

function removeInThisSectionPanel(filePath, logger)
{
    console.log('Removing "In this section panels."');

    const html = fs.readFileSync(filePath, 'utf8');

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Removes panels titled "In this section"
    $('.sp-panel header:contains("In this section")').first().parent().remove();

    fs.writeFileSync(filePath, $.html());
}

function fixTwoColumnPageLayout(filePath, logger)
{
    console.log('Fixing "On this page" and "Related pages" two-column layout.');

    const html = fs.readFileSync(filePath, 'utf8');
    const RIGHTCOLUMN = ".sp-grid-cell.sp-grid-40.sp-grid-sidebar";
    const RIGHTCOLUMNMARKUP = '<div class="sp-grid-cell sp-grid-40 sp-grid-sidebar"></div>';
    const LEFTCOLUMN = ".sp-grid-cell.sp-grid-60";
    const LEFTCOLUMNMARKUP = '<div class="sp-grid-cell sp-grid-60"></div>';
    const BOTTOMSECTIONMARKUP = '<div class="sp-grid-section bottom-column"></div>';
    const BOTTOMSECTION = '.sp-grid-section.bottom-column'
    const BOTTOMSECTIONCELLMARKUP = '<div class="sp-grid-cell sp-grid-100"></div>';
    const BOTTOMSECTIONCELL = '.sp-grid-cell.sp-grid-100'
    const SECTIONMARKUP = '<div class="sp-grid-section"></div>';
    const SECTION = '#main-content .sp-grid-section';

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Find the first occurrence of the HTML code to be wrapped
    const onThisPage = $('.sp-panel header:contains("On this page")').first().parent();
    const relatedPages = $('.sp-panel header:contains("Related pages")').first().parent();
    if (onThisPage.length)
    {
        $(SECTIONMARKUP).insertBefore(onThisPage);
        $(RIGHTCOLUMNMARKUP).insertBefore(onThisPage);
        $(RIGHTCOLUMN).append(onThisPage);
        $(RIGHTCOLUMN).append(relatedPages);
    }
    else if (relatedPages.length)
    {
        $(SECTIONMARKUP).insertBefore(relatedPages);
        $(RIGHTCOLUMNMARKUP).insertBefore(relatedPages);
        $(RIGHTCOLUMN).append(onThisPage);
        $(RIGHTCOLUMN).append(relatedPages);
    }
    else 
    {
        return;
    }

    // Find the element with id "main-content"
    const mainContentFirstChild = $('#main-content').children().first();
    $(SECTIONMARKUP).insertBefore(mainContentFirstChild);
    $(LEFTCOLUMNMARKUP).insertBefore(mainContentFirstChild);
    const sectionLeft = $(LEFTCOLUMN);

    const sectionLeftElements = $(RIGHTCOLUMN).prevUntil(sectionLeft);
    const array = sectionLeftElements.toArray().reverse();
    
    sectionLeft.append(array);
    $(SECTION).first().append($(LEFTCOLUMN));
    $(SECTION).first().append($(RIGHTCOLUMN));

    
    const lastElement = $('#main-content').children().last();
    const restOfThePage = $(RIGHTCOLUMN).nextUntil(lastElement);
    restOfThePage.add(lastElement);
    
    $(BOTTOMSECTIONMARKUP).insertAfter(SECTION);
    $(BOTTOMSECTION).append(BOTTOMSECTIONCELLMARKUP)


    $(BOTTOMSECTIONCELL).append(restOfThePage);

    // Save the modified HTML file
    fs.writeFileSync(filePath, $.html());
}

// Converts the page id to a byte array for further encoding
function longToByteArray(long) {
    var byteArray = [0, 0, 0, 0];
    for ( var index = 0; index < byteArray.length; index ++ ) {
      var byte = long & 0xff;
      byteArray [ index ] = byte;
      long = (long - byte) / 256 ;
    }
    return byteArray;
};

// Generates a Confluence page identifier from the provided B-64 encoded page id
// Taken directly from Confluence Server 7.2 source code
// com.atlassian.confluence.pages.TinyId
function generateTinyId(btoadId) {
    var padding = true;
    var tinyString = "";

    for (var i = btoadId.length - 1; i >= 0 ; i--) {

        var character = btoadId.charAt(i);

        if (character === '=' || character == '\n')
            continue;

        if (padding && character === 'A')
            continue;

        padding = false;

        if (character === '/') {
            tinyString = '-' + tinyString;
        }
        else if (character === '+') {
            tinyString = '_' + tinyString;
        }
        else {
            tinyString = character + tinyString;
        }
    }

    if (tinyString.length > 0) {
        var lastChar = tinyString.charAt(tinyString.length - 1);

        // CONF-9299 some email clients don't like URLs that end with a punctation
        if (lastChar === '-' || lastChar === '_')
            tinyString += '/';
    }

    return tinyString;
};

function getTinyIdentifier(pageId)
{
    return generateTinyId(btoa(
        longToByteArray(pageId)
            .map(String.fromCharCode)
            .map(function (s) {
                return s[0];
            })
            .join("")
      )
      .replace(/=/g,""))
}

function generateHelpServiceRedirectHandler(filePath, logger)
{
    const html = fs.readFileSync(filePath, 'utf8');

    // // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    const pageId = $(`body`).attr('pageid');
    const tinyId = getTinyIdentifier(pageId);

    console.log(`PageId ${pageId} -> tinyId ${tinyId}`);  
    const placeholder = filePath.replace(`${__dirname}\\docs`, "");
    var pagePath = placeholder.substring(0, placeholder.length-5);
    logger.write(`PageID = ${pageId}; TinyID = ${tinyId}`);
    const redirectHandler = `<!DOCTYPE html>
    <html lang="en-US">
      <meta charset="utf-8">
      <title>Redirecting&hellip;</title>
      <link rel="canonical" href="..${pagePath}">
      <meta http-equiv="refresh" content="0; url=\'..${pagePath}\'">
      <meta name="robots" content="noindex">
      <h1>Redirecting&hellip;</h1>
      <a href="..${pagePath}">Click here if you are not redirected.</a>
    </html>`;

    fs.writeFileSync(path.join(__dirname, `docs/x/${tinyId}.html`), redirectHandler);
}


// =========================================================
// ===================== GULP CALLS ========================
// =========================================================


async function fixK11(cb)
{
    fixExport("k11");
    return cb;
}

async function fixK11Tutorial(cb)
{
    
    fixExport("k11tutorial");
    return cb;
}

async function fixAPI11(cb)
{

    fixExport("api11");
    return cb;
}

async function fixDu(cb)
{
    fixExport("du");
    return cb;
}

async function fixK10(cb)
{
    fixExport("k10");
    return cb;
}

function isItWorking(cb)
{
    console.log('It\'s alive!');

    return cb();
}

async function browsersyncWatch(cb)
{
    server.init({
        server: {
            baseDir: './docs/',
            serveStaticOptions: {
             extensions: ["html"]
            }},
        ghostMode: false, // Toggle to mirror clicks, reloads etc (performance)
        logFileChanges: true,
        logLevel: 'debug',
        open: true,
    });

    gulp.watch(('./docs/**/*.*'), browsersync_reload)
    gulp.watch((WEBHELP_RESOURCES + '/**/*.*'), gulp.series(dev.build, browsersync_reload));

    return cb;
}

async function browsersync_reload(callback)
{
    server.reload();
    return callback;
}


function build_plugin()
{
    return gulp.src('/')
    .pipe(run('atlas-package'));
}



// -----------------Runnable tasks-------------------
exports.default = isItWorking;

exports.build = gulp.series(dev.build_scripts,dev.build_styles,build_plugin);
exports.build_styles = dev.build_styles;
exports.build_scripts = dev.build_scripts;

exports.fixExportK11 = gulp.series(fixK11);
exports.fixExportK11Tutorial = fixK11Tutorial;
exports.fixExportAPI11 = fixAPI11;

exports.watch = browsersyncWatch;