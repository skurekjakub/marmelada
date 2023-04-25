'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const cheerio = require('cheerio');

function fixExport(spaceKey)
{
    const docsPath = path.join(__dirname, "docs")

    const fullPath = path.join(docsPath, spaceKey)

    // Lowercase all HTML files
    fs.readdir(fullPath, (error, files) => {
        if (error) console.log(error)
        files.forEach( file => 
            {
                console.log(`Processing ... ${file}`);
                // full lowercase the html filename
                fs.renameSync(path.join(fullPath, file), path.join(fullPath, file.toLowerCase()));

                const stats = fs.statSync(path.join(fullPath, file.toLowerCase()))
                if (!stats.isDirectory())
                {
                    removeInThisSectionPanelAndMacros(path.join(fullPath, file.toLowerCase()));
                    fixPageLayout(path.join(fullPath, file.toLowerCase()));
                }
            })
        })
}

function removeInThisSectionPanelAndMacros(filePath)
{
    const html = fs.readFileSync(filePath, 'utf8');

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Removes panels titled "In this section"
    $('.confbox.panel .title.panel-header:contains("In this section")').first().parent().remove();

    fs.writeFileSync(filePath, $.html());
}

function fixPageLayout(filePath)
{
    const html = fs.readFileSync(filePath, 'utf8');

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Find the first occurrence of the HTML code to be wrapped
    const onThisPage = $('.confbox.panel .title.panel-header:contains("On this page")').first().parent();
    const relatedPages = $('.confbox.panel .title.panel-header:contains("Related pages")').first().parent();
    if (onThisPage.length || relatedPages.length)
    {
        $('<div class="section-right"></div>').insertBefore(onThisPage);
        $('.section-right').append(onThisPage);
        $('.section-right').append(relatedPages);
    }

    // Find the element with id "main-content"
    const mainContentFirstChild = $('#main-content').children().first();
    $('<div class="section-left"></div>').insertBefore(mainContentFirstChild);
    const sectionLeft = $('.section-left');

    const sectionLeftElements = $('.section-right').prevUntil(sectionLeft);
    const array = sectionLeftElements.toArray().reverse();
    
    sectionLeft.append(array);
    // mainContent.children().toArray().reverse().html();

    // const leftSection = mainContent.nextAll();
    // leftSection.wrap('<div class="section-left"></div>');
    // Find all elements above the first element up until the element with id "main-content"
    // const contentAbove = firstElement.prevUntil(mainContent);

    // Wrap the content above the first element in an additional div with the "section-left" class name
    // contentAbove.wrapAll('<div class="section-left"></div>');

    

    // if (firstElement.length)
    // {
    //     const secondElement = firstElement.next('.confbox.panel .title.panel-header:contains("Related pages")').first().parent();

    //     firstElement.insertBefore('<div class="section-right"></div>');
    //     const rightSection = $('.section-right');
    //     // If the second element exists, wrap both elements in an additional div with the "section-right" class name
    //     if (secondElement.length) {            
            
    //         rightSection.append(firstElement);
    //         //firstElement.remove()
    //         rightSection.append(secondElement);
    //         //secondElement.remove();

    //     // firstElement.add(secondElement).wrapAll('<div class="section-right"></div>');
    //     } else {
    //         rightSection.append(firstElement);
    //         //firstElement.remove();
    //     // Otherwise, only wrap the first element
    //     //firstElement.wrap('<div class="section-right"></div>');
    //     }
    // }

    

    // Save the modified HTML file
    fs.writeFileSync(filePath, $.html());
}

async function fixK11(cb)
{
    fixExport("k11");
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