import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  Document,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import { NO_DATA_MESSAGE, SECTIONS, collectSectionRows, headerValues } from "./mapping";

export type RenderDocumentOptions = {
  rows: Array<Record<string, string | undefined>>;
  title: string;
  outputPath: string;
};

const A4_WIDTH_TWIPS = 11_906;
const A4_HEIGHT_TWIPS = 16_838;
const TWO_CENTIMETERS_TWIPS = 1_134;
const BODY_FONT_SIZE_HALF_POINTS = 22;
const SECTION_FONT_SIZE_HALF_POINTS = 24;
const TITLE_FONT_SIZE_HALF_POINTS = 32;
const SINGLE_LINE_SPACING_TWIPS = 240;

function fieldTable(rows: Array<[string, string]>): Table {
  return new Table({
    style: "TableGrid",
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun(label)] })]
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun(value)] })]
            })
          ]
        })
    )
  });
}

function participantChildren(row: Record<string, string | undefined>, title: string): Array<Paragraph | Table> {
  const [namn, pnr] = headerValues(row);
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      children: [new TextRun({ text: title, size: TITLE_FONT_SIZE_HALF_POINTS })]
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Namn: ${namn}    Personnummer: ${pnr}`,
          bold: true
        })
      ]
    })
  ];

  for (const section of SECTIONS) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            size: SECTION_FONT_SIZE_HALF_POINTS
          })
        ]
      })
    );

    const sectionRows = collectSectionRows(section, row);
    if (sectionRows.length > 0) {
      children.push(fieldTable(sectionRows));
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: NO_DATA_MESSAGE,
              italics: true,
              size: BODY_FONT_SIZE_HALF_POINTS
            })
          ]
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  return children;
}

export async function renderDocument(options: RenderDocumentOptions): Promise<void> {
  const children: Array<Paragraph | Table> = [];
  for (const [index, row] of options.rows.entries()) {
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(...participantChildren(row, options.title));
  }

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: BODY_FONT_SIZE_HALF_POINTS
          },
          paragraph: {
            spacing: {
              line: SINGLE_LINE_SPACING_TWIPS,
              lineRule: LineRuleType.AUTO
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: A4_WIDTH_TWIPS,
              height: A4_HEIGHT_TWIPS
            },
            margin: {
              top: TWO_CENTIMETERS_TWIPS,
              bottom: TWO_CENTIMETERS_TWIPS,
              left: TWO_CENTIMETERS_TWIPS,
              right: TWO_CENTIMETERS_TWIPS
            }
          }
        },
        children
      }
    ]
  });

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, await Packer.toBuffer(document));
}
