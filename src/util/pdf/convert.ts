import PDFDocument from "pdfkit";

export function convert(text: string): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>();

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);

  doc.text(text);
  doc.end();

  return promise;
}
