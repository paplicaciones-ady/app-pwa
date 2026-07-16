export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill?: boolean;
    tension?: number;
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

const CHART_KEYWORDS =
  /gráfico|grafico|chart|tendencia|trend|comparativ|visualiz|línea|linea|barra|pie|doughnut|histograma|evolución|evolucion/i;

const MARKDOWN_TABLE_LINE = /^\s*\|.+\|/;

function parseColNum(s: string): number | null {
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseMarkdownTable(tableLines: string[]): { headers: string[]; rows: string[][] } | null {
  if (tableLines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

  const headers = parseRow(tableLines[0]);
  let dataStart = 1;

  if (tableLines.length > 1 && /^[\s|:-]+$/.test(tableLines[1])) {
    dataStart = 2;
  }

  const rows: string[][] = [];
  for (let i = dataStart; i < tableLines.length; i++) {
    rows.push(parseRow(tableLines[i]));
  }

  return { headers, rows };
}

function extractChartData(fullText: string): ChartData | null {
  const lines = fullText.split('\n');
  const tableLines: string[] = [];

  for (const line of lines) {
    if (MARKDOWN_TABLE_LINE.test(line)) {
      tableLines.push(line);
    }
  }

  if (tableLines.length < 3) return null;

  const table = parseMarkdownTable(tableLines);
  if (!table || table.headers.length < 2) return null;

  let numericCol = -1;
  for (let i = 1; i < table.headers.length; i++) {
    const sample = table.rows.slice(0, 3).map((r) => r[i]);
    if (sample.some((v) => v && /\d/.test(v) && parseColNum(v) !== null)) {
      numericCol = i;
      break;
    }
  }
  if (numericCol === -1) return null;

  const labels: string[] = [];
  const data: number[] = [];

  for (const row of table.rows) {
    const label = row[0] ?? '';
    const val = parseColNum(row[numericCol] ?? '');
    if (label && val !== null) {
      labels.push(label.replace(/\*\*/g, ''));
      data.push(val);
    }
  }

  if (labels.length < 2 || data.length < 2) return null;

  const datasetLabel = table.headers[numericCol]?.replace(/\*\*/g, '') ?? 'Datos';

  return {
    type: 'bar',
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        backgroundColor: 'rgba(225, 18, 37, 0.7)',
        borderColor: '#E11225',
      },
    ],
  };
}

function detectAsciiChart(fullText: string): ChartData | null {
  const chartLines = fullText
    .split('\n')
    .filter((line) => /[●●◆▪▸►☑✓✔✗✘]/.test(line) && /\|/.test(line));
  if (chartLines.length < 3) return null;

  const labels: string[] = [];
  const data: number[] = [];

  for (const line of chartLines) {
    const numMatch = line.match(/^[\s]*(\d[\d.,]*)/);
    if (numMatch) {
      const val = parseColNum(numMatch[1]);
      if (val !== null) {
        labels.push(`${labels.length + 1}`);
        data.push(val);
      }
    }
  }

  if (labels.length < 2) return null;

  return {
    type: 'line',
    labels,
    datasets: [
      {
        label: 'Datos',
        data,
        fill: false,
        tension: 0.3,
        borderColor: '#E11225',
        backgroundColor: 'rgba(225, 18, 37, 0.1)',
      },
    ],
  };
}

export function extractChartDataFromText(text: string): ChartData | null {
  if (!text || text.length < 50) return null;

  const hasChartKeyword = CHART_KEYWORDS.test(text);
  const tableData = extractChartData(text);

  if (tableData && hasChartKeyword) {
    return tableData;
  }

  if (hasChartKeyword) {
    const asciiData = detectAsciiChart(text);
    if (asciiData) return asciiData;
  }

  return null;
}
