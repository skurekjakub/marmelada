
const http = require('http');
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const async = require('async');


const LOCALHOST = 'http://localhost:8090';
const DELAY = 1000;

function handleRedirect(res, filename, dirname) {
  const location = res.headers.location;
  console.log(`Redirected to: ${location}`);
  
  http.get(LOCALHOST + location, (res) => {
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
            .filter((file) => path.extname(file).toLowerCase() === '.html')
            // non-pages
            .filter((file) => path.parse(file).name.toLowerCase() !== 'index')
            .filter((file) => path.parse(file).name.toLowerCase() !== 'search')
            // k11 hidden page
            .filter((file) => path.parse(file).name.toLowerCase() !== 'customizing-evaluation-of-buy-x-get-y-discounts');
  

    var pageData = files.map(file => {
      console.log('Processing...' + file);
        const html = fs.readFileSync(dirpath+file, 'utf8');
        const $ = cheerio.load(html);
        const pageId = $(`body`).attr('pageid');
        const filename = path.parse(file).name;
        
        return { pageName: filename, 
                 exportUrl: `http://localhost:8090/spaces/flyingpdf/pdfpageexport.action?pageId=${pageId}`
                 };
    })

    return pageData;
}

async function delay(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

var data = EnumeratePages('docs/k11/');
console.log(`Length... ===============   ` + data.length);

async.mapLimit(data, 1, (element, callback) => {
                          
                          if (fs.existsSync('docs/pdf/k11/' + element.pageName.toLowerCase() + '.pdf'))
                          {
                            console.log(`${element.pageName} already exists, skipping.`)
                            return callback(null,null);
                          }    
                          

                            http.get(element.exportUrl,
                              (res) => {
                                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                                      
                                      const location = res.headers.location;
                                        console.log(`Redirected to: ${location}`);
                                        
                                        console.log(`Downloading ${element.pageName} `)
                                        http.get(LOCALHOST + location, (res) => {
                                          const fileStream = fs.createWriteStream('docs/pdf/k11/' + element.pageName.toLowerCase() + '.pdf');
                                          res.pipe(fileStream);
                                        
                                          fileStream.on('finish', () => {
                                            console.log('PDF downloaded successfully.');
                                          });

                                          delay(DELAY).then(() => {
                                            
                                            return callback(null, null);
                                          });
                                      
                                        }).on('error', (err) => {
                                          console.error(`Error: ${err.message}`);
                                        });
                                      
                                    } else {
                                      handleResponse(res, element.pageName, 'docs/pdf/k11/');
                                    }
                                    }).on('error', (err) => {
                                          console.log(err);
                                          return callback(err, null);
                                    }).on('end', () => {
                                          callback(null, null);
                                     });
                            }, 
                (err, results) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log(results);
                }
              });
