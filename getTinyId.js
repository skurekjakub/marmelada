
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

function generateHelpServiceRedirectHandler(filePath)
{
    const html = fs.readFileSync(filePath, 'utf8');

    // // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    const pageId = $(`body`).attr('pageid');
    const tinyId = getTinyIdentifier(pageId);

    console.log(`PageId ${pageId} -> tinyId ${tinyId}`);  
    const pagePath = filePath.replace(`${__dirname}\\docs`, "");
}



console.log(generateTinyId(btoa(
    longToByteArray(68880829)
        .map(String.fromCharCode)
        .map(function (s) {
            return s[0];
        })
        .join("")
  )
  .replace(/=/g,"")))
