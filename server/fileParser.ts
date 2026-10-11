import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const SUPPORTED_MIME_TYPES = [PDF_MIME, DOCX_MIME] as const;

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    ({ text } = await extractText(pdf, { mergePages: true }));
  } catch {
    throw new Error(
      "Could not read the PDF. Is the file corrupted or password-protected?"
    );
  }
  if (!text.trim()) {
    throw new Error(
      "No text found in the PDF. Scanned/image-only PDFs are not supported."
    );
  }
  return text.trim();
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim();
  if (!text) {
    throw new Error("No text found in the DOCX file.");
  }
  return text;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === PDF_MIME) return extractTextFromPDF(buffer);
  if (mimeType === DOCX_MIME) return extractTextFromDOCX(buffer);
  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}
