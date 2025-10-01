import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export interface CertificateData {
  participantName: string;
  fdpTitle: string;
  startDate: string;
  endDate: string;
  certificateId: string;
  issueDate: string;
}

export async function generateCertificatePDF(
  data: CertificateData,
  templateHtml: string
): Promise<Buffer> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    
    const htmlContent = renderCertificateTemplate(templateHtml, data);
    
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    throw new Error("Failed to generate certificate PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function renderCertificateTemplate(template: string, data: CertificateData): string {
  let html = template;
  
  html = html.replace(/\{\{participantName\}\}/g, data.participantName);
  html = html.replace(/\{\{fdpTitle\}\}/g, data.fdpTitle);
  html = html.replace(/\{\{startDate\}\}/g, data.startDate);
  html = html.replace(/\{\{endDate\}\}/g, data.endDate);
  html = html.replace(/\{\{certificateId\}\}/g, data.certificateId);
  html = html.replace(/\{\{issueDate\}\}/g, data.issueDate);
  
  return html;
}

export function getDefaultCertificateTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 297mm;
      height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20mm;
    }
    
    .certificate {
      background: white;
      width: 100%;
      height: 100%;
      padding: 40px 60px;
      border: 15px solid #667eea;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 25px;
      left: 25px;
      right: 25px;
      bottom: 25px;
      border: 2px solid #764ba2;
      border-radius: 5px;
    }
    
    .header {
      text-align: center;
      position: relative;
      z-index: 1;
    }
    
    .logo {
      font-size: 48px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }
    
    .certificate-title {
      font-size: 42px;
      font-weight: bold;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 20px;
    }
    
    .subtitle {
      font-size: 20px;
      color: #555;
      font-style: italic;
      margin-bottom: 40px;
    }
    
    .content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      z-index: 1;
    }
    
    .presented-to {
      font-size: 18px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .recipient-name {
      font-size: 48px;
      font-weight: bold;
      color: #333;
      margin-bottom: 30px;
      border-bottom: 3px solid #764ba2;
      display: inline-block;
      padding-bottom: 10px;
    }
    
    .description {
      font-size: 18px;
      color: #555;
      line-height: 1.8;
      margin-bottom: 25px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .fdp-title {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 15px;
    }
    
    .dates {
      font-size: 16px;
      color: #666;
      margin-bottom: 40px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 1;
      margin-top: 30px;
    }
    
    .signature-section {
      text-align: center;
      flex: 1;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      width: 200px;
      margin: 0 auto 10px;
    }
    
    .signature-title {
      font-size: 14px;
      color: #666;
      font-weight: bold;
    }
    
    .signature-name {
      font-size: 12px;
      color: #888;
    }
    
    .certificate-id {
      font-size: 11px;
      color: #999;
      text-align: center;
      margin-top: 20px;
    }
    
    .ornament {
      position: absolute;
      width: 100px;
      height: 100px;
      opacity: 0.05;
    }
    
    .ornament-tl {
      top: 40px;
      left: 40px;
    }
    
    .ornament-tr {
      top: 40px;
      right: 40px;
    }
    
    .ornament-bl {
      bottom: 40px;
      left: 40px;
    }
    
    .ornament-br {
      bottom: 40px;
      right: 40px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <svg class="ornament ornament-tl" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#667eea"/>
    </svg>
    <svg class="ornament ornament-tr" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#764ba2"/>
    </svg>
    <svg class="ornament ornament-bl" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#764ba2"/>
    </svg>
    <svg class="ornament ornament-br" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#667eea"/>
    </svg>
    
    <div class="header">
      <div class="logo">Aashvee FDP</div>
      <div class="certificate-title">Certificate of Completion</div>
      <div class="subtitle">This is to certify that</div>
    </div>
    
    <div class="content">
      <div class="recipient-name">{{participantName}}</div>
      
      <div class="description">
        has successfully completed the Faculty Development Program
      </div>
      
      <div class="fdp-title">{{fdpTitle}}</div>
      
      <div class="dates">
        Conducted from {{startDate}} to {{endDate}}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-section">
        <div class="signature-line"></div>
        <div class="signature-title">Program Director</div>
        <div class="signature-name">Aashvee Tech Research & Training LLP</div>
      </div>
      
      <div class="signature-section">
        <div class="signature-line"></div>
        <div class="signature-title">Issue Date</div>
        <div class="signature-name">{{issueDate}}</div>
      </div>
    </div>
    
    <div class="certificate-id">
      Certificate ID: {{certificateId}}
    </div>
  </div>
</body>
</html>
  `;
}

export async function saveCertificate(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  const certificatesDir = path.join(process.cwd(), "uploads", "certificates");
  
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }
  
  const filePath = path.join(certificatesDir, fileName);
  fs.writeFileSync(filePath, pdfBuffer);
  
  return `/uploads/certificates/${fileName}`;
}
