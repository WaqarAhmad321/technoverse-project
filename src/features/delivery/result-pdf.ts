import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { formatDate, formatMarks } from "@/lib/format";
import type { ResultLine } from "@/lib/exam-types";

export type ResultReport = {
  institutionName: string;
  examTitle: string;
  candidateName: string;
  rollNumber: string;
  total: number;
  maxTotal: number;
  version: number;
  reason: string | null;
  publishedAt: string;
  verifyCode: string;
  verifyUrl: string;
  lines: ResultLine[];
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const QR_SIZE = 120;
const INK = rgb(0.19, 0.19, 0.19);
const SOFT = rgb(0.42, 0.42, 0.42);
const PERCENT = 100;

// Standard PDF fonts only cover Latin-1, so anything else is dropped rather than breaking the file.
function printable(text: string): string {
  return text.replace(/[^\x20-\x7E -ÿ]/g, "");
}

export async function renderResultPdf(report: ResultReport): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${printable(report.examTitle)} result`);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = PAGE_HEIGHT - MARGIN;

  const write = (text: string, size: number, font = regular, color = INK) => {
    page.drawText(printable(text), { x: MARGIN, y, size, font, color });
    y -= size + 10;
  };

  write(report.institutionName, 12, regular, SOFT);
  write(report.examTitle, 22, bold);
  write(`${report.candidateName} · Roll ${report.rollNumber}`, 13);
  write(`Published ${formatDate(report.publishedAt)} · Result version ${report.version}`, 11, regular, SOFT);
  if (report.reason) write(`Why this version: ${report.reason}`, 11, regular, SOFT);
  y -= 8;
  write(
    `${formatMarks(report.total)} of ${report.maxTotal}  (${Math.round((report.total / report.maxTotal) * PERCENT)}%)`,
    28,
    bold,
  );
  y -= 6;

  write("Question            Marks", 11, bold, SOFT);
  for (const line of [...report.lines].sort((a, b) => a.position - b.position)) {
    page.drawText(`Q${line.position}`, { x: MARGIN, y, size: 11, font: regular, color: INK });
    page.drawText(`${formatMarks(line.marks_awarded)} of ${line.marks}`, { x: MARGIN + 110, y, size: 11, font: regular, color: INK });
    y -= 18;
  }

  const qrPng = await QRCode.toBuffer(report.verifyUrl, { type: "png", margin: 1, width: QR_SIZE * 2 });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: PAGE_WIDTH - MARGIN - QR_SIZE, y: MARGIN + 24, width: QR_SIZE, height: QR_SIZE });
  page.drawText("Scan to check this result is genuine", { x: MARGIN, y: MARGIN + 70, size: 11, font: bold, color: INK });
  page.drawText(printable(report.verifyUrl), { x: MARGIN, y: MARGIN + 52, size: 9, font: regular, color: SOFT });
  page.drawText(`Verify code ${report.verifyCode}`, { x: MARGIN, y: MARGIN + 36, size: 11, font: regular, color: INK });

  return pdf.save();
}
