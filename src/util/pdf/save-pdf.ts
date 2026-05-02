import { writeFile } from 'node:fs/promises';
import { convert } from './convert.js';

export async function savePdf(text: string, filePath: string): Promise<void> {
  const buffer = await convert(text);
  await writeFile(filePath, buffer);
}
