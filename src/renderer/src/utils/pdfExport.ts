import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// [id, occurred_at, location_name, class_name, child_name, injury_type_name, description]
export type IncidentRow = [number, string, string, string, string, string, string]

export type MatrixData = {
  slotLabels: string[]
  locations: string[]
  injuryTypes: string[]
  locationMatrix: Record<string, Record<string, number>>
  injuryMatrix: Record<string, Record<string, number>>
}

const ROWS_PER_PAGE = 30

export function splitIncidentsIntoPages(incidents: IncidentRow[]): IncidentRow[][] {
  if (incidents.length === 0) return [[]]
  const pages: IncidentRow[][] = []
  for (let i = 0; i < incidents.length; i += ROWS_PER_PAGE) {
    pages.push(incidents.slice(i, i + ROWS_PER_PAGE))
  }
  return pages
}

export async function buildPdfDocument(pageElements: HTMLElement[]): Promise<number[]> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1123, 794] })

  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) pdf.addPage([1123, 794], 'landscape')
    const canvas = await html2canvas(pageElements[i], {
      scale: 1,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, 1123, 794)
  }

  const arrayBuffer = pdf.output('arraybuffer')
  return Array.from(new Uint8Array(arrayBuffer))
}

export function buildPdfFileName(from: string): string {
  if (!from) return 'report.pdf'
  const yyyymm = from.slice(0, 7).replace('-', '')
  return `report_${yyyymm}.pdf`
}
