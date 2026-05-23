const fs = require('fs');
const path = require('path');

// 1. Vérification des arguments
const pdfPath = process.argv[2];

if (!pdfPath) {
    console.error("❌ Erreur : Veuillez spécifier le chemin vers le fichier PDF.");
    console.error("Usage: node create-fill.js <chemin_vers_le_pdf>");
    process.exit(1);
}

const absolutePdfPath = path.resolve(pdfPath);

if (!fs.existsSync(absolutePdfPath)) {
    console.error(`❌ Erreur : Le fichier PDF n'existe pas (${absolutePdfPath})`);
    process.exit(1);
}

// 2. Lecture et encodage du PDF en Base64
console.log("📄 Lecture du PDF en cours...");
const pdfBuffer = fs.readFileSync(absolutePdfPath);
const pdfBase64 = pdfBuffer.toString('base64');

// 3. Lecture du template HTML
const templatePath = path.resolve(__dirname, 'template.html');
if (!fs.existsSync(templatePath)) {
    console.error(`❌ Erreur : Le fichier template.html est introuvable (${templatePath}). Assurez-vous d'être dans le bon dossier.`);
    process.exit(1);
}
let templateHtml = fs.readFileSync(templatePath, 'utf8');

// 4. Injection des données dans le template
console.log("💉 Injection des données dans le format .fill...");
templateHtml = templateHtml.replace('{{PDF_BASE64}}', pdfBase64);

// 5. Création et sauvegarde du fichier de sortie (.fill.html)
const parsedPath = path.parse(absolutePdfPath);
// L'extension .fill.html permet aux OS (PC/Mobile) de l'ouvrir nativement sans internet
const outputPath = path.resolve(process.cwd(), `${parsedPath.name}.fill.html`);

fs.writeFileSync(outputPath, templateHtml, 'utf8');

// 6. Bilan et affichage des statistiques
const stats = fs.statSync(outputPath);
const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n✅ Succès ! Fichier généré avec succès.`);
console.log(`📁 Fichier : ${outputPath}`);
console.log(`⚖️  Taille : ${fileSizeInMB} MB`);
console.log(`\n👉 Vous pouvez maintenant l'ouvrir directement sur PC ou Mobile (100% hors-ligne) !`);
