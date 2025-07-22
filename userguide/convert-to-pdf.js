const puppeteer = require('puppeteer');
const path = require('path');

async function convertToPDF(htmlFileName, pdfFileName) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    
    // Load the HTML file
    const htmlPath = path.join(__dirname, htmlFileName);
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Generate PDF with optimized settings for preventing page breaks
    await page.pdf({
        path: pdfFileName,
        format: 'A4',
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: false
    });
    
    await browser.close();
    console.log(`PDF generated successfully: ${pdfFileName}`);
}

async function convertAllGuides() {
    try {
        // Convert Admin Guide
        await convertToPDF('CollectionCRM_Admin_Guide.html', 'CollectionCRM_Admin_Guide.pdf');
        
        // Convert User Guide
        await convertToPDF('CollectionCRM_User_Guide.html', 'CollectionCRM_User_Guide.pdf');
        
        console.log('All PDF guides generated successfully!');
    } catch (error) {
        console.error('Error converting PDFs:', error);
    }
}

// Export the function for individual use
module.exports = { convertToPDF };

// Run conversion if this file is executed directly
if (require.main === module) {
    convertAllGuides();
}