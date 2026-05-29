import { jsPDF } from 'jspdf'
import autoTableModule from 'jspdf-autotable'
import { readFileSync } from 'fs'

// CommonJS require() では .default に関数が入るため両方対応する
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoTable: typeof autoTableModule = (autoTableModule as any).default ?? autoTableModule

export type IncidentRow = [number, string, string, string, string, string, string, string]
//                         id    occ   type  loc   cls   child  inj   desc

let cachedFont: string | null = null

function loadFontBase64(): string {
  if (cachedFont !== null) return cachedFont
  const fontPath = 'C:\\Windows\\Fonts\\NotoSansJP-VF.ttf'
  try {
    cachedFont = readFileSync(fontPath).toString('base64')
    return cachedFont
  } catch {
    throw new Error(`フォントファイルが見つかりません: ${fontPath}`)
  }
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
  typeSuffix?: string,
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

    drawPageHeader(doc, `${typeSuffix ?? ''}事案一覧`, periodLabel, `${startPageNum + pi} / ${totalPages}`)

    const body = pages[pi].map(([, occ, type, loc, cls, child, inj, desc]) => [
      formatOccurredAt(String(occ)), type, loc, cls, child, inj, desc,
    ])

    autoTable(doc, {
      startY: 42,
      margin: { left: 28, right: 28 },
      head: [['発生日時', '種別', '場所', 'クラス', '園児名', 'けがの種類', '事故内容']],
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
        0: { cellWidth: 110 },
        1: { cellWidth: 64 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
        4: { cellWidth: 60 },
        5: { cellWidth: 76 },
        6: { cellWidth: 'auto' },
      },
    })
  }
}

export async function buildPdfWithTextPages(payload: {
  incidentsByType: { type: string; incidents: IncidentRow[] }[]
  periodLabel: string
  chartImagesByType: { type: string; imageBytes: Uint8Array }[]
}): Promise<Uint8Array> {
  const { incidentsByType, periodLabel, chartImagesByType } = payload
  const fontBase64 = loadFontBase64()
  const doc = makeDoc(fontBase64)

  let totalPages = 0
  for (const { incidents } of incidentsByType) {
    totalPages += incidents.length === 0 ? 1 : Math.ceil(incidents.length / 30)
  }
  totalPages += chartImagesByType.length

  let currentPage = 1
  let isFirstPage = true

  for (const { type, incidents } of incidentsByType) {
    buildIncidentPages(doc, incidents, periodLabel, currentPage, totalPages, isFirstPage, type)
    const pageCount = incidents.length === 0 ? 1 : Math.ceil(incidents.length / 30)
    currentPage += pageCount
    isFirstPage = false
  }

  for (const { type, imageBytes } of chartImagesByType) {
    doc.addPage()
    drawPageHeader(doc, `${type} 集計グラフ`, periodLabel, `${currentPage} / ${totalPages}`)
    const base64 = Buffer.from(imageBytes).toString('base64')
    doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 28, 44, 841.89 - 56, 595.28 - 60)
    currentPage++
  }

  const output = doc.output('arraybuffer')
  return new Uint8Array(output)
}
