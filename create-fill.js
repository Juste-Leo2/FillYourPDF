const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

// 1. Verify arguments
const args = process.argv.slice(2);
const isUiMode = args.includes('--ui');
const zipFlag = args.includes('-z');

// Read HTML template
const templatePath = path.resolve(__dirname, 'template.html');
if (!fs.existsSync(templatePath)) {
    console.error(`Error: template.html not found at ${templatePath}. Ensure you are in the correct directory.`);
    process.exit(1);
}
const baseTemplateHtml = fs.readFileSync(templatePath, 'utf8');

function processPdf(absolutePdfPath, outputDir, zipFlag) {
    let log = [];
    if (!fs.existsSync(absolutePdfPath)) {
        throw new Error(`PDF file does not exist (${absolutePdfPath})`);
    }

    log.push(`Reading PDF file: ${path.basename(absolutePdfPath)}...`);
    const pdfBuffer = fs.readFileSync(absolutePdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    log.push(`Injecting data into .fill.html format...`);
    let templateHtml = baseTemplateHtml.replace('{{PDF_BASE64}}', pdfBase64);

    const parsedPath = path.parse(absolutePdfPath);
    const outputPath = path.resolve(outputDir, `${parsedPath.name}.fill.html`);

    fs.writeFileSync(outputPath, templateHtml, 'utf8');

    if (zipFlag) {
        log.push(`Compressing to ZIP...`);
        const zipPath = path.resolve(outputDir, `${parsedPath.name}.fill.zip`);
        try {
            if (process.platform === 'win32') {
                execSync(`powershell -command "Compress-Archive -Path '${outputPath}' -DestinationPath '${zipPath}' -Force"`);
            } else {
                execSync(`zip -q -j "${zipPath}" "${outputPath}"`);
            }
            
            fs.unlinkSync(outputPath);
            
            const stats = fs.statSync(zipPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            log.push(`Success: File compressed successfully.`);
            log.push(`Output: ${zipPath}`);
            log.push(`Size: ${fileSizeInMB} MB\n`);
        } catch (error) {
            throw new Error(`Error during compression: ${error.message}\n`);
        }
    } else {
        const stats = fs.statSync(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        log.push(`Success: File generated successfully.`);
        log.push(`Output: ${outputPath}`);
        log.push(`Size: ${fileSizeInMB} MB\n`);
    }
    return log.join('\n');
}

function runConversion(inputPath, isZip, singleFileOutput = process.cwd()) {
    const absoluteInput = path.resolve(inputPath);
    if (!fs.existsSync(absoluteInput)) {
        throw new Error(`Path not found: ${absoluteInput}`);
    }

    const stat = fs.statSync(absoluteInput);
    
    if (stat.isDirectory()) {
        const inputDirName = path.dirname(absoluteInput);
        const inputBaseName = path.basename(absoluteInput);
        const outputDir = path.join(inputDirName, `${inputBaseName}_fill`);
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const files = fs.readdirSync(absoluteInput);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            return `No PDF files found in directory ${absoluteInput}.`;
        }

        let totalProcessed = 0;
        pdfFiles.forEach(file => {
            const absolutePdfPath = path.join(absoluteInput, file);
            processPdf(absolutePdfPath, outputDir, isZip);
            totalProcessed++;
        });
        
        return `${totalProcessed} files processed successfully and saved in ${outputDir}.`;
    } else if (stat.isFile() && absoluteInput.toLowerCase().endsWith('.pdf')) {
        processPdf(absoluteInput, singleFileOutput, isZip);
        return `File processed successfully and saved in ${singleFileOutput}`;
    } else {
        throw new Error(`Path is not a valid PDF file or directory: ${absoluteInput}`);
    }
}

if (isUiMode) {
    const PORT = 3000;
    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/') {
            const uiPath = path.join(__dirname, 'ui.html');
            if (fs.existsSync(uiPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fs.readFileSync(uiPath));
            } else {
                res.writeHead(404);
                res.end('ui.html not found');
            }
        } else if (req.method === 'POST' && req.url === '/convert') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const absolutePath = path.resolve(data.path);
                    let outputDir;
                    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
                        outputDir = path.dirname(absolutePath);
                    }
                    const resultMessage = runConversion(data.path, data.zip, outputDir);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: resultMessage }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(PORT, () => {
        console.log(`UI Server started on http://localhost:${PORT}`);
        console.log(`Press Ctrl+C to stop.`);
        try {
            const url = `http://localhost:${PORT}`;
            if (process.platform === 'win32') {
                execSync(`start ${url}`);
            } else if (process.platform === 'darwin') {
                execSync(`open ${url}`);
            } else {
                execSync(`xdg-open ${url}`);
            }
        } catch (e) {
            console.log(`Please open http://localhost:${PORT} in your browser.`);
        }
    });

} else {
    const dirIndex = args.indexOf('--dir');
    const isDirMode = dirIndex !== -1;
    let inputDir = null;

    if (isDirMode) {
        if (dirIndex + 1 < args.length && !args[dirIndex + 1].startsWith('-')) {
            inputDir = args[dirIndex + 1];
        } else {
            console.error("Error: Please specify a directory after --dir.");
            process.exit(1);
        }
    }

    const pdfPath = args.find(arg => arg !== '-z' && arg !== '--dir' && arg !== inputDir && arg !== '--ui');

    if (!isDirMode && !pdfPath) {
        console.error("Error: Please specify the path to the PDF file, use --dir <directory>, or use --ui.");
        console.error("Usage: node create-fill.js <path_to_pdf> [-z]");
        console.error("       node create-fill.js --dir <directory> [-z]");
        console.error("       node create-fill.js --ui");
        process.exit(1);
    }

    const inputPath = isDirMode ? inputDir : pdfPath;

    try {
        const result = runConversion(inputPath, zipFlag, process.cwd());
        console.log(result);
        if (!zipFlag) {
            console.log(`You can now open this file directly on PC or Mobile (100% offline).`);
        }
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
