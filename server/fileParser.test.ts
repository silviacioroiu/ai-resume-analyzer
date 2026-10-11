import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { DOCX_MIME, extractTextFromFile, PDF_MIME } from "./fileParser";

const fixture = (name: string) =>
  readFileSync(path.join(import.meta.dirname, "__fixtures__", name));

describe("extractTextFromFile", () => {
  it("extracts text from a PDF", async () => {
    const text = await extractTextFromFile(fixture("resume.pdf"), PDF_MIME);
    expect(text).toContain("Silvia Cioroiu");
  });

  it("extracts text from a LaTeX-generated PDF", async () => {
    const text = await extractTextFromFile(
      fixture("resume-latex.pdf"),
      PDF_MIME
    );
    expect(text).toContain("LaTeX resume");
  });

  it("reports corrupted PDFs with a readable error", async () => {
    await expect(
      extractTextFromFile(Buffer.from("%PDF-1.4 garbage"), PDF_MIME)
    ).rejects.toThrow(/Could not read/);
  });

  it("extracts text from a DOCX", async () => {
    const text = await extractTextFromFile(fixture("resume.docx"), DOCX_MIME);
    expect(text).toContain("DOCX resume");
  });

  it("rejects unsupported MIME types", async () => {
    await expect(
      extractTextFromFile(Buffer.from("x"), "image/png")
    ).rejects.toThrow(/Unsupported/);
  });
});
