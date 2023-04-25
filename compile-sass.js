let fs = require('fs');
let sass = require('sass');

let sassBasePath = 'src/main/resources/com/k15t/scroll/scroll-webhelp-theme/shared/assets/sass/';
let outputPath = 'target/classes/com/k15t/scroll/scroll-webhelp-theme/shared/assets/css/';

fs.mkdirSync(outputPath, { recursive: true });

let files = [
    'theme.colors',
    'theme.main',
    'theme.toc'
];

for (file of files) {
    let inputPath = sassBasePath + file + '.scss';
    let outputFilePath = outputPath + file + '.css';

    console.log('Processing SASS file: ' + inputPath);

    let result = sass.renderSync({
        file: inputPath,
        includePaths: [sassBasePath]
    });
    fs.writeFileSync(outputFilePath, result.css);

    console.log('Created CSS file: ' + outputFilePath);
}
