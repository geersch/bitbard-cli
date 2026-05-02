import { writeFile } from "node:fs/promises";
import { convertMarkdown } from "./convert-markdown.js";

export async function saveMarkdownPdf(markdown: string, filePath: string): Promise<void> {
  const buffer = await convertMarkdown(markdown);
  await writeFile(filePath, buffer);
}
