const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Verify arguments
const args = process.argv.slice(2);
const zipFlag = args.includes('-z');

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

const pdfPath = args.find(arg => arg !== '-z' && arg !== '--dir' && arg !== inputDir);

if (!isDirMode && !pdfPath) {
    console.error("Error: Please specify the path to the PDF file or use --dir <directory>.");
    console.error("Usage: node create-fill.js <path_to_pdf> [-z]");
    console.error("       node create-fill.js --dir <directory> [-z]");
    process.exit(1);
}

// 3. Read HTML template
const templatePath = path.resolve(__dirname, 'template.html');
if (!fs.existsSync(templatePath)) {
    console.error(`Error: template.html not found at ${templatePath}. Ensure you are in the correct directory.`);
    process.exit(1);
}
const baseTemplateHtml = fs.readFileSync(templatePath, 'utf8');

function processPdf(absolutePdfPath, outputDir) {
    if (!fs.existsSync(absolutePdfPath)) {
        console.error(`Error: PDF file does not exist (${absolutePdfPath})`);
        return;
    }

    // 2. Read and encode PDF to Base64
    console.log(`Reading PDF file: ${path.basename(absolutePdfPath)}...`);
    const pdfBuffer = fs.readFileSync(absolutePdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // 4. Inject data into template
    console.log(`Injecting data into .fill.html format...`);
    let templateHtml = baseTemplateHtml.replace('{{PDF_BASE64}}', pdfBase64);

    // 5. Create and save output file (.fill.html)
    const parsedPath = path.parse(absolutePdfPath);
    // The .fill.html extension allows OS (PC/Mobile) to open it natively without internet access
    const outputPath = path.resolve(outputDir, `${parsedPath.name}.fill.html`);

    fs.writeFileSync(outputPath, templateHtml, 'utf8');

    // 6. Summary and statistics
    if (zipFlag) {
        console.log(`Compressing to ZIP...`);
        const zipPath = path.resolve(outputDir, `${parsedPath.name}.fill.zip`);
        try {
            if (process.platform === 'win32') {
                execSync(`powershell -command "Compress-Archive -Path '${outputPath}' -DestinationPath '${zipPath}' -Force"`);
            } else {
                execSync(`zip -q -j "${zipPath}" "${outputPath}"`);
            }
            
            // Remove the original .fill.html file
            fs.unlinkSync(outputPath);
            
            const stats = fs.statSync(zipPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            console.log(`Success: File compressed successfully.`);
            console.log(`Output: ${zipPath}`);
            console.log(`Size: ${fileSizeInMB} MB\n`);
        } catch (error) {
            console.error(`Error during compression: ${error.message}\n`);
        }
    } else {
        const stats = fs.statSync(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`Success: File generated successfully.`);
        console.log(`Output: ${outputPath}`);
        console.log(`Size: ${fileSizeInMB} MB\n`);
    }
}

if (isDirMode) {
    const absoluteInputDir = path.resolve(inputDir);
    if (!fs.existsSync(absoluteInputDir) || !fs.statSync(absoluteInputDir).isDirectory()) {
        console.error(`Error: Directory does not exist or is not a directory (${absoluteInputDir})`);
        process.exit(1);
    }

    const inputDirName = path.dirname(absoluteInputDir);
    const inputBaseName = path.basename(absoluteInputDir);
    const outputDir = path.join(inputDirName, `${inputBaseName}_fill`);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Directory mode: Processing directory ${absoluteInputDir}`);
    console.log(`Output directory: ${outputDir}\n`);

    const files = fs.readdirSync(absoluteInputDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
        console.log("No PDF files found in the directory.");
    } else {
        pdfFiles.forEach(file => {
            const absolutePdfPath = path.join(absoluteInputDir, file);
            processPdf(absolutePdfPath, outputDir);
        });
        console.log(`Directory processing complete. ${pdfFiles.length} files processed.`);
    }
} else {
    const absolutePdfPath = path.resolve(pdfPath);
    processPdf(absolutePdfPath, process.cwd());
    if (!zipFlag) {
        console.log(`You can now open this file directly on PC or Mobile (100% offline).`);
    }
}
