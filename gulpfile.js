'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const cheerio = require('cheerio');

function fixExport(spaceKey)
{
    const docsPath = path.join(__dirname, "docs")
    const fullPath = path.join(docsPath, spaceKey)

    if(fs.existsSync(fullPath))
    {
        // Lowercase all HTML files
        fs.readdir(fullPath, (error, files) => {
            if (error) console.log(error)
            files.forEach( file => 
                {
                    console.log(`Processing ... ${file}`);
                    const renamedFilePath = path.join(fullPath, file.toLowerCase());
                    // full lowercase the html filename
                    fs.renameSync(path.join(fullPath, file), renamedFilePath);

                    const stats = fs.statSync(renamedFilePath)
                    if (!stats.isDirectory())
                    {
                        
                        //removeInThisSectionPanel(renamedFilePath);
                        //fixRelatedPagesAndOnThisPagePanels(renamedFilePath);

                        generateHelpServiceRedirectHandler(renamedFilePath);
                    }
                })
            })
    }
}

function removeInThisSectionPanel(filePath)
{
    console.log('Removing "In this section panels."');

    const html = fs.readFileSync(filePath, 'utf8');

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Removes panels titled "In this section"
    $('.confbox.panel .title.panel-header:contains("In this section")').first().parent().remove();

    fs.writeFileSync(filePath, $.html());
}

function fixRelatedPagesAndOnThisPagePanels(filePath)
{
    console.log('Fixing "On this page" and "Related pages" two-column layout.');

    const html = fs.readFileSync(filePath, 'utf8');
    const RIGHTCOLUMN = ".sp-grid-cell.sp-grid-40.sp-grid-sidebar";
    const RIGHTCOLUMNMARKUP = '<div class="sp-grid-cell sp-grid-40 sp-grid-sidebar"></div>';
    const LEFTCOLUMN = ".sp-grid-cell.sp-grid-60";
    const LEFTCOLUMNMARKUP = '<div class="sp-grid-cell sp-grid-60"></div>';

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);
    // Skip if already processed
    if ($(LEFTCOLUMN).length) return;

    // Find the first occurrence of the HTML code to be wrapped
    const onThisPage = $('.confbox.panel .title.panel-header:contains("On this page")').first().parent();
    const relatedPages = $('.confbox.panel .title.panel-header:contains("Related pages")').first().parent();
    if (onThisPage.length)
    {
        $(RIGHTCOLUMNMARKUP).insertBefore(onThisPage);
        $(RIGHTCOLUMN).append(onThisPage);
        $(RIGHTCOLUMN).append(relatedPages);
    }
    else if (relatedPages.length)
    {
        $(RIGHTCOLUMNMARKUP).insertBefore(relatedPages);
        $(RIGHTCOLUMN).append(onThisPage);
        $(RIGHTCOLUMN).append(relatedPages);
    }

    // Find the element with id "main-content"
    const mainContentFirstChild = $('#main-content').children().first();
    $(LEFTCOLUMNMARKUP).insertBefore(mainContentFirstChild);
    const sectionLeft = $(LEFTCOLUMN);

    const sectionLeftElements = $(RIGHTCOLUMN).prevUntil(sectionLeft);
    const array = sectionLeftElements.toArray().reverse();
    
    sectionLeft.append(array);

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


// Encodes provided page id in Base-64
function pageIdToB64(pageId) {
    return btoa(
        longToByteArray(pageId)
            .map(String.fromCharCode)
            .map(function (s) {
                return s[0];
            })
            .join("")
      )
      .replace(/=/g,"");
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
    return generateTinyId(pageIdToB64(pageId))
}

function generateHelpServiceRedirectHandler(filePath)
{
    const html = fs.readFileSync(filePath, 'utf8');

    // // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    const pageId = $(`body`).attr('elementpageid');
    const tinyId = getTinyIdentifier(pageId);

    console.log(`PageId ${pageId} -> tinyId ${tinyId}`);  
    const pagePath = filePath.replace(`${__dirname}\\docs`, "")  

    const redirectHandler = `<!DOCTYPE html>
    <html lang="en-US">
      <meta charset="utf-8">
      <title>Redirecting&hellip;</title>
      <link rel="canonical" href="..${pagePath}">
      <script>location="..${pagePath}"</script>
      <meta http-equiv="refresh" content="0; url=..${pagePath}">
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
    fixExport("k11tutorial");
    fixExport("k11api");
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


// -----------------Runnable tasks-------------------
exports.default = isItWorking;

exports.fixExport = gulp.series(fixK11);