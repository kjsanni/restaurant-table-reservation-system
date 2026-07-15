/**
 * Minimal, dependency-free PDF generator for text-based reports.
 * Produces a valid single-page PDF (Helvetica) from an array of lines.
 */
const generateTextPdf = (lines) => {
  const escape = (s) =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  let content = "BT\n/F1 16 Tf\n50 790 Td\n20 TL\n";
  lines.forEach((line, i) => {
    content += `(${escape(line)}) Tj\n`;
    if (i < lines.length - 1) content += "T*\n";
  });
  content += "ET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, idx) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
};

module.exports = { generateTextPdf };
