import { AcademicResource } from '../types/academic';

/**
 * Escapes characters for PDF string literals
 */
function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Wraps long text into lines of maximum character length
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates a real, standards-compliant PDF 1.4 Blob for any academic resource
 * so browser PDF viewers and file downloads work reliably without external server dependencies.
 */
export function generateAcademicPdfBlob(
  resource: AcademicResource,
  institutionName = 'University Academic Resource Hub'
): Blob {
  const streamLines: string[] = [];
  let cursorY = 750;

  const addLine = (
    text: string,
    fontSize: number,
    isBold = false,
    indentX = 50,
    lineSpacing = fontSize * 1.45
  ) => {
    if (cursorY < 65) return; // Keep within single page bounds cleanly
    const fontKey = isBold ? '/F2' : '/F1';
    streamLines.push('BT');
    streamLines.push(`${fontKey} ${fontSize} Tf`);
    streamLines.push(`${indentX} ${Math.round(cursorY)} Td`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push('ET');
    cursorY -= lineSpacing;
  };

  const addRule = () => {
    if (cursorY < 65) return;
    streamLines.push('0.82 0.85 0.90 RG');
    streamLines.push('0.75 w');
    streamLines.push(`50 ${Math.round(cursorY + 4)} m 545 ${Math.round(cursorY + 4)} l S`);
    cursorY -= 12;
  };

  // Header Banner
  addLine(institutionName.toUpperCase(), 10, true, 50, 15);
  addLine(
    `CAMPUSVAULT OFFICIAL ACADEMIC ARCHIVE  |  ${resource.department} DEPARTMENT  |  SEMESTER ${resource.semester}`,
    8.5,
    false,
    50,
    16
  );
  addRule();

  // Document Title & Metadata
  addLine(`${resource.subjectCode} - ${resource.subjectName}`, 13, true, 50, 18);
  addLine(resource.title, 11, true, 50, 16);

  const metaLine = [
    `Regulation: ${resource.regulation}`,
    `Academic Year: ${resource.academicYear}`,
    resource.examType ? `Exam: ${resource.examType}` : null,
    resource.labName ? `Lab: ${resource.labName}` : null,
    resource.materialSubType ? `Type: ${resource.materialSubType}` : null,
    `Updated: ${resource.lastUpdated}`,
  ]
    .filter(Boolean)
    .join('   |   ');

  addLine(metaLine, 8.5, false, 50, 18);
  addRule();

  // Summary
  for (const line of wrapText(resource.summary, 88)) {
    addLine(line, 9.5, false, 50, 13.5);
  }
  cursorY -= 6;

  // Content Sections
  for (const section of resource.contentSections) {
    if (cursorY < 90) break;
    addLine(section.heading, 10.5, true, 50, 15);
    for (const item of section.body) {
      const wrapped = wrapText(item, 84);
      wrapped.forEach((line, idx) => {
        addLine(idx === 0 ? `- ${line}` : `  ${line}`, 9.5, false, 58, 13.5);
      });
    }
    cursorY -= 6;
  }

  // Footer
  cursorY = 42;
  addRule();
  addLine(
    `Document ID: ${resource.id}   |   File: ${resource.fileName}   |   Verified Academic Copy`,
    8,
    false,
    50,
    12
  );

  const contentStream = streamLines.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [0 0 595 842] /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Triggers a clean browser download for a resource
 */
export function triggerResourceDownload(
  resource: AcademicResource,
  institutionName?: string
): void {
  let url = resource.customFileUrl;
  let shouldRevoke = false;

  if (!url) {
    const blob = generateAcademicPdfBlob(resource, institutionName);
    url = URL.createObjectURL(blob);
    shouldRevoke = true;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = resource.fileName || `${resource.subjectCode}_${resource.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (shouldRevoke && url) {
    setTimeout(() => URL.revokeObjectURL(url!), 10000);
  }
}
