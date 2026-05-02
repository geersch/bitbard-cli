import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { savePdf } from "../../util/pdf/save-pdf.js";

export default defineCommand({
  meta: {
    name: "convert",
    description: "Convert text to a PDF file",
  },
  args: {
    output: {
      type: "positional",
      description: "Output PDF file path (e.g. output.pdf)",
      required: true,
    },
    text: {
      type: "string",
      alias: ["t"],
      description: "Inline text to convert (mutually exclusive with --file)",
      required: false,
    },
    file: {
      type: "string",
      alias: ["f"],
      description: "Path to a .txt file to convert (mutually exclusive with --text)",
      required: false,
    },
  },
  async run({ args }) {
    if (args.file && args.text) {
      console.error("Error: provide either --text or --file, not both.");
      process.exit(1);
    }
    if (!args.file && !args.text) {
      console.error("Error: provide --text <string> or --file <path>.");
      process.exit(1);
    }

    let text: string;

    if (args.file) {
      if (!args.file.endsWith(".txt")) {
        console.error("Error: --file must be a .txt file.");
        process.exit(1);
      }
      text = await readFile(args.file, "utf8");
    } else {
      text = args.text as string;
    }

    const output = args.output as string;
    if (!output.endsWith(".pdf")) {
      console.error("Error: output file must have a .pdf extension.");
      process.exit(1);
    }

    await savePdf(text, output);
    console.log(`PDF saved to ${output}`);
  },
});
