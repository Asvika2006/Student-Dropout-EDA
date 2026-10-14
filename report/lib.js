// Helper library for building the Word report with docx-js
const fs = require('fs');
const path = require('path');
const D = require('docx');
const { Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, WidthType, ShadingType,
  BorderStyle, HeadingLevel, LevelFormat } = D;

const ROOT = path.resolve(__dirname, '..');
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'outputs', 'results.json'), 'utf8'));
const FIGDIR = path.join(ROOT, 'outputs', 'figures');
const TABDIR = path.join(ROOT, 'outputs', 'tables');
const FONT = 'Times New Roman';
const W = 9638; // content width in DXA (A4, 0.79" margins)
const NAVY = '1F3864', BLUE = '2E74B5';

// ---------------------------------------------------------------- number helpers
const f0 = (x) => Math.round(x).toLocaleString('en-US');
const f1 = (x) => Number(x).toFixed(1);
const f2 = (x) => Number(x).toFixed(2);
const f3 = (x) => Number(x).toFixed(3);
const f4 = (x) => Number(x).toFixed(4);
const pc = (x, d = 1) => (100 * x).toFixed(d) + '%';

// ---------------------------------------------------------------- text
function runs(text, o = {}) {
  // **bold** and __italic__ inline markup
  const out = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__)/g;
  text.split(re).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**')) out.push(new TextRun({ text: part.slice(2, -2), bold: true, font: o.font || FONT, size: o.size || 22, color: o.color }));
    else if (part.startsWith('__')) out.push(new TextRun({ text: part.slice(2, -2), italics: true, font: o.font || FONT, size: o.size || 22, color: o.color }));
    else out.push(new TextRun({ text: part, font: o.font || FONT, size: o.size || 22, bold: o.bold, italics: o.italics, color: o.color }));
  });
  return out;
}

const HEADINGS = [];
function H1(text) {
  HEADINGS.push({ level: 1, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT })], keepNext: true });
}
function H2(text) {
  HEADINGS.push({ level: 2, text });
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT })], keepNext: true });
}
function P(text, o = {}) {
  return new Paragraph({ children: runs(text, o), alignment: o.align || AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 120, line: 276 }, keepNext: o.keepNext });
}
function bullets(items) {
  return items.map((t) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: runs(t), alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 264 } }));
}
function obs(text) {
  return new Paragraph({
    children: [new TextRun({ text: 'Observation: ', bold: true, font: FONT, size: 21 }), ...runs(text, { size: 21 })],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 160, line: 264 },
    shading: { type: ShadingType.CLEAR, fill: 'E8F0FB', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLUE, space: 6 } },
    indent: { left: 140, right: 60 },
  });
}
function code(src) {
  const lines = src.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  return lines.map((l, i) => new Paragraph({
    children: [new TextRun({ text: l === '' ? ' ' : l, font: 'Consolas', size: 16 })],
    spacing: { after: 0, line: 228 },
    shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'A6A6A6', space: 4 } },
    indent: { left: 100 },
    keepLines: true, keepNext: i < lines.length - 1,
  })).concat([new Paragraph({ children: [], spacing: { after: 80 } })]);
}

// ---------------------------------------------------------------- figures
let figNo = 0;
function imgDims(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
function fig(name, caption, maxW = 600, maxH = 640) {
  const file = path.join(FIGDIR, name + '.png');
  const [w0, h0] = imgDims(file);
  let w = maxW, h = (w * h0) / w0;
  if (h > maxH) { h = maxH; w = (h * w0) / h0; }
  figNo += 1;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true,
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: Math.round(w), height: Math.round(h) },
        altText: { title: caption, description: caption, name } })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: `Figure ${figNo}: ${caption}`, italics: true, font: FONT, size: 20 })] }),
  ];
}

// ---------------------------------------------------------------- tables
const thin = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
let tabNo = 0;
function table(headers, rows, o = {}) {
  const n = headers.length;
  let widths = o.widths;
  if (!widths) widths = headers.map(() => Math.floor(W / n));
  const tot = widths.reduce((a, b) => a + b, 0);
  widths = widths.map((w) => Math.round((w * W) / tot));
  widths[widths.length - 1] += W - widths.reduce((a, b) => a + b, 0);
  const sz = o.size || 18;
  const mk = (txt, i, isHead, rowIdx) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders,
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    shading: isHead ? { type: ShadingType.CLEAR, fill: NAVY, color: 'auto' } : (rowIdx % 2 ? { type: ShadingType.CLEAR, fill: 'F2F6FC', color: 'auto' } : undefined),
    children: [new Paragraph({
      alignment: (o.left && o.left.includes(i)) || i === 0 && !o.centerFirst ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: [new TextRun({ text: String(txt), font: FONT, size: sz, bold: isHead || (o.boldFirst && i === 0), color: isHead ? 'FFFFFF' : undefined })],
    })],
  });
  const trs = [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => mk(h, i, true, 0)) })];
  rows.forEach((r, ri) => trs.push(new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, ri)) })));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}
function tcap(text) {
  tabNo += 1;
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 }, keepNext: true,
    children: [new TextRun({ text: `Table ${tabNo}: ${text}`, bold: true, font: FONT, size: 20 })] });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });

function csv(name) {
  const t = fs.readFileSync(path.join(TABDIR, name + '.csv'), 'utf8').trim().split(/\r?\n/);
  const rows = t.map((l) => l.split(','));
  return { headers: rows[0], rows: rows.slice(1) };
}
// build a table from a CSV file: opts.cols = column indexes, opts.rename = header names, opts.fmt = {colIndex: fn}
function csvTable(name, o = {}) {
  const { headers, rows } = csv(name);
  const cols = o.cols || headers.map((_, i) => i);
  const hs = cols.map((c, k) => (o.rename && o.rename[k]) || headers[c]);
  const rs = rows.slice(0, o.limit || rows.length).map((r) => cols.map((c) => {
    let v = r[c];
    if (o.fmt && o.fmt[c]) v = o.fmt[c](v);
    return v;
  }));
  return table(hs, rs, o);
}
const num = (d) => (v) => (v === '' || isNaN(Number(v)) ? v : Number(v).toFixed(d));
const int = (v) => (isNaN(Number(v)) ? v : Number(v).toLocaleString('en-US'));

module.exports = { D, R, W, FONT, NAVY, BLUE, f0, f1, f2, f3, f4, pc, runs, H1, H2, P, bullets, obs, code, fig, table, tcap, gap, csv, csvTable, num, int,
  HEADINGS, ROOT, resetCounters: () => { figNo = 0; tabNo = 0; HEADINGS.length = 0; } };
