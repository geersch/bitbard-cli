import PDFDocument from "pdfkit";
import { lexer, type Token, type Tokens } from "marked";

const FONT_NORMAL = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_ITALIC = "Helvetica-Oblique";
const FONT_BOLD_ITALIC = "Helvetica-BoldOblique";
const FONT_MONO = "Courier";

const HEADING_SIZES: Record<number, number> = {
  1: 24,
  2: 20,
  3: 16,
  4: 14,
  5: 12,
  6: 11,
};

const BODY_SIZE = 12;
const CODE_SIZE = 10;
const LIST_INDENT = 20;

// Vertical spacing between blocks in points.
const GAP_AFTER_HEADING = 6;
const GAP_AFTER_PARAGRAPH = 8;
const GAP_AFTER_CODE = 8;
const GAP_AFTER_LIST = 6;

type InlineStyle = { bold: boolean; italic: boolean; code: boolean };
type InlineRun = { text: string; style: InlineStyle; link?: string };

// Flatten an inline token tree into a list of (text, style) runs.
// This lets us render a paragraph in a single continued chain and close it
// with a real newline so pdfkit advances y correctly.
function collectInlineRuns(tokens: Token[], style: InlineStyle, runs: InlineRun[]): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const t = token as Tokens.Text;
        if (t.tokens && t.tokens.length > 0) {
          collectInlineRuns(t.tokens, style, runs);
        } else {
          runs.push({ text: t.text, style });
        }
        break;
      }
      case "strong": {
        const t = token as Tokens.Strong;
        collectInlineRuns(t.tokens ?? [], { ...style, bold: true }, runs);
        break;
      }
      case "em": {
        const t = token as Tokens.Em;
        collectInlineRuns(t.tokens ?? [], { ...style, italic: true }, runs);
        break;
      }
      case "codespan": {
        const t = token as Tokens.Codespan;
        runs.push({ text: t.text, style: { ...style, code: true } });
        break;
      }
      case "link": {
        const t = token as Tokens.Link;
        runs.push({ text: t.text || t.href, style, link: t.href });
        break;
      }
      case "br": {
        runs.push({ text: "\n", style });
        break;
      }
      default: {
        const raw = (token as { text?: string; raw?: string }).text
          ?? (token as { raw?: string }).raw ?? "";
        if (raw) runs.push({ text: raw, style });
        break;
      }
    }
  }
}

function applyRunFont(doc: InstanceType<typeof PDFDocument>, style: InlineStyle): void {
  if (style.code) {
    doc.font(FONT_MONO).fontSize(CODE_SIZE);
  } else if (style.bold && style.italic) {
    doc.font(FONT_BOLD_ITALIC).fontSize(BODY_SIZE);
  } else if (style.bold) {
    doc.font(FONT_BOLD).fontSize(BODY_SIZE);
  } else if (style.italic) {
    doc.font(FONT_ITALIC).fontSize(BODY_SIZE);
  } else {
    doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
  }
}

// Render a list of inline runs as a single continued chain, then close it
// with a real "\n" so pdfkit always advances y past the last line.
function renderRuns(
  doc: InstanceType<typeof PDFDocument>,
  runs: InlineRun[],
  extraOptions: Record<string, unknown> = {}
): void {
  if (runs.length === 0) return;

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const isLast = i === runs.length - 1;
    applyRunFont(doc, run.style);

    const opts: Record<string, unknown> = { continued: true };
    if (run.link) {
      opts.underline = true;
      opts.link = run.link;
      doc.fillColor("blue");
    }
    if (run.style.code) {
      doc.fillColor("#333333");
    }

    if (isLast) {
      // Close the chain with the last real run (not an empty string) so
      // pdfkit correctly advances y. Apply paragraph spacing here.
      if (run.link) doc.fillColor("blue");
      if (run.style.code) doc.fillColor("#333333");
      doc.text(run.text, { continued: false, ...extraOptions });
    } else {
      doc.text(run.text, opts);
    }

    if (run.link || run.style.code) {
      doc.fillColor("black");
    }
  }
}

function renderToken(doc: InstanceType<typeof PDFDocument>, token: Token, listDepth = 0): void {
  switch (token.type) {
    case "heading": {
      const t = token as Tokens.Heading;
      const size = HEADING_SIZES[t.depth] ?? BODY_SIZE;
      const runs: InlineRun[] = [];
      collectInlineRuns(t.tokens ?? [], { bold: true, italic: false, code: false }, runs);
      doc.font(FONT_BOLD).fontSize(size);
      renderRuns(doc, runs, { paragraphGap: GAP_AFTER_HEADING });
      doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
      break;
    }

    case "paragraph": {
      const t = token as Tokens.Paragraph;
      const runs: InlineRun[] = [];
      collectInlineRuns(t.tokens ?? [], { bold: false, italic: false, code: false }, runs);
      doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
      renderRuns(doc, runs, { paragraphGap: GAP_AFTER_PARAGRAPH });
      break;
    }

    case "blockquote": {
      const t = token as Tokens.Blockquote;
      const startY = doc.y;
      const xIndent = doc.page.margins.left + 12;
      doc.save();
      doc.font(FONT_ITALIC).fontSize(BODY_SIZE).fillColor("#555555");
      doc.x = xIndent;
      for (const inner of t.tokens) {
        renderToken(doc, inner, listDepth);
      }
      const endY = doc.y;
      doc
        .restore()
        .save()
        .moveTo(doc.page.margins.left + 3, startY)
        .lineTo(doc.page.margins.left + 3, endY)
        .strokeColor("#aaaaaa")
        .lineWidth(3)
        .stroke()
        .restore();
      doc.font(FONT_NORMAL).fontSize(BODY_SIZE).fillColor("black");
      break;
    }

    case "code": {
      const t = token as Tokens.Code;
      doc
        .font(FONT_MONO)
        .fontSize(CODE_SIZE)
        .fillColor("#333333")
        .text(t.text, { lineGap: 2, paragraphGap: GAP_AFTER_CODE });
      doc.font(FONT_NORMAL).fontSize(BODY_SIZE).fillColor("black");
      break;
    }

    case "list": {
      const t = token as Tokens.List;
      t.items.forEach((item, idx) => {
        renderListItem(doc, item, listDepth, t.ordered, idx + (Number(t.start) || 1));
      });
      if (listDepth === 0) {
        doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
        doc.text(" ", { paragraphGap: GAP_AFTER_LIST });
      }
      break;
    }

    case "hr": {
      const y = doc.y;
      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.width - doc.page.margins.right, y)
        .strokeColor("#cccccc")
        .lineWidth(1)
        .stroke();
      doc.font(FONT_NORMAL).fontSize(BODY_SIZE).text(" ", { paragraphGap: GAP_AFTER_PARAGRAPH });
      break;
    }

    case "space": {
      // Spacing is handled per-block via paragraphGap
      break;
    }

    case "html": {
      break;
    }

    default: {
      const raw = (token as { raw?: string }).raw;
      if (raw) {
        doc.font(FONT_NORMAL).fontSize(BODY_SIZE).text(raw, { paragraphGap: GAP_AFTER_PARAGRAPH });
      }
      break;
    }
  }
}

function renderListItem(
  doc: InstanceType<typeof PDFDocument>,
  item: Tokens.ListItem,
  depth: number,
  ordered: boolean,
  index: number
): void {
  const indent = doc.page.margins.left + LIST_INDENT * (depth + 1);
  const bullet = ordered ? `${index}.` : "•";
  const bulletWidth = 20;
  const textX = indent + bulletWidth;
  const textWidth = doc.page.width - doc.page.margins.right - textX;

  doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
  doc.text(bullet, indent, doc.y, { width: bulletWidth });
  doc.moveUp();
  doc.x = textX;

  const tokens = item.tokens ?? [];
  for (const t of tokens) {
    if (t.type === "text") {
      const textToken = t as Tokens.Text;
      const runs: InlineRun[] = [];
      collectInlineRuns(textToken.tokens ?? [{ type: "text", text: textToken.text, raw: textToken.text }] as Token[], { bold: false, italic: false, code: false }, runs);
      if (runs.length > 0) {
        doc.font(FONT_NORMAL).fontSize(BODY_SIZE);
        renderRuns(doc, runs, { width: textWidth });
      } else {
        doc.font(FONT_NORMAL).fontSize(BODY_SIZE).text(textToken.text, { width: textWidth });
      }
    } else if (t.type === "list") {
      const nestedList = t as Tokens.List;
      nestedList.items.forEach((nestedItem, idx) => {
        renderListItem(doc, nestedItem, depth + 1, nestedList.ordered, idx + (Number(nestedList.start) || 1));
      });
    } else {
      renderToken(doc, t, depth + 1);
    }
  }
}

export function convertMarkdown(markdown: string): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>();

  const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);

  const tokens = lexer(markdown);
  for (const token of tokens) {
    renderToken(doc, token);
  }

  doc.end();

  return promise;
}
