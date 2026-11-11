import fs from 'fs';
import path from 'path';

const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function generateSamplePdf(title, subtitle) {
  const content = `BT
/F1 18 Tf
50 720 Td
(${title}) Tj
/F1 12 Tf
0 -30 Td
(${subtitle}) Tj
0 -25 Td
(Eulogio Amang Rodriguez Institute of Science and Technology) Tj
0 -20 Td
(Office of Student Financial Assistance - Official Student Dossier Record) Tj
0 -30 Td
(Document Verified by Institute Registrar & SFAO Admissions Screener) Tj
ET`;

  const streamLength = Buffer.byteLength(content, 'utf8');

  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000228 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${420 + streamLength}
%%EOF`;
}

export function ensureSampleUploadsExist(uploadsDir) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filesToEnsure = [
    { name: 'sample_cor.pdf', type: 'pdf', title: 'CERTIFICATE OF REGISTRATION', sub: 'A.Y. 2026-2027 Enrollment Record' },
    { name: 'sample_grades.pdf', type: 'pdf', title: 'OFFICIAL TRANSCRIPT OF GRADES', sub: 'Weighted Average Verification' },
    { name: 'sample_indigency.pdf', type: 'pdf', title: 'BARANGAY CERTIFICATE OF INDIGENCY', sub: 'Social Welfare & Development Clearance' },
    { name: 'sample.pdf', type: 'pdf', title: 'STUDENT SUPPORTING CREDENTIAL', sub: 'SFAO Applicant Document' },
    { name: 'sample_grades.png', type: 'png' },
    { name: 'sample_id.png', type: 'png' },
  ];

  filesToEnsure.forEach((item) => {
    const targetPath = path.join(uploadsDir, item.name);
    if (!fs.existsSync(targetPath)) {
      if (item.type === 'pdf') {
        fs.writeFileSync(targetPath, generateSamplePdf(item.title, item.sub), 'utf8');
      } else {
        fs.writeFileSync(targetPath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'));
      }
    }
  });
}

export default ensureSampleUploadsExist;
