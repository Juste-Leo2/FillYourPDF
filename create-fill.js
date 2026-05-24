const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Verify arguments
const args = process.argv.slice(2);
const zipFlag = args.includes('-z');
const pdfPath = args.find(arg => arg !== '-z');

if (!pdfPath) {
    console.error("Error: Please specify the path to the PDF file.");
    console.error("Usage: node create-fill.js <path_to_pdf> [-z]");
    process.exit(1);
}

const absolutePdfPath = path.resolve(pdfPath);

if (!fs.existsSync(absolutePdfPath)) {
    console.error(`Error: PDF file does not exist (${absolutePdfPath})`);
    process.exit(1);
}

// 2. Read and encode PDF to Base64
console.log("Reading PDF file...");
const pdfBuffer = fs.readFileSync(absolutePdfPath);
const pdfBase64 = pdfBuffer.toString('base64');

// 3. Read HTML template
const templatePath = path.resolve(__dirname, 'template.html');
if (!fs.existsSync(templatePath)) {
    console.error(`Error: template.html not found at ${templatePath}. Ensure you are in the correct directory.`);
    process.exit(1);
}
let templateHtml = fs.readFileSync(templatePath, 'utf8');

// 4. Inject data into template
console.log("Injecting data into .fill.html format...");
templateHtml = templateHtml.replace('{{PDF_BASE64}}', pdfBase64);

// 5. Create and save output file (.fill.html)
const parsedPath = path.parse(absolutePdfPath);
// The .fill.html extension allows OS (PC/Mobile) to open it natively without internet access
const outputPath = path.resolve(process.cwd(), `${parsedPath.name}.fill.html`);

fs.writeFileSync(outputPath, templateHtml, 'utf8');

// 6. Summary and statistics
if (zipFlag) {
    console.log("\nCompressing to ZIP...");
    const zipPath = path.resolve(process.cwd(), `${parsedPath.name}.fill.zip`);
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
        console.log(`Size: ${fileSizeInMB} MB`);
    } catch (error) {
        console.error(`Error during compression: ${error.message}`);
        process.exit(1);
    }
} else {
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\nSuccess: File generated successfully.`);
    console.log(`Output: ${outputPath}`);
    console.log(`Size: ${fileSizeInMB} MB`);
    console.log(`\nYou can now open this file directly on PC or Mobile (100% offline).`);
}
