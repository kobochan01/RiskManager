import { jsPDF } from 'jspdf'
import autoTableModule from 'jspdf-autotable'
import { readFileSync } from 'fs'

// CommonJS require() では .default に関数が入るため両方対応する
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoTable: typeof autoTableModule = (autoTableModule as any).default ?? autoTableModule

export type IncidentRow = [number, string, string, string, string, string, string]

export type MatrixData = {
  slotLabels: string[]
  locations: string[]
  injuryTypes: string[]
  locationMatrix: Record<string, Record<string, number>>
  injuryMatrix: Record<string, Record<string, number>>
}

function loadFontBase64(): string {
  const buf = readFileSync('C:\\Windows\\Fonts\\NotoSansJP-VF.ttf')
  return buf.toString('base64')
}

function makeDoc(fontBase64: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [841.89, 595.28] })
  doc.addFileToVFS('NotoSansJP.ttf', fontBase64)
  doc.addFont('NotoSansJP.ttf', 'NotoSansJP', 'normal')
  doc.setFont('NotoSansJP')
  return doc
}

function formatOccurredAt(raw: string): string {
  const d = new Date(raw.replace(' ', 'T'))
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}

function drawPageHeader(doc: jsPDF, title: string, periodLabel: string, pageNum?: string, titleSuffix?: string): void {
  const PAGE_W = 841.89
  doc.setFont('NotoSansJP')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(title, 28, 32)

  let periodX = 28 + doc.getTextWidth(title) + 8
  if (titleSuffix) {
    doc.setFontSize(9)
    doc.setTextColor(85, 85, 85)
    doc.text(titleSuffix, periodX, 32)
    periodX += doc.getTextWidth(titleSuffix) + 8
  }

  doc.setFontSize(9)
  doc.setTextColor(85, 85, 85)
  doc.text(`集計期間：${periodLabel}`, periodX, 32)

  if (pageNum) {
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const w = doc.getTextWidth(pageNum)
    doc.text(pageNum, PAGE_W - 28 - w, 26)
  }
}

function buildIncidentPages(
  doc: jsPDF,
  incidents: IncidentRow[],
  periodLabel: string,
  startPageNum: number,
  totalPages: number,
  isFirstPage: boolean,
): void {
  const ROWS_PER_PAGE = 30
  const pages: IncidentRow[][] = incidents.length === 0
    ? [[]]
    : Array.from({ length: Math.ceil(incidents.length / ROWS_PER_PAGE) }, (_, i) =>
        incidents.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE)
      )

  for (let pi = 0; pi < pages.length; pi++) {
    if (!isFirstPage || pi > 0) doc.addPage()
    isFirstPage = false

    drawPageHeader(doc, 'ヒヤリハット事案一覧', periodLabel, `${startPageNum + pi} / ${totalPages}`)

    const body = pages[pi].map(([, occ, loc, cls, child, inj, desc]) => [
      formatOccurredAt(String(occ)), loc, cls, child, inj, desc,
    ])

    autoTable(doc, {
      startY: 42,
      margin: { left: 28, right: 28 },
      head: [['発生日時', '場所', 'クラス', '園児名', 'けがの種類', '事故内容']],
      body,
      styles: {
        font: 'NotoSansJP',
        fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        overflow: 'ellipsize',
        lineColor: [229, 231, 235] as [number, number, number],
        lineWidth: 0.5,
        minCellHeight: 14,
        valign: 'middle',
      },
      headStyles: {
        font: 'NotoSansJP',
        fontSize: 8,
        fillColor: [30, 64, 175] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'normal',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [240, 244, 255] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 118 },
        1: { cellWidth: 64 },
        2: { cellWidth: 64 },
        3: { cellWidth: 64 },
        4: { cellWidth: 80 },
        5: { cellWidth: 'auto' },
      },
    })
  }
}

function buildMatrixPage(
  doc: jsPDF,
  matrix: MatrixData,
  periodLabel: string,
  slotRange: 'am' | 'pm',
): void {
  const { slotLabels: allSlotLabels, locations, injuryTypes, locationMatrix, injuryMatrix } = matrix
  const slotLabels = allSlotLabels.filter((s) => {
    const h = parseInt(s.slice(0, 2), 10)
    return slotRange === 'am' ? h < 12 : h >= 12
  })

  doc.addPage()
  const rangeLabel = slotRange === 'am' ? '07:00〜11:59' : '12:00〜18:59'
  drawPageHeader(doc, '時間帯別集計表', periodLabel, undefined, `（${rangeLabel}）`)

  if (slotLabels.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(150, 150, 150)
    doc.text('データなし', 400, 300, { align: 'center' })
    return
  }

  // ヘッダー: 2行（場所別グループ / けがの種類別グループ）
  const headRow1: object[] = [
    { content: '時間帯', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: '場所別', colSpan: locations.length, styles: { halign: 'center' } },
    { content: 'けがの種類別', colSpan: injuryTypes.length, styles: { halign: 'center' } },
    { content: '合計', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
  ]
  const headRow2 = [...locations, ...injuryTypes].map(col => ({
    content: col,
    styles: { halign: 'center', fillColor: [59, 95, 192] as [number, number, number] },
  }))

  const body = slotLabels.map(slot => {
    const locRow = locationMatrix[slot] ?? {}
    const injRow = injuryMatrix[slot] ?? {}
    const total = locations.reduce((s, c) => s + (locRow[c] ?? 0), 0)
    return [
      slot,
      ...locations.map(c => (locRow[c] ? String(locRow[c]) : '')),
      ...injuryTypes.map(c => (injRow[c] ? String(injRow[c]) : '')),
      total ? String(total) : '',
    ]
  })

  const totalColIdx = 1 + locations.length + injuryTypes.length

  autoTable(doc, {
    startY: 42,
    margin: { left: 28, right: 28 },
    head: [headRow1, headRow2],
    body,
    styles: {
      font: 'NotoSansJP',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      lineColor: [229, 231, 235] as [number, number, number],
      lineWidth: 0.5,
      minCellHeight: 12,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      font: 'NotoSansJP',
      fontSize: 7,
      fillColor: [30, 64, 175] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'normal',
    },
    alternateRowStyles: {
      fillColor: [240, 244, 255] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 56, halign: 'center' },
      [totalColIdx]: {
        cellWidth: 32,
        halign: 'center',
        fillColor: [219, 234, 254] as [number, number, number],
      },
    },
    didParseCell: (data) => {
      // 合計列を強調
      if (data.section === 'body' && data.column.index === totalColIdx && data.cell.raw) {
        data.cell.styles.fillColor = [219, 234, 254]
      }
    },
  })
}

export async function buildPdfWithTextPages(payload: {
  incidents: IncidentRow[]
  matrix: MatrixData
  periodLabel: string
  chartImageBytes: number[]
}): Promise<number[]> {
  const { incidents, matrix, periodLabel, chartImageBytes } = payload

  const fontBase64 = loadFontBase64()
  const doc = makeDoc(fontBase64)

  const incidentPageCount = incidents.length === 0 ? 1 : Math.ceil(incidents.length / 30)
  const totalPages = incidentPageCount + 3

  buildIncidentPages(doc, incidents, periodLabel, 1, totalPages, true)
  buildMatrixPage(doc, matrix, periodLabel, 'am')
  buildMatrixPage(doc, matrix, periodLabel, 'pm')

  // グラフページ: ヘッダーはテキスト、グラフ本体は画像
  doc.addPage()
  drawPageHeader(doc, 'ヒヤリハット集計グラフ', periodLabel)
  const chartBlob = new Uint8Array(chartImageBytes)
  const base64 = Buffer.from(chartBlob).toString('base64')
  // ヘッダー(44pt)の下からグラフ画像を配置
  doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 0, 44, 841.89, 595.28 - 44)

  const output = doc.output('arraybuffer')
  return Array.from(new Uint8Array(output))
}
