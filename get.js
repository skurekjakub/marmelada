
const http = require('http');
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const async = require('async');


function handleRedirect(res, filename, dirname) {
  const location = res.headers.location;
  console.log(`Redirected to: ${location}`);
  
  http.get(location, (res) => {
    handleResponse(res, filename, dirname);
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

function handleResponse(res, filename, dirname) {
    const fileStream = fs.createWriteStream(dirname + filename.toLowerCase() + '.pdf');
    res.pipe(fileStream);
  
    fileStream.on('finish', () => {
      console.log('PDF downloaded successfully.');
    });

  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    handleRedirect(res, filename);
  }
}

function EnumeratePages(dirpath)
{


    var files = fs.readdirSync(dirpath)
            .filter((file) => path.extname(file).toLowerCase() === '.html');
    
    var pageIds = files.map(file => {
      console.log('Processing...' + file);
        const html = fs.readFileSync(dirpath+file, 'utf8');
        const $ = cheerio.load(html);
        const pageId = $(`body`).attr('pageid');
        const filename = path.parse(file).name;
        return { pageName: filename, pageId: pageId };
    })

    return pageIds;
}


EnumeratePages('docs/k11/').forEach(element => {

  console.log('getting...' + element);
    http.get(
        `http://localhost:8090/spaces/flyingpdf/pdfpageexport.action?pageId=${element.pageId}`,
         (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                handleRedirect(res, element.pageName, 'docs/pdf/k11/');
                } else {
                handleResponse(res, element.pageName, 'docs/pdf/k11/');
                }
      }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
      });   
});

