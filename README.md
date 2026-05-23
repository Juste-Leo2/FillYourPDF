# FillYourPDF

FillYourPDF is a minimalist, dependency-free tool that converts any PDF document into a standalone, interactive HTML file. Once converted, you can open the file on any device (PC, Mobile, Tablet) natively in your web browser—100% offline—to read, annotate, draw, and export your edited PDF.

## Features

- **Zero Dependencies:** Pure native Node.js script. No `npm install`, no heavy libraries.
- **100% Offline & Private:** The resulting `.fill.html` file works entirely in your local browser. No data is sent to any server.
- **Cross-Platform:** Works seamlessly on Windows, macOS, Linux, iOS, and Android.
- **Interactive Tools:**
  - ✋ **Move/Zoom:** Navigate through your document easily (supports pinch-to-zoom on mobile and trackpad gestures).
  - ✏️ **Pen:** Draw or write on the document with multiple stroke sizes.
  - 🧽 **Eraser:** Precisely erase your drawings without affecting the underlying PDF.
  - **T Text:** Add text annotations and drag them anywhere on the page.
  - ⬛ **Hide/Redact:** Cover up sensitive information with white or black rectangles.
- **Export:** Save your annotated document back as a standard, finalized PDF with a single click.

## How to Use

### 1. Convert your PDF

To convert your PDF into an interactive HTML file, simply run the generator script via your terminal using Node.js:

```bash
node create-fill.js <path_to_your_document.pdf>
```

*Example:*
```bash
node create-fill.js sample.pdf
```

This will generate a new file named `sample.fill.html` in your current directory.

### 2. Annotate

Open the newly generated `.fill.html` file in your favorite web browser. You can double-click it on your PC or transfer it to your mobile device. Use the toolbar at the bottom to switch between tools, draw, write, and redact. 

*Tip: To delete a text or redaction element, simply tap/click on it to select it, then tap the "🗑️ Delete" button that appears at the top of the screen.*

### 3. Export

Once you are done editing, click the **"Export PDF"** button in the bottom toolbar to save your annotated document as a brand new PDF file.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.
By using, modifying, or distributing this software, you agree to the terms of the AGPL v3 license.
