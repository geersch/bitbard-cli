import { defineCommand } from 'citty';
import { readFile } from 'node:fs/promises';
import { chalk } from '../../util/chalk.js';
import { spinner } from '../../util/spinner.js';
import { savePdf } from '../../util/pdf/save-pdf.js';
import { saveMarkdownPdf } from '../../util/pdf/save-markdown-pdf.js';

export default defineCommand({
  meta: {
    name: 'convert',
    description: 'Convert text or markdown file to a PDF file',
  },
  args: {
    output: {
      type: 'positional',
      description: 'Output PDF file path (e.g. output.pdf)',
      required: true,
    },
    text: {
      type: 'string',
      alias: ['t'],
      description: 'Inline text to convert (mutually exclusive with --file)',
      required: false,
    },
    markdown: {
      type: 'boolean',
      alias: ['m'],
      description: 'Treat inline --text as markdown (ignored when --file is used)',
      required: false,
      default: false,
    },
    file: {
      type: 'string',
      alias: ['f'],
      description: 'Path to a .txt or .md file to convert (mutually exclusive with --text)',
      required: false,
    },
  },
  async run({ args }) {
    if (args.file && args.text) {
      console.error('Error: provide either --text or --file, not both.');
      process.exit(1);
    }

    let text: string;
    let isMarkdown = false;

    if (args.file) {
      isMarkdown = args.file.endsWith('.md');
      const isText = args.file.endsWith('.txt');

      if (!isText && !isMarkdown) {
        console.error('Error: --file must be a .txt or .md file.');
        process.exit(1);
      }
      text = await readFile(args.file, 'utf8');
    } else if (args.text) {
      text = args.text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      isMarkdown = !!args.markdown;
    } else {
      console.error('Error: provide --text <string> or --file <path>.');
      process.exit(1);
    }

    const output = args.output as string;
    if (!output.endsWith('.pdf')) {
      console.error('Error: output file must have a .pdf extension.');
      process.exit(1);
    }

    const stop = spinner('Generating PDF');
    try {
      if (isMarkdown) {
        await saveMarkdownPdf(text, output);
      } else {
        await savePdf(text, output);
      }
      stop(`PDF saved to ${chalk.bold(output)}`);
    } catch (err) {
      stop('Failed to generate PDF', false);
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
});
