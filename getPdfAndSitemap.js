
const http = require('http');
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const async = require('async');


const SERVER = 'http://localhost:8090';
const DELAY = 1000;

function handleRedirect(res, filename, dirname) {
  const location = res.headers.location;
  console.log(`Redirected to: ${location}`);
  
  http.get(SERVER + location, (res) => {
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
            if (dirpath.includes('k11/'))
            {
            files.filter((file) => path.parse(file).name.toLowerCase() !== 'customizing-evaluation-of-buy-x-get-y-discounts')
            .filter((file) => path.parse(file).name.toLowerCase() !== 'customizing-application-of-buy-x-get-y-discounts');
           }

    var pageData = files.map(file => {
      console.log('Processing...' + file);
        const html = fs.readFileSync(dirpath+file, 'utf8');
        const $ = cheerio.load(html);
        const pageId = $(`body`).attr('pageid');
        const filename = path.parse(file).name;
        
        return { pageName: filename, 
                 exportUrl: `${SERVER}/spaces/flyingpdf/pdfpageexport.action?pageId=${pageId}`
                 };
    })

    return pageData;
}

function generateSitemap(baseUrl, spaceKey, pageData, dirpath)
{ 
    const fileStream = fs.createWriteStream(dirpath + 'sitemap.xml');
    fileStream.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    pageData.forEach(element => {
        fileStream.write(`<url><loc>${baseUrl}/${spaceKey}/${element.pageName.replace('&', '&amp;')}</loc></url>`);
    });

    fileStream.write('</urlset>');
    fileStream.close();

    console.log('Sitemap generated.');
}

async function delay(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

const SPACEKEY = 'k11tutorial';

var data = EnumeratePages(`docs/${SPACEKEY}/`);
generateSitemap(SERVER, SPACEKEY, data, `docs/${SPACEKEY}/`);


console.log(`Length... ===============   ` + data.length);

async.mapLimit(data, 1, (element, callback) => {
                          
                          if (fs.existsSync(`docs/pdf/${SPACEKEY}/` + element.pageName.toLowerCase() + '.pdf'))
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
                                        http.get(SERVER + location, (res) => {
                                          const fileStream = fs.createWriteStream(`docs/pdf/${SPACEKEY}/` + element.pageName.toLowerCase() + '.pdf');
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
                                      handleResponse(res, element.pageName, `docs/pdf/${SPACEKEY}/`);
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
